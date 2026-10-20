import { test, expect } from '@playwright/test';
import * as path from 'path';

const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');
const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('E2E: Hub de Administración y Optimización de QR en Mostrador', () => {
  test.describe('Sesión de Administrador', () => {
    test.use({ storageState: adminAuthFile });

    test('Banner QR superior en Panel de Operaciones y Modal de proyección ampliado', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('Panel de Operaciones');

      // 1. El banner de Cobro QR Oficial debe estar visible en la parte superior
      const qrBanner = page.locator('[data-testid="banner-qr-oficial"]');
      await expect(qrBanner).toBeVisible();
      await expect(qrBanner).toContainText('Cobro QR Oficial CentralPhone');
      await expect(qrBanner).toContainText('Verificado • Anti-Fraude');

      // 2. Abrir el modal de proyección ampliado
      const projectBtn = qrBanner.getByRole('button', { name: /Proyectar QR Oficial al Cliente/i });
      await expect(projectBtn).toBeVisible();
      await projectBtn.click();

      // 3. Verificar que el modal ampliado está en pantalla
      const qrModal = page.locator('[data-testid="modal-qr-ampliado"]');
      await expect(qrModal).toBeVisible();
      await expect(qrModal).toHaveClass(/max-w-xl/);
      await expect(qrModal).toContainText('QR Oficial CentralPhone');
      await expect(qrModal).toContainText('Banco Receptor:');
      await expect(qrModal).toContainText('Número de Cuenta:');

      // 4. Cerrar modal
      await page.click('button:has-text("Cerrar Vista de Pago")');
      await expect(qrModal).not.toBeVisible();
    });

    test('Navegación fluida hacia el Centro de Administración y portales de mando', async ({ page }) => {
      await page.goto('/');

      // 1. Navbar contiene la pestaña exclusiva "Administración"
      const adminNavTab = page.getByRole('link', { name: 'Administración' });
      await expect(adminNavTab).toBeVisible();
      await adminNavTab.click();

      // 2. Carga del Centro de Administración (/administracion)
      await page.waitForURL('/administracion', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Centro de Administración');
      await expect(page.getByText('Control Maestro')).toBeVisible();

      // 3. Portales presentes
      await expect(page.getByText('Configuración Corporativa & QR Oficial')).toBeVisible();
      await expect(page.getByText('Gestión de Sucursales')).toBeVisible();
      await expect(page.getByText('Reportes Financieros & Rentabilidad')).toBeVisible();
      await expect(page.getByText('Gestión de Personal & Usuarios')).toBeVisible();

      // 4. Navegar a Sucursales desde el hub y retornar
      await page.click('a[href="/sucursales"] button');
      await page.waitForURL('/sucursales', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Gestión de Sucursales');

      // Retorno con enlace de migas de pan
      const returnBtn = page.getByText('Volver a Centro de Administración');
      await expect(returnBtn).toBeVisible();
      await returnBtn.click();
      await page.waitForURL('/administracion', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Centro de Administración');

      // 5. Navegar a Reportes desde el hub y retornar
      await page.click('a[href="/reportes"] button');
      await page.waitForURL('/reportes', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Reporte Financiero y Rentabilidad Neta');

      const returnFromReports = page.getByText('Volver a Centro de Administración');
      await expect(returnFromReports).toBeVisible();
      await returnFromReports.click();
      await page.waitForURL('/administracion', { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Centro de Administración');
    });
  });

  test.describe('Sesión de Vendedor (Aislamiento de Tareas y Control RBAC)', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Vendedor no visualiza pestaña Administración y es bloqueado por RBAC en /administracion', async ({ page }) => {
      await page.goto('/');

      // 1. Pestaña "Administración" NO debe existir en el navbar del vendedor
      await expect(page.getByRole('link', { name: 'Administración' })).not.toBeVisible();

      // 2. El vendedor SÍ cuenta con el banner superior para proyectar el QR oficial al cliente
      const qrBanner = page.locator('[data-testid="banner-qr-oficial"]');
      await expect(qrBanner).toBeVisible();
      await qrBanner.getByRole('button', { name: /Proyectar QR Oficial/i }).click();

      const qrModal = page.locator('[data-testid="modal-qr-ampliado"]');
      await expect(qrModal).toBeVisible();
      await page.click('button:has-text("Cerrar Vista de Pago")');
      await expect(qrModal).not.toBeVisible();

      // 3. Si el vendedor intenta entrar directamente a /administracion por URL, se bloquea
      await page.goto('/administracion');
      await expect(page.locator('h1')).toContainText('Acceso Restringido a Administradores');
      await expect(page.getByRole('button', { name: /Ir a Punto de Venta/i })).toBeVisible();
      await expect(page.getByText('Control Maestro')).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Centro de Administración' })).not.toBeVisible();
    });
  });
});
