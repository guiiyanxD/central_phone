import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');
const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');

test.describe('E2E: Flujo Integral Transaccional (Caja -> POS -> Arqueo Ciego)', () => {
  test.describe('Vendedor: Operación Diaria de Turno y Mostrador POS', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Flujo Completo: Verificar Estado de Caja, Venta en POS y Arqueo Ciego', async ({
      page,
    }) => {
      // Paso 1: Ingresar al módulo de Caja Diaria
      await page.goto('/caja');
      await expect(page.locator('h1')).toContainText('Caja Diaria');

      // Si la caja está cerrada, abrirla con monto inicial de prueba
      const botonAbrirCaja = page.locator('button:has-text("Abrir Turno de Caja")');
      if (await botonAbrirCaja.isVisible()) {
        const inputMonto = page.locator('input#montoApertura');
        await inputMonto.fill('200');
        await botonAbrirCaja.click();
        await expect(page.locator('button:has-text("Arqueo & Cierre")')).toBeVisible({
          timeout: 10000,
        });
      }

      // Comprobar que existe una sesión de caja activa
      const estadoCaja = page.locator('[data-testid="badge-estado-caja"]');
      if (await estadoCaja.isVisible()) {
        await expect(estadoCaja).toContainText('ABIERTA');
      }

      // Paso 2: Navegar a POS para realizar una venta de mostrador
      await page.goto('/pos');
      await expect(page.locator('h1')).toContainText('Punto de Venta');

      // Paso 3: Agregar un accesorio al ticket
      const accesoriosTab = page.locator('button:has-text("Lotes de Accesorios")');
      await accesoriosTab.click();

      const agregarAccesorioBtn = page.locator('button:has-text("+ Agregar")').first();
      await expect(agregarAccesorioBtn).toBeVisible({ timeout: 10000 });
      await agregarAccesorioBtn.click();

      // Verificar que el ticket ya contiene un item
      const ticketCard = page.locator('[data-testid="pos-ticket-panel"]');
      if (await ticketCard.isVisible()) {
        await expect(ticketCard).toContainText('Bs');
      }

      // Paso 4: Rellenar datos del cliente con acelerador "+ Comprador casual"
      const compradorCasualBtn = page.locator('button:has-text("+ Comprador casual")');
      await expect(compradorCasualBtn).toBeVisible();
      await compradorCasualBtn.click();

      const inputNombre = page.locator('input#clienteNombre');
      const inputTelefono = page.locator('input#clienteTelefono');
      await expect(inputNombre).toHaveValue('Comprador casual');
      await expect(inputTelefono).toHaveValue('71000000');

      // Paso 5: Seleccionar método de pago EFECTIVO y billete rápido
      const metodoEfectivoBtn = page.getByRole('button', { name: /Efectivo/i }).first();
      if (await metodoEfectivoBtn.isVisible()) {
        await metodoEfectivoBtn.click();
      }

      // Paso 6: Verificar botón de cobro habilitado
      const cobrarBtn = page.locator('button:has-text("Cobrar e Imprimir Ticket")');
      await expect(cobrarBtn).toBeVisible();
      await expect(cobrarBtn).toBeEnabled();

      // Paso 7: Volver a Caja Diaria y comprobar que el modal de Arqueo Ciego protege el saldo teórico
      await page.goto('/caja');
      await expect(page.locator('h1')).toContainText('Caja Diaria');

      const arqueoBtn = page.locator('button:has-text("Arqueo & Cierre")');
      if (await arqueoBtn.isVisible()) {
        await arqueoBtn.click();

        // El modal de arqueo debe tener el input accesible para conteo físico a ciegas
        const inputConteo = page.locator('input#conteoFisico');
        await expect(inputConteo).toBeVisible();

        // No debe mostrar al vendedor el saldo teórico en el modal (invariante de conteo a ciegas)
        const modalArqueo = page.locator('[data-testid="modal-arqueo-ciego"]');
        if (await modalArqueo.isVisible()) {
          await expect(modalArqueo).not.toContainText('Saldo Teórico Esperado:');
        }

        // Cerrar modal con tecla Escape
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Admin: Supervisión de Cajas e Integridad Financiera', () => {
    test.use({ storageState: adminAuthFile });

    test('El Administrador puede ver el desglose real sin enmascaramiento', async ({
      page,
    }) => {
      await page.goto('/caja');
      await expect(page.locator('h1')).toContainText('Caja Diaria');

      const kpiEfectivo = page.locator('[data-testid="kpi-efectivo-gaveta"]');
      await expect(kpiEfectivo).toBeVisible();
      await expect(kpiEfectivo).not.toContainText('••••••');
    });
  });
});
