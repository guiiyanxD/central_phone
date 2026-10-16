import { BadRequestException } from '@nestjs/common';
import { validateImagePayload } from './image-validator.util';

describe('image-validator.util', () => {
  // Minimal valid binary buffers
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ]);
  const validPngBase64 = `data:image/png;base64,${validPngBuffer.toString('base64')}`;

  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  const validJpegBase64 = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;

  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00, // file length
    0x57, 0x45, 0x42, 0x50, // WEBP
    0x56, 0x50, 0x38, 0x20, // VP8
  ]);
  const validWebpBase64 = `data:image/webp;base64,${validWebpBuffer.toString('base64')}`;

  describe('entradas válidas y nulas', () => {
    it('debe permitir valores nulos o indefinidos sin lanzar excepción', () => {
      expect(() => validateImagePayload(null)).not.toThrow();
      expect(() => validateImagePayload(undefined)).not.toThrow();
      expect(() => validateImagePayload('')).not.toThrow();
      expect(() => validateImagePayload('   ')).not.toThrow();
    });

    it('debe validar exitosamente un PNG legítimo con Magic Bytes correctos', () => {
      expect(() => validateImagePayload(validPngBase64, 'qrOficial')).not.toThrow();
    });

    it('debe validar exitosamente un JPEG legítimo con Magic Bytes correctos', () => {
      expect(() => validateImagePayload(validJpegBase64, 'qrOficial')).not.toThrow();
    });

    it('debe validar exitosamente un WEBP legítimo con Magic Bytes correctos', () => {
      expect(() => validateImagePayload(validWebpBase64, 'qrOficial')).not.toThrow();
    });

    it('debe permitir rutas relativas con extensiones autorizadas', () => {
      expect(() => validateImagePayload('/uploads/qr_oficial.png')).not.toThrow();
      expect(() => validateImagePayload('./images/logo.webp')).not.toThrow();
    });
  });

  describe('detección y bloqueo de ataques y archivos maliciosos', () => {
    it('debe rechazar esquemas javascript: y vbscript:', () => {
      expect(() => validateImagePayload('javascript:alert(1)')).toThrow(BadRequestException);
      expect(() => validateImagePayload('vbscript:msgbox(1)')).toThrow(BadRequestException);
    });

    it('debe rechazar vectores SVG que podrían contener scripts o XSS almacenado', () => {
      expect(() => validateImagePayload('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toThrow(
        BadRequestException,
      );
      expect(() => validateImagePayload('<svg onload="alert(1)"></svg>')).toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar etiquetas <script> y código HTML', () => {
      expect(() => validateImagePayload('<script>window.location="http://evil.com"</script>')).toThrow(
        BadRequestException,
      );
    });

    it('debe rechazar rutas con path traversal o caracteres nulos', () => {
      expect(() => validateImagePayload('/uploads/../../etc/passwd')).toThrow(BadRequestException);
      expect(() => validateImagePayload('/uploads/image.png\0.php')).toThrow(BadRequestException);
    });

    it('debe rechazar extensiones no autorizadas en rutas', () => {
      expect(() => validateImagePayload('/uploads/malicious.exe')).toThrow(BadRequestException);
      expect(() => validateImagePayload('/uploads/script.sh')).toThrow(BadRequestException);
      expect(() => validateImagePayload('/uploads/page.html')).toThrow(BadRequestException);
    });

    it('debe rechazar tipos MIME no autorizados en Data URI (ej: application/pdf)', () => {
      const pdfBase64 = `data:application/pdf;base64,${Buffer.from('test').toString('base64')}`;
      expect(() => validateImagePayload(pdfBase64)).toThrow(BadRequestException);
    });

    it('debe rechazar archivos con extensión/MIME spoofing (PNG declarado pero con contenido de texto plano)', () => {
      const spoofedBase64 = `data:image/png;base64,${Buffer.from('ESTO_NO_ES_UN_PNG_REAL').toString('base64')}`;
      expect(() => validateImagePayload(spoofedBase64)).toThrow(
        /Firma binaria de imagen inválida/,
      );
    });

    it('debe rechazar archivos que excedan el límite de 5MB', () => {
      // 5.5MB simulado en base64
      const largeData = 'A'.repeat(7.5 * 1024 * 1024);
      const largeBase64 = `data:image/png;base64,${largeData}`;
      expect(() => validateImagePayload(largeBase64)).toThrow(
        /excede el límite de tamaño permitido/,
      );
    });
  });
});
