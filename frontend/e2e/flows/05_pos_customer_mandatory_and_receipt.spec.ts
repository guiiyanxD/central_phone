import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('Datos Obligatorios del Comprador e Impresión de Recibo en POS', () => {
  test.use({ storageState: vendedorAuthFile });

  test('POS bloquea la venta si faltan los datos del comprador y genera recibo con datos de contacto', async ({
    page,
  }) => {
    await page.goto('/pos');
    await expect(page.locator('h1')).toContainText('Punto de Venta');

    // 1. Ir a la pestaña de accesorios si no hay teléfonos disponibles
    const accesoriosTab = page.locator('button:has-text("Lotes de Accesorios")');
    await expect(accesoriosTab).toBeVisible();
    await accesoriosTab.click();

    // 2. Agregar un accesorio disponible al carrito
    const agregarBtn = page.locator('button:has-text("+ Agregar")').first();
    await expect(agregarBtn).toBeVisible({ timeout: 10000 });
    await agregarBtn.click();

    // Verificar que el item está en el carrito
    await expect(page.locator('text=1 productos')).toBeVisible();

    // 3. Verificar presencia de campos obligatorios del comprador
    await expect(page.locator('text=Datos del Comprador')).toBeVisible();
    await expect(page.locator('text=Obligatorio para Garantía')).toBeVisible();

    const inputNombre = page.locator('input[placeholder="Nombre completo y apellidos *"]');
    const inputTelefono = page.locator('input[placeholder="Teléfono / WhatsApp *"]');
    const inputCi = page.locator('input[placeholder="C.I. / NIT"]');

    await expect(inputNombre).toBeVisible();
    await expect(inputTelefono).toBeVisible();
    await expect(inputCi).toBeVisible();

    const submitSaleBtn = page.locator('button:has-text("Finalizar Venta e Imprimir Ticket")');

    // 4. Intentar cobrar sin nombre de cliente
    await submitSaleBtn.click();
    await expect(
      page.locator('text=El nombre completo del cliente es obligatorio')
    ).toBeVisible();

    // 5. Llenar solo nombre sin teléfono
    await inputNombre.fill('Rodrigo Alarcón Mercado');
    await submitSaleBtn.click();
    await expect(
      page.locator('text=El teléfono de contacto del cliente es obligatorio')
    ).toBeVisible();

    // 6. Completar teléfono y CI/NIT
    await inputTelefono.fill('78012345');
    await inputCi.fill('8920194 SC');

    // 7. Procesar el cobro exitosamente
    await submitSaleBtn.click();

    // 8. Modal de ticket completado
    await expect(page.locator('h3:has-text("Comprobante de Venta")')).toBeVisible({ timeout: 10000 });

    // Verificar que el ticket contiene los datos del comprador registrados
    const ticketBox = page.locator('#printable-ticket');
    await expect(ticketBox).toBeVisible();
    await expect(ticketBox).toContainText('Rodrigo Alarcón Mercado');
    await expect(ticketBox).toContainText('78012345');
    await expect(ticketBox).toContainText('8920194 SC');

    // Verificar botón de impresión
    const printBtn = page.locator('button:has-text("Imprimir Recibo")');
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toBeEnabled();

    // Cerrar con "Nueva Venta"
    await page.locator('button:has-text("Nueva Venta")').click();
    await expect(page.locator('#printable-ticket')).not.toBeVisible();
  });
});
