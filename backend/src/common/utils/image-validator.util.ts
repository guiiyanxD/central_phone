import { BadRequestException } from '@nestjs/common';

/**
 * Firmas binarias (Magic Numbers) oficiales para verificación de integridad de archivos
 */
const MAGIC_BYTES = {
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  JPEG: [0xff, 0xd8, 0xff],
  RIFF: [0x52, 0x49, 0x46, 0x46], // R, I, F, F
  WEBP: [0x57, 0x45, 0x42, 0x50], // W, E, B, P
};

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida que una cadena de imagen sea segura:
 * 1. Rechaza rutas con path traversal o esquemas peligrosos (javascript:, vbscript:, svg).
 * 2. Si es Data URI (Base64), verifica prefijo MIME autorizado.
 * 3. Decodifica los bytes de cabecera y verifica Magic Numbers reales (PNG, JPEG, WEBP).
 * 4. Valida tamaño máximo en bytes decodificados.
 */
export function validateImagePayload(
  payload: string | null | undefined,
  fieldName = 'imagen',
): void {
  if (!payload || typeof payload !== 'string' || payload.trim().length === 0) {
    return;
  }

  const clean = payload.trim();

  // 1. Detección de esquemas prohibidos
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.includes('image/svg') ||
    lower.includes('<svg') ||
    lower.includes('<script')
  ) {
    throw new BadRequestException(
      `Tipo de archivo o contenido prohibido en ${fieldName}. Los archivos SVG, scripts y HTML no están permitidos por motivos de seguridad.`,
    );
  }

  // 2. Si es una ruta relativa de archivo existente
  if (clean.startsWith('/') || clean.startsWith('./')) {
    if (clean.includes('..') || clean.includes('\0')) {
      throw new BadRequestException(`Ruta de archivo no autorizada en ${fieldName}.`);
    }
    const ext = clean.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      throw new BadRequestException(
        `Extensión de archivo no permitida en ${fieldName}. Solo se admiten archivos .png, .jpg, .jpeg y .webp.`,
      );
    }
    return;
  }

  // 3. Si es una imagen en Base64 (Data URI)
  if (clean.startsWith('data:')) {
    const matches = clean.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException(
        `Formato Data URI inválido en ${fieldName}. Debe ser data:<mime-type>;base64,<datos>`,
      );
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Tipo MIME no autorizado (${mimeType}) en ${fieldName}. Solo se permiten imágenes PNG, JPEG y WEBP.`,
      );
    }

    // Comprobar tamaño en bytes decodificados
    const estimatedSizeBytes = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `La imagen en ${fieldName} excede el límite de tamaño permitido de 5 MB.`,
      );
    }

    // Decodificar los primeros 32 bytes para inspección de Magic Numbers
    const headerBuffer = Buffer.from(base64Data.slice(0, 48), 'base64');
    if (headerBuffer.length < 8) {
      throw new BadRequestException(`El archivo en ${fieldName} está corrupto o vacío.`);
    }

    let isValidMagic = false;

    // Validación PNG
    if (mimeType === 'image/png') {
      isValidMagic = MAGIC_BYTES.PNG.every((byte, idx) => headerBuffer[idx] === byte);
    }
    // Validación JPEG
    else if (mimeType === 'image/jpeg') {
      isValidMagic = MAGIC_BYTES.JPEG.every((byte, idx) => headerBuffer[idx] === byte);
    }
    // Validación WEBP (RIFF....WEBP)
    else if (mimeType === 'image/webp') {
      const isRiff = MAGIC_BYTES.RIFF.every((byte, idx) => headerBuffer[idx] === byte);
      const isWebp =
        headerBuffer.length >= 12 &&
        MAGIC_BYTES.WEBP.every((byte, idx) => headerBuffer[8 + idx] === byte);
      isValidMagic = isRiff && isWebp;
    }

    if (!isValidMagic) {
      throw new BadRequestException(
        `Firma binaria de imagen inválida (Magic Bytes no coinciden con ${mimeType}). El archivo ha sido manipulado o no es una imagen legítima.`,
      );
    }
  }
}
