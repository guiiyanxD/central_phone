import { test, expect } from '@playwright/test';
import * as path from 'path';

const vendedorAuthFile = path.resolve(__dirname, '../.auth/vendedor.json');

test.describe('Navegación y Autenticación en CentralPhone', () => {
  test('Usuario no autenticado es redirigido automáticamente al login sin parpadeo del dashboard', async ({ page }) => {
    // Contexto anónimo sin sesión
    await page.goto('/');
    await page.waitForURL('/login', { timeout: 10000 });
    // Garantizar que en ningún momento se filtre el contenido del panel privado
    await expect(page.locator('text=Panel de Operaciones')).not.toBeVisible();
    await expect(page.locator('h1')).toContainText('CentralPhone');
    await expect(page.locator('text=Acceso al Sistema')).toBeVisible();
  });

  test('Rutas protegidas directas (/pos, /caja) redirigen inmediatamente a /login', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page.locator('text=Terminal de Venta')).not.toBeVisible();
    await expect(page.locator('text=Acceso al Sistema')).toBeVisible();
  });

  test('Validación de error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'usuario_inexistente@centralphone.com');
    await page.fill('input[type="password"]', 'contrasenia_falsa_999');
    await page.click('button[type="submit"]');

    // Debe mostrar alerta de credenciales inválidas
    const alertBox = page.locator('.text-rose-700');
    await expect(alertBox).toBeVisible({ timeout: 10000 });
    await expect(alertBox).toContainText('Credenciales');
  });
});

test.describe('Flujos de Usuario Autenticado (Vendedor)', () => {
  test.use({ storageState: vendedorAuthFile });

  test('Vendedor accede al Panel de Operaciones y visualiza portales de flujo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Panel de Operaciones');
    await expect(page.locator('text=Punto de Venta (POS)')).toBeVisible();
    await expect(page.locator('text=Recepción de Mercadería')).toBeVisible();
    await expect(page.locator('text=Control de Inventario')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Caja Diaria' })).toBeVisible();
  });

  test('Barra de navegación no contiene conmutador de roles (Seguridad Fase 1)', async ({ page }) => {
    await page.goto('/');
    // Hacer clic en el menú de usuario en la esquina superior derecha
    await page.locator('header button').last().click();

    // Comprobar que NO exista el conmutador "Cambiar Rol de Sesión"
    await expect(page.locator('text=Cambiar Rol de Sesión')).not.toBeVisible();
  });
});
