import { test, expect } from '@playwright/test';
import * as path from 'path';

const adminAuthFile = path.resolve(__dirname, '../.auth/admin.json');
const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('Módulo de Sucursales - Diagnóstico de Foco y Gestión Completa', () => {
  test.describe('Sesión de Administrador', () => {
    test.use({ storageState: adminAuthFile });

    test('El foco no debe ser robado por el botón onClose al escribir en el campo nombre', async ({ page }) => {
      // 1. Navegar al módulo de sucursales
      await page.goto('/sucursales');
      await expect(page.locator('h1')).toContainText('Gestión de Sucursales');

      // 2. Abrir modal de Nueva Sucursal
      const newBtn = page.getByRole('button', { name: /Nueva Sucursal/i });
      await expect(newBtn).toBeVisible();
      await newBtn.click();

      // 3. Verificar que el modal esté visible
      const modalTitle = page.getByText('Registrar Nueva Sucursal');
      await expect(modalTitle).toBeVisible();

      const nameInput = page.locator('#nuevoNombre');
      await expect(nameInput).toBeVisible();

      // 4. Escribir la primera letra con delay
      await nameInput.focus();
      await nameInput.pressSequentially('S', { delay: 150 });

      // Esperar más de 200ms para validar que el temporizador no robe el foco
      await page.waitForTimeout(200);

      // 5. Verificar qué elemento tiene el foco activo
      const focusedElementTag = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          id: el?.id,
          ariaLabel: el?.getAttribute('aria-label'),
          isCloseButton: el?.getAttribute('aria-label') === 'Cerrar diálogo emergente',
        };
      });

      expect(focusedElementTag.isCloseButton).toBe(false);
      expect(focusedElementTag.tagName).toBe('INPUT');
      expect(focusedElementTag.id).toBe('nuevoNombre');

      // 6. Escribir el resto del nombre sin interrupciones
      const uniqueBranchName = `Sucursal E2E ${Date.now()}`;
      await nameInput.fill('');
      await nameInput.pressSequentially(uniqueBranchName, { delay: 50 });
      await expect(nameInput).toHaveValue(uniqueBranchName);

      // 7. Llenar los demás campos
      await page.locator('#nuevaDireccion').fill('Av. San Martín #800, Equipetrol');
      await page.locator('#nuevoTelefono').fill('71099887');

      // 8. Enviar formulario
      await page.click('button[type="submit"]:has-text("Registrar Sucursal")');

      // 9. Verificar que el modal se cierre y aparezca la nueva sucursal en el listado
      await expect(modalTitle).not.toBeVisible();
      await expect(page.locator(`text=${uniqueBranchName}`)).toBeVisible({ timeout: 10000 });
    });

    test('Consulta de Detalle y Personal Asignado en una sucursal', async ({ page }) => {
      await page.goto('/sucursales');
      await expect(page.locator('h1')).toContainText('Gestión de Sucursales');

      // Abrir detalle de la primera sucursal visible
      const detailBtn = page.getByRole('button', { name: /Detalle & Personal/i }).first();
      await expect(detailBtn).toBeVisible();
      await detailBtn.click();

      // Verificar modal de detalle
      await expect(page.getByText('Personal de Tienda')).toBeVisible();
      await expect(page.getByText('Dirección:')).toBeVisible();
      await expect(page.getByText('Ciudad:')).toBeVisible();

      // Cerrar modal
      await page.click('button:has-text("Cerrar")');
    });
  });

  test.describe('Sesión de Vendedor (Control de Acceso RBAC)', () => {
    test.use({ storageState: vendedorAuthFile });

    test('Vendedor no tiene acceso al módulo de sucursales y se bloquea la vista', async ({ page }) => {
      await page.goto('/sucursales');

      // Debe mostrar la pantalla de bloqueo RBAC
      await expect(page.locator('h1')).toContainText('Acceso Restringido a Administradores');
      await expect(page.getByRole('button', { name: /Ir a Punto de Venta/i })).toBeVisible();

      // No debe contener botones de crear ni editar sucursales
      await expect(page.getByRole('button', { name: /Nueva Sucursal/i })).not.toBeVisible();
    });
  });
});
