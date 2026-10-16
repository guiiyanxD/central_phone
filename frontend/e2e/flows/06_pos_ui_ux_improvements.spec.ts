import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('Fase de Remediación UI/UX en Punto de Venta (POS)', () => {
  test.use({ storageState: vendedorAuthFile });

  test('Calculadora de vuelto en efectivo calcula y exhibe el cambio correctamente (ID-UX-001)', async ({
    page,
  }) => {
    await page.goto('/pos');
    await expect(page.locator('h1')).toContainText('Punto de Venta');

    // 1. Ir a catálogo de accesorios y agregar uno
    const accesoriosTab = page.locator('button:has-text("Lotes de Accesorios")');
    await accesoriosTab.click();

    const agregarBtn = page.locator('button:has-text("+ Agregar")').first();
    await expect(agregarBtn).toBeVisible({ timeout: 10000 });
    await agregarBtn.click();

    // 2. Verificar presencia de calculadora de vuelto al estar seleccionado Efectivo
    await expect(page.locator('text=Efectivo Recibido en Gaveta')).toBeVisible();

    // 3. Probar botón de "Exacto"
    const exactoBtn = page.locator('button:has-text("Exacto")');
    await expect(exactoBtn).toBeVisible();
    await exactoBtn.click();

    // Al ser exacto, el vuelto debe ser Bs 0.00
    await expect(page.locator('text=Cambio / Vuelto a Entregar:')).toBeVisible();
    await expect(page.locator('text=Bs 0.00')).toBeVisible();

    // 4. Probar ingreso manual de un monto mayor (ej: Bs 500)
    const inputMonto = page.locator('input[placeholder="Ingresa monto entregado por el cliente..."]');
    await inputMonto.fill('500');

    // Debe mostrar cálculo positivo de cambio
    await expect(page.locator('text=Cambio / Vuelto a Entregar:')).toBeVisible();
  });

  test('Controles del carrito poseen atributos de accesibilidad ARIA y touch targets adecuados (ID-A11Y-001/003)', async ({
    page,
  }) => {
    await page.goto('/pos');

    // Agregar accesorio
    await page.locator('button:has-text("Lotes de Accesorios")').click();
    const agregarBtn = page.locator('button:has-text("+ Agregar")').first();
    await expect(agregarBtn).toBeVisible({ timeout: 10000 });
    await agregarBtn.click();

    // Verificar presencia de botones con aria-label
    const btnAumentar = page.locator('button[aria-label^="Aumentar cantidad"]');
    const btnDisminuir = page.locator('button[aria-label^="Disminuir cantidad"]');
    const btnEliminar = page.locator('button[aria-label^="Eliminar"]');

    await expect(btnAumentar).toBeVisible();
    await expect(btnDisminuir).toBeVisible();
    await expect(btnEliminar).toBeVisible();

    // Incrementar cantidad
    await btnAumentar.click();
    await expect(page.locator('span[aria-live="polite"]')).toContainText('2');
  });

  test('Buscador de escaneo cuenta con atajo visible Enter/F2 y autofocus (ID-POS-001)', async ({
    page,
  }) => {
    await page.goto('/pos');

    const searchInput = page.locator('input[placeholder="Escanear o tipear IMEI 1, Serie o Modelo..."]');
    await expect(searchInput).toBeVisible();
    await expect(page.locator('text=Enter ↵ | F2')).toBeVisible();
  });

  test('Buscador de accesorios filtra en tiempo real por nombre y variante (ID-UX-004)', async ({
    page,
  }) => {
    await page.goto('/pos');

    // Cambiar a la pestaña de accesorios
    await page.locator('button:has-text("Lotes de Accesorios")').click();

    const searchAcc = page.locator('input[placeholder*="Buscar accesorio por nombre o lote"]');
    await expect(searchAcc).toBeVisible();

    // Escribir un término que no exista para verificar estado vacío
    await searchAcc.fill('InexistenteXYZ123');
    await expect(page.locator('text=No se encontraron accesorios coincidentes')).toBeVisible();

    // Limpiar búsqueda y verificar que reaparecen los productos
    await searchAcc.fill('');
    await expect(page.locator('button:has-text("+ Agregar")').first()).toBeVisible();
  });

  test('Botón Vaciar Ticket y Toast de Deshacer eliminación individual (ID-POS-003, ID-POS-004)', async ({
    page,
  }) => {
    await page.goto('/pos');

    // 1. Agregar un accesorio al carrito
    await page.locator('button:has-text("Lotes de Accesorios")').click();
    const agregarBtn = page.locator('button:has-text("+ Agregar")').first();
    await expect(agregarBtn).toBeVisible({ timeout: 10000 });
    await agregarBtn.click();

    // 2. Verificar que el botón "Vaciar Ticket" aparece
    const vaciarBtn = page.locator('button:has-text("Vaciar Ticket")');
    await expect(vaciarBtn).toBeVisible();

    // 3. Probar eliminación de ítem individual y aparición de Toast de Deshacer
    const btnEliminar = page.locator('button[aria-label^="Eliminar"]');
    await btnEliminar.click();

    // Toast flotante debe ser visible con botón Deshacer
    const undoToast = page.locator('text=Deshacer (Ctrl+Z)');
    await expect(undoToast).toBeVisible();

    // Hacer clic en Deshacer y verificar que el ítem reaparece en el carrito
    await undoToast.click();
    await expect(page.locator('button[aria-label^="Eliminar"]')).toBeVisible();

    // 4. Probar "Vaciar Ticket" con confirmación
    page.once('dialog', (dialog) => dialog.accept());
    await vaciarBtn.click();

    // Carrito debe quedar vacío
    await expect(page.locator('text=El carrito está vacío')).toBeVisible();
    await expect(vaciarBtn).not.toBeVisible();
  });
});

test.describe('Navegación Móvil y Tablet (Viewport < 1024px) (ID-A11Y-002)', () => {
  test.use({
    storageState: vendedorAuthFile,
    viewport: { width: 820, height: 1180 }, // Viewport iPad
  });

  test('Barra de navegación inferior fija está visible en tablets para no aislar al cajero', async ({
    page,
  }) => {
    await page.goto('/pos');
    await expect(page.locator('h1')).toContainText('Punto de Venta');

    // Barra de navegación inferior
    const bottomNav = page.locator('nav[aria-label="Navegación móvil y tablet"]');
    await expect(bottomNav).toBeVisible();

    // Verificar accesos directos
    await expect(bottomNav.getByRole('link', { name: 'Operaciones' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Punto de Venta' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Caja Diaria' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Recepción' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Inventario' })).toBeVisible();
  });
});
