import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración oficial de Playwright para CentralPhone
 * Permite ejecutar pruebas E2E tanto en modo headless como en modo visual con ventana (--headed)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Ejecución secuencial para no generar colisiones en la base de datos de mostrador
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    // 1. Setup de autenticación compartida para Admin y Vendedor
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. Navegador Chromium principal para PC de mostrador y tablets
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
      dependencies: ['setup'],
    },
  ],
});
