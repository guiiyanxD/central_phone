import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.resolve(__dirname, '.auth');
const adminAuthFile = path.resolve(authDir, 'admin.json');
const vendedorAuthFile = path.resolve(authDir, 'vendedor.json');

// Cargar variables de entorno desde el .env del proyecto si existen
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

setup('preparar directorio de autenticación', async () => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
});

setup('autenticar sesión de Administrador', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.INITIAL_ADMIN_EMAIL || 'admin@centralphone.com');
  await page.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'admin123456');
  await page.click('button[type="submit"]');

  // Esperar redirección al Panel de Operaciones
  await page.waitForURL('/', { timeout: 10000 });
  await expect(page.locator('h1')).toContainText('Panel de Operaciones');

  // Guardar estado de almacenamiento (localStorage y cookies)
  await page.context().storageState({ path: adminAuthFile });
});

setup('autenticar sesión de Vendedor', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.INITIAL_VENDEDOR_EMAIL || 'vendedor@centralphone.com');
  await page.fill('input[type="password"]', process.env.INITIAL_VENDEDOR_PASSWORD || 'vendedor123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/', { timeout: 10000 });
  await expect(page.locator('h1')).toContainText('Panel de Operaciones');

  await page.context().storageState({ path: vendedorAuthFile });
});
