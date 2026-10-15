# 🎭 PLAN DE EJECUCIÓN — FASE 3B: PRUEBAS E2E DE NAVEGADOR CON PLAYWRIGHT Y SUBAGENTES

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md) y [`docs/auditoria1/plan_fase_3_calidad_y_pruebas_unitarias.md`](./plan_fase_3_calidad_y_pruebas_unitarias.md)  
**Nivel de Prioridad:** Alto (P1) — Verificación de Integración Extremo a Extremo en Mostrador  
**Estimación Total:** 14 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Implementación de Pruebas E2E Reales:** Integrar **Playwright** en el proyecto para validar el comportamiento real del navegador (DOM, LocalStorage, llamadas fetch a la API, ventanas modales, escáner de IMEIs y renderizado del QR).
2. **Orquestación mediante Subagente QA (`qa-e2e-runner`):** Configurar un subagente autónomo capaz de ejecutar las pruebas, leer trazas de fallo, capturar evidencias visuales (screenshots y videos) y diagnosticar discrepancias de UX/UI.
3. **Soporte de Ejecución Dual (Headed & Headless):**
   * **Modo Headed (`--headed`):** Abre la ventana visible de Chromium en el escritorio de Windows para que el equipo observe la interacción visual en tiempo real.
   * **Modo Headless:** Ejecución en segundo plano ultrarrápida para pipelines de CI/CD.
4. **Validación de Flujos Críticos de Negocio:**
   * Flujo 1: Autenticación, persistencia de JWT y redirección protegida según rol.
   * Flujo 2: Ciclo de Caja (Apertura de turno $\to$ Bloqueo/Desbloqueo de POS $\to$ Registro de Gasto $\to$ Arqueo Ciego con justificación).
   * Flujo 3: Venta en Mostrador (Búsqueda de IMEI $\to$ Selección de lote de accesorio $\to$ Modal de QR Oficial $\to$ Cobro con referencia bancaria $\to$ Impresión de ticket).
   * Flujo 4: Recepción de Mercadería (Ingreso simultáneo de teléfono y lote con validación de IMEI duplicado).

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [ ] Playwright instalado y configurado en el frontend o en un módulo raíz `e2e/`.
* [ ] Se dispone de `playwright.config.ts` configurado para interactuar con `http://localhost:3000` (Next.js) y `http://localhost:4000/api/v1` (NestJS).
* [ ] Se implementa autenticación reutilizable mediante `storageState` (`auth.setup.ts`) para no repetir el login en cada escenario.
* [ ] Las suites E2E se ejecutan de forma determinista sin dependencias de red externa.
* [ ] En caso de fallo, Playwright genera automáticamente: screenshot del DOM en el instante exacto, video WebM y archivo de traza (.zip) para `playwright show-trace`.
* [ ] Un subagente especializado puede invocar `npx playwright test`, procesar el reporte JSON y reportar el estado de salud del sistema.

---

## 3. 📂 Arquitectura del Módulo E2E

```
frontend/ (o raíz)
├── e2e/
│   ├── auth.setup.ts              # Pre-autenticación de Admin y Vendedor (storageState)
│   ├── fixtures/
│   │   └── test-data.ts           # IMEIs ficticios, modelos y datos de prueba
│   ├── flows/
│   │   ├── 01_auth_navigation.spec.ts  # Pruebas de login, bloqueo de rutas y sesión
│   │   ├── 02_caja_arqueo.spec.ts      # Pruebas de apertura, gasto menor y arqueo ciego
│   │   ├── 03_pos_venta_qr.spec.ts     # Pruebas de carrito, proyección QR y ticket
│   │   └── 04_recepcion_imei.spec.ts   # Pruebas de recepción y detección de duplicados
│   └── utils/
│       └── db-helper.ts           # Utilidad para resetear fixtures de base de datos
├── playwright.config.ts           # Configuración oficial de Playwright
└── package.json
```

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Instalación de Playwright en Frontend
Ejecutar en la carpeta `frontend`:
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

### Paso 2: Configuración Oficial de Playwright (`playwright.config.ts`)
Crear `frontend/playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Ejecución secuencial para no colisionar en base de datos
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
  },
  projects: [
    // 1. Configuración de autenticación compartida
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. Navegador principal para pruebas de mostrador
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }, // Resolución típica de PC de mostrador
      },
      dependencies: ['setup'],
    },
  ],
});
```

### Paso 3: Setup de Autenticación Reutilizable (`e2e/auth.setup.ts`)
Para evitar loguearse manualmente en cada prueba y acelerar la ejecución:
```typescript
import { test as setup, expect } from '@playwright/test';

const adminAuthFile = 'e2e/.auth/admin.json';
const vendedorAuthFile = 'e2e/.auth/vendedor.json';

setup('autenticar como administrador', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@centralphone.com');
  await page.fill('input[type="password"]', 'admin123456');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('Panel de Operaciones');
  await page.context().storageState({ path: adminAuthFile });
});

setup('autenticar como vendedor', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'vendedor@centralphone.com');
  await page.fill('input[type="password"]', 'vendedor123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('Panel de Operaciones');
  await page.context().storageState({ path: vendedorAuthFile });
});
```

### Paso 4: Pruebas del Flujo Crítico de POS y Cobro QR (`e2e/flows/03_pos_venta_qr.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/vendedor.json' });

test.describe('Punto de Venta (POS) & Cobro QR Oficial', () => {
  test('Flujo completo de venta con proyección de QR y comprobante', async ({ page }) => {
    // 1. Ir a Punto de Venta
    await page.goto('/pos');

    // 2. Si no hay caja abierta, verificar que el POS esté bloqueado
    const bloqueoAviso = page.locator('text=Terminal de Venta Bloqueado');
    if (await bloqueoAviso.isVisible()) {
      await page.click('text=Abrir Turno de Caja Ahora');
      await page.fill('input[type="number"]', '300');
      await page.click('button:has-text("Confirmar Apertura de Caja")');
      await page.goto('/pos');
    }

    // 3. Buscar un iPhone disponible por texto
    await page.fill('input[placeholder*="Buscar por IMEI"]', 'iPhone');
    const primerTelefonoCard = page.locator('button:has-text("Agregar al Carrito")').first();
    await expect(primerTelefonoCard).toBeVisible();
    await primerTelefonoCard.click();

    // 4. Verificar que se agregó al carrito
    await expect(page.locator('text=Resumen de Venta')).toBeVisible();

    // 5. Seleccionar método de cobro QR Oficial
    await page.click('button:has-text("QR Oficial")');

    // 6. Proyectar modal de QR oficial
    await page.click('text=Proyectar Pantalla de Cobro');
    const modalQr = page.locator('text=Código QR Oficial');
    await expect(modalQr).toBeVisible();
    await expect(page.locator('img[alt="QR Oficial CentralPhone"]')).toBeVisible();

    // 7. Cerrar modal y registrar referencia bancaria
    await page.click('button:has-text("Entendido / Cerrar")');
    await page.fill('input[placeholder*="Comprobante"]', 'REF-BCP-992812');

    // 8. Confirmar venta
    await page.click('button:has-text("Confirmar y Cobrar")');

    // 9. Verificar comprobante de venta exitosa
    await expect(page.locator('text=¡Venta Registrada Exitosamente!')).toBeVisible();
    await expect(page.locator('text=REF-BCP-992812')).toBeVisible();
  });
});
```

---

## 5. 🤖 Orquestación Mediante Subagente QA (`qa-e2e-runner`)

### ¿Cómo opera el subagente?
1. Se define un subagente especializado con herramientas de ejecución de comandos (`enable_write_tools: true`).
2. El subagente asume el rol de **Quality Assurance Automation Engineer**.
3. Sus responsabilidades son:
   * **Verificar ambiente:** Comprueba que PostgreSQL, backend y frontend estén corriendo en `localhost`.
   * **Ejecutar suite:** Corre `npx playwright test` (o con `--headed` si el usuario desea presenciar la ventana en vivo).
   * **Interpretar reportes:** Si una prueba falla, lee `playwright-report/results.json`, ubica el screenshot capturado en disco, analiza el error del DOM y genera un informe de diagnóstico con la causa raíz exacta.

### Definición del Subagente:
```typescript
// Configuración para invoke_subagent / define_subagent:
{
  name: "qa_e2e_runner",
  description: "Subagente automatizador de pruebas de interfaz de usuario con Playwright",
  system_prompt: "Eres un ingeniero de QA Automation experto en Playwright y Next.js. Tu misión es ejecutar pruebas de extremo a extremo, diagnosticar errores en componentes visuales y verificar la integridad de flujos de negocio."
}
```

---

## 6. ⚖️ Debate de Desafíos y Estrategias de Mitigación

| Desafío Técnico | Riesgo | Estrategia de Mitigación |
| :--- | :--- | :--- |
| **Colisión de Datos en DB** | Vender un teléfono en el test `01` hace que el test `02` no lo encuentre disponible. | **Fixtures con Reversión:** Los tests limpian las ventas creadas o utilizan un script de resiembra rápida (`npx prisma db seed`). |
| **Tiempos de Espera Asíncronos** | Modales o animaciones que demoran 200ms causan falsos negativos (*flaky tests*). | **Web-First Assertions:** Utilizar `await expect(locator).toBeVisible()` que reintenta automáticamente hasta 5 segundos sin usar `page.waitForTimeout()`. |
| **Entorno Windows Local** | Permisos de cortafuegos o dependencias nativas de navegadores. | Instalar únicamente el binario de Chromium (`npx playwright install chromium`) que no requiere librerías complejas de SO. |
| **Visualización en Vivo** | ¿Puede el usuario ver la ejecución? | **Sí:** El flag `--headed` abre la ventana real de Chrome en pantalla completa en el monitor del usuario. |

---

## 7. 🚀 Scripts a Integrar en `frontend/package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```
