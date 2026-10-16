import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');
const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');

test.describe('Fase 4: Épica 5 (Línea de Vida, Anulación de Venta y Reportes)', () => {
  test.describe('Vendedor: Restricciones y Trazabilidad', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Vendedor no visualiza acceso a "Reportes" en la barra de navegación', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('header a', { hasText: 'Reportes' })).not.toBeVisible();
    });

    test('Vendedor es bloqueado al intentar acceder directamente a /reportes', async ({ page }) => {
      await page.goto('/reportes');
      await expect(page.locator('h1')).toContainText('Acceso Restringido a Finanzas');
      await expect(page.locator('text=exclusivamente para Administradores')).toBeVisible();
    });

    test('Vendedor puede consultar la línea de vida de un IMEI desde /inventario', async ({ page }) => {
      await page.goto('/inventario');
      await expect(page.locator('h1')).toContainText('Control de Inventario');

      // Buscar el primer botón de IMEI en la tabla
      const imeiButton = page.locator('table tbody tr td button').first();
      await expect(imeiButton).toBeVisible({ timeout: 10000 });
      await imeiButton.click();

      // Modal de línea de vida debe desplegarse
      await expect(page.locator('text=Línea de Vida y Trazabilidad por IMEI')).toBeVisible();
      await expect(page.locator('text=1. Recepción Mayorista')).toBeVisible();
      await expect(page.locator('text=2. Ubicación en Inventario')).toBeVisible();
      await expect(page.locator('text=4. Cobertura de Garantía')).toBeVisible();

      // Cerrar modal
      await page.locator('button:has-text("✕"), button:has(.lucide-x)').first().click();
      await expect(page.locator('text=Línea de Vida y Trazabilidad por IMEI')).not.toBeVisible();
    });
  });

  test.describe('Administrador: Acceso Completo a Reportes y Anulación', () => {
    test.use({ storageState: adminAuthFile });

    test('Administrador visualiza enlace "Reportes" en navbar y accede al dashboard', async ({ page }) => {
      await page.goto('/');
      const reportesLink = page.locator('header a', { hasText: 'Reportes' });
      await expect(reportesLink).toBeVisible();
      await reportesLink.click();

      await page.waitForURL('/reportes');
      await expect(page.locator('h1')).toContainText('Reporte Financiero y Rentabilidad Neta');
      await expect(page.locator('text=Total Ventas')).toBeVisible();
      await expect(page.locator('text=Costo CMV')).toBeVisible();
      await expect(page.locator('text=Ganancia Bruta')).toBeVisible();
      await expect(page.getByText('Gastos de Caja', { exact: true })).toBeVisible();
      await expect(page.getByText('Utilidad Neta Real', { exact: true })).toBeVisible();
    });

    test('Administrador visualiza tabla de auditoría con opciones de filtrado', async ({ page }) => {
      await page.goto('/reportes');
      await expect(page.locator('button', { hasText: 'Hoy' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Últimos 7 días' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Este Mes' })).toBeVisible();
      await expect(page.locator('text=Auditoría Detallada de Ventas')).toBeVisible({ timeout: 10000 });
    });

    test('Modal de anulación de venta exige al menos 10 caracteres en el motivo', async ({ page }) => {
      await page.goto('/reportes');
      // Buscar botón Anular si existe una venta completada en la tabla
      const anularBtn = page.locator('table tbody tr button', { hasText: 'Anular' }).first();
      const count = await anularBtn.count();

      if (count > 0) {
        await anularBtn.click();
        await expect(page.locator('text=Rollback Atómico de Inventario y Caja')).toBeVisible();

        // Botón confirmar debe estar deshabilitado inicialmente
        const submitBtn = page.locator('button[type="submit"]', { hasText: 'Confirmar Anulación' });
        await expect(submitBtn).toBeDisabled();

        // Ingresar menos de 10 caracteres
        await page.fill('textarea', 'Corto');
        await expect(submitBtn).toBeDisabled();

        // Ingresar motivo válido >= 10 chars
        await page.fill('textarea', 'Prueba automatizada de anulación atómica E2E');
        await expect(submitBtn).toBeEnabled();

        // Cancelar para no alterar datos de prueba permanente
        await page.locator('button', { hasText: 'Cancelar' }).click();
        await expect(page.locator('text=Rollback Atómico de Inventario y Caja')).not.toBeVisible();
      }
    });
  });
});
