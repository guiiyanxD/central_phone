import { test, expect } from '@playwright/test';
import * as path from 'path';

const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');
const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

// Muestra mínima de un archivo PNG válido en bytes
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

test.describe('Seguridad y Blindaje de Archivos en SIMPLE QR (/configuracion)', () => {
  test.describe('Rol Vendedor (Solo Lectura y Anti-Fraude)', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Vendedor accede en modo solo lectura sin controles para alterar el QR corporativo', async ({ page }) => {
      await page.goto('/configuracion');
      await expect(page.locator('h1')).toContainText('Configuración del Negocio & QR Oficial');
      await expect(page.locator('text=Modo Vendedor (Solo Lectura)')).toBeVisible();
      await expect(page.locator('text=Seguridad Anti-Fraude Activa')).toBeVisible();

      // El input de archivo y el botón para subir no deben existir para el vendedor
      await expect(page.locator('button:has-text("Subir Imagen QR")')).not.toBeVisible();
      await expect(page.locator('input[type="file"]')).not.toBeAttached();
    });
  });

  test.describe('Rol Administrador (Carga y Validación de Archivos)', () => {
    test.use({ storageState: adminAuthFile });

    test('Administrador es bloqueado al intentar subir un archivo SVG o peligroso', async ({ page }) => {
      await page.goto('/configuracion');
      await expect(page.locator('text=Acceso Administrador')).toBeVisible();

      // Intentar subir un SVG simulado
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'malicious.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg onload="alert(1)"><circle cx="10" cy="10" r="10"/></svg>'),
      });

      // Debe mostrar el mensaje de error de formato no permitido
      const alertError = page.locator('.text-rose-700');
      await expect(alertError).toBeVisible();
      await expect(alertError).toContainText('Formato no permitido');
    });

    test('Administrador puede cargar una imagen PNG legítima y guardar los cambios con éxito', async ({ page }) => {
      await page.goto('/configuracion');
      await expect(page.locator('text=Acceso Administrador')).toBeVisible();

      // Cargar el PNG legítimo
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'qr_oficial.png',
        mimeType: 'image/png',
        buffer: VALID_PNG_BUFFER,
      });

      // La imagen debe proyectarse en el visor
      const qrImg = page.locator('img[alt="Código QR Oficial"]');
      await expect(qrImg).toBeVisible({ timeout: 5000 });

      // Guardar la configuración
      const submitBtn = page.locator('button:has-text("Guardar Configuración & QR Oficial")');
      await submitBtn.click();

      // Debe confirmar el guardado exitoso
      await expect(
        page.locator('text=Configuración corporativa y código QR guardados exitosamente.')
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
