import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');
const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');

test.describe('Fase 2: Dominio Financiero y Confidencialidad de Costos', () => {
  test.describe('Vista de Vendedor (Confidencialidad)', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Inventario oculta costo de adquisición para rol VENDEDOR y muestra Precio Sugerido', async ({ page }) => {
      await page.goto('/inventario');
      await expect(page.locator('h1')).toContainText('Control de Inventario & Catálogo');

      // Verificar que la columna de costo esté en modo vendedor
      await expect(page.locator('th', { hasText: 'Precio Sugerido' })).toBeVisible();
      await expect(page.locator('th', { hasText: 'Costo Adquisición' })).not.toBeVisible();
      await expect(page.locator('th', { hasText: 'Costo / P. Sugerido' })).not.toBeVisible();
    });

    test('POS permite visualizar ticket de venta y productos disponibles', async ({ page }) => {
      await page.goto('/pos');
      await expect(page.locator('h1')).toContainText('Punto de Venta');
      await expect(page.locator('text=Ticket de Venta')).toBeVisible();
    });
  });

  test.describe('Vista de Administrador (Acceso Completo a Márgenes)', () => {
    test.use({ storageState: adminAuthFile });

    test('Inventario muestra Costo y Precio Sugerido para rol ADMIN', async ({ page }) => {
      await page.goto('/inventario');
      await expect(page.locator('h1')).toContainText('Control de Inventario & Catálogo');
      await expect(page.locator('th', { hasText: 'Costo / P. Sugerido' })).toBeVisible();
    });

    test('Formulario de Recepción incluye campo de Precio Venta Sugerido', async ({ page }) => {
      await page.goto('/recepcion');
      await expect(page.locator('h1')).toContainText('Recepción Unificada de Mercadería');
      await expect(page.locator('text=P. Venta Sugerido (Bs)')).toBeVisible();
    });
  });
});
