import { test, expect } from '@playwright/test';
import * as path from 'path';

const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');
const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('E2E: Verificación de Remediación UI/UX - Semana 1', () => {
  test.describe('Sesión de Vendedor (Arqueo Ciego y POS Adaptativo)', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Caja Diaria: Saldo en efectivo está enmascarado con texto "Protegido" para el vendedor', async ({
      page,
    }) => {
      await page.goto('/caja');
      await expect(page.locator('h1')).toContainText('Caja Diaria');

      // 1. El card de Efectivo en Gaveta debe exhibir "Bs ••••••" y "Protegido"
      const efectivoCard = page.locator('[data-testid="kpi-efectivo-gaveta"]');
      await expect(efectivoCard).toBeVisible();
      await expect(efectivoCard).toContainText('Bs ••••••');
      await expect(efectivoCard).toContainText('Protegido');

      // 2. Comprobar que los inputs de apertura o cierre tienen IDs accesibles vinculados
      const arqueoBtn = page.locator('button:has-text("Arqueo & Cierre")');
      if (await arqueoBtn.isVisible()) {
        await arqueoBtn.click();
        await expect(page.locator('label[for="conteoFisico"]')).toBeVisible();
        await expect(page.locator('input#conteoFisico')).toBeVisible();
        await page.keyboard.press('Escape');
      } else {
        await expect(page.locator('label[for="montoApertura"]')).toBeVisible();
        await expect(page.locator('input#montoApertura')).toBeVisible();
      }
    });

    test('POS: Botón superior no expone monto a ciegas, billetes bolivianos y acelerador "Comprador casual"', async ({
      page,
    }) => {
      await page.goto('/pos');
      await expect(page.locator('h1')).toContainText('Punto de Venta');

      // 1. Botón superior de caja no expone el saldo para el vendedor
      const botonCaja = page.locator('button:has-text("Ver Turno de Caja")');
      await expect(botonCaja).toBeVisible();
      await expect(botonCaja).not.toContainText('Bs ');

      // 2. Grilla responsiva de 2 columnas en breakpoint md
      const mainGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-12');
      await expect(mainGrid).toBeVisible();

      // 3. Añadir accesorio al ticket para verificar billetes bolivianos y comprador casual
      const accesoriosTab = page.locator('button:has-text("Lotes de Accesorios")');
      await accesoriosTab.click();

      const agregarBtn = page.locator('button:has-text("+ Agregar")').first();
      await expect(agregarBtn).toBeVisible({ timeout: 10000 });
      await agregarBtn.click();

      // 4. Verificar presencia de billetes legales bolivianos (20, 50, 100, 200) y ausencia de 500 y 1000
      await expect(page.getByRole('button', { name: 'Bs 20', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bs 50', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bs 100', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bs 200', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bs 500', exact: true })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Bs 1000', exact: true })).not.toBeVisible();

      // 5. Probar acelerador "+ Comprador casual"
      const compradorCasualBtn = page.locator('button:has-text("+ Comprador casual")');
      await expect(compradorCasualBtn).toBeVisible();
      await compradorCasualBtn.click();

      const inputNombre = page.locator('input#clienteNombre');
      const inputTelefono = page.locator('input#clienteTelefono');

      await expect(inputNombre).toHaveValue('Comprador casual');
      await expect(inputTelefono).toHaveValue('71000000');
    });
  });

  test.describe('Sesión de Administrador (Supervisión y Modal QR)', () => {
    test.use({ storageState: adminAuthFile });

    test('Caja Diaria: Administrador visualiza el saldo numérico exacto en tiempo real', async ({
      page,
    }) => {
      await page.goto('/caja');
      await expect(page.locator('h1')).toContainText('Caja Diaria');

      const efectivoCard = page.locator('[data-testid="kpi-efectivo-gaveta"]');
      await expect(efectivoCard).toBeVisible();
      // El administrador no debe ver el enmascaramiento "Bs ••••••"
      await expect(efectivoCard).not.toContainText('Bs ••••••');
      await expect(efectivoCard).toContainText('Inicial + Ventas Efec. - Gastos');
    });

    test('Hub Inicio: Modal QR estándar es accesible y se cierra mediante Escape', async ({
      page,
    }) => {
      await page.goto('/');

      const qrBanner = page.locator('[data-testid="banner-qr-oficial"]');
      await expect(qrBanner).toBeVisible();

      const projectBtn = qrBanner.getByRole('button', { name: /Proyectar QR Oficial al Cliente/i });
      await expect(projectBtn).toBeVisible();
      await projectBtn.click();

      // 1. El modal es un role="dialog" accesible con testid
      const modalDialog = page.locator('[data-testid="modal-qr-ampliado"]');
      await expect(modalDialog).toBeVisible();
      await expect(modalDialog).toHaveAttribute('aria-modal', 'true');

      // 2. Cierre mediante tecla Escape nativa
      await page.keyboard.press('Escape');
      await expect(modalDialog).not.toBeVisible();
    });
  });
});
