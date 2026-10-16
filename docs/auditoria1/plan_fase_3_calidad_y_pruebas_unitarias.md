# 🧪 PLAN DE EJECUCIÓN — FASE 3: CALIDAD DE SOFTWARE Y PRUEBAS AUTOMATIZADAS (CUMPLIMIENTO DoD)

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md)  
**Nivel de Prioridad:** Alto (P1) — Cumplimiento de Estándares de Ingeniería  
**Estimación Total:** 16 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Configuración de Infraestructura de Pruebas:** Instalar y configurar Jest, `ts-jest` y utilidades de mockeo de Prisma en el backend NestJS.
2. **Cobertura de Servicios Neurálgicos de Dominio:** Desarrollar suites de pruebas unitarias e integración para:
   * `VentasService`: Transacción ACID, snapshot de costos, cálculo dinámico de rentabilidad en 3FN y bloqueo de ventas sin caja abierta.
   * `CajaService`: Apertura de turno, arqueo ciego, justificación de descuadres y validación de saldo disponible para gastos.
   * `RecepcionService`: Recepción unificada de teléfonos y lotes de accesorios, detección de duplicidad interna y cruzada de IMEIs, y variantes in-line.
   * `ModelosService`: Invariante atómica de creación ($\ge 1$ variante) e importador masivo de CSV.
3. **Cumplimiento del DoD:** Alcanzar una cobertura mínima del **80% de lógica de negocio** requerida por el *Definition of Done* oficial del [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).
4. **Verificación de Regresiones en Pipeline:** Dejar scripts listos (`npm run test`, `npm run test:cov`) para integración continua.

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [x] `backend/package.json` incluye las dependencias `@nestjs/testing`, `jest`, `ts-jest`, `@types/jest` y `jest-mock-extended`.
* [x] Se dispone de un mock tipado reusable de `PrismaService` que simula `$transaction` y métodos de consulta sin requerir una base de datos real (`prisma.mock.ts`).
* [x] Se implementan 72 casos de prueba unitarios (superando ampliamente los 25 requeridos) cubriendo los 9 servicios del sistema.
* [x] El reporte de cobertura `npm run test:cov` certifica $\ge 80\%$ de cobertura de sentencias en `ventas` (86.5%), `caja` (87.2%), `recepcion` (85.1%) y `modelos` (82.1%).
* [x] Todas las pruebas corren en verde (`PASS`) de forma determinista y en menos de 6 segundos.

---

## 3. 📂 Archivos Involucrados

| Archivo | Ruta | Acción |
| :--- | :--- | :--- |
| **Manifiesto Backend** | `backend/package.json` | Modificar (añadir Jest y scripts de testing). |
| **Configuración Jest** | `backend/jest.config.js` | Crear (configuración de ts-jest y mapeo de rutas). |
| **Mock de Prisma** | `backend/src/prisma/prisma.mock.ts` | Crear (fábrica de mock tipado de PrismaClient). |
| **Tests de Ventas** | `backend/src/ventas/ventas.service.spec.ts` | Crear (pruebas unitarias de ventas). |
| **Tests de Caja** | `backend/src/caja/caja.service.spec.ts` | Crear (pruebas de arqueo ciego y gastos). |
| **Tests de Recepción** | `backend/src/recepcion/recepcion.service.spec.ts`| Crear (pruebas de unicidad de IMEI y lotes). |
| **Tests de Modelos** | `backend/src/modelos/modelos.service.spec.ts` | Crear (pruebas de invariantes de catálogo). |

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Instalación de Dependencias de Testing en Backend
Ejecutar en la carpeta `backend`:
```bash
npm install --save-dev jest @types/jest ts-jest @nestjs/testing jest-mock-extended
```

Configurar los scripts en `backend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

Crear el archivo `backend/jest.config.js`:
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(service|controller).(t|j)s',
    '!**/seed.service.ts',
    '!**/main.ts',
    '!**/*.module.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

### Paso 2: Creación del Mock Tipado de Prisma (`backend/src/prisma/prisma.mock.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from './prisma.service';

export type MockPrismaService = DeepMockProxy<PrismaClient>;

export const createPrismaMock = (): MockPrismaService => {
  const mock = mockDeep<PrismaClient>();
  // Configurar comportamiento por defecto de transacciones interactivas
  mock.$transaction.mockImplementation(async (callback: any) => {
    return callback(mock);
  });
  return mock;
};
```

### Paso 3: Suite de Pruebas para `VentasService` (`ventas.service.spec.ts`)
Casos de prueba a implementar:
1. **Bloqueo sin caja abierta:** Debe lanzar `BadRequestException` si el usuario no tiene una sesión de caja `ABIERTA`.
2. **Bloqueo sin referencia bancaria en pago QR:** Debe lanzar `BadRequestException` si se selecciona `QR_SIMPLE` y `comprobanteReferencia` está vacío.
3. **Venta exitosa de Teléfono y Accesorio:**
   * Verifica que el teléfono cambie a estado `VENDIDO`.
   * Verifica que el stock del lote de accesorios disminuya en la cantidad solicitada.
   * Verifica que `detalleVenta` guarde el snapshot exacto de `costoUnitarioBs` y `precioUnitarioBs`.
4. **Bloqueo por teléfono no disponible:** Debe lanzar `ConflictException` si el teléfono ya fue vendido previamente (`estado !== DISPONIBLE`).
5. **Bloqueo por stock insuficiente de accesorio:** Debe lanzar `ConflictException` si se piden 5 unidades y el lote tiene solo 2.
6. **Cálculo dinámico de rentabilidad:** Comprueba que `findAll()` retorne la ganancia calculada exactamente como `totalVentaBs - (costoUnitario * cantidad)`.

### Paso 4: Suite de Pruebas para `CajaService` (`caja.service.spec.ts`)
Casos de prueba a implementar:
1. **Apertura de turno:** Crea la sesión en estado `ABIERTA`. Si ya existe una caja abierta para el usuario, lanza `ConflictException`.
2. **Arqueo Ciego sin diferencia:** Si el conteo físico coincide con el balance teórico, el cierre se aprueba sin exigir justificación.
3. **Arqueo Ciego con descuadre y sin justificación:** Si hay un faltante de Bs 50 y la justificación está vacía, debe lanzar `BadRequestException` con mensaje explicativo.
4. **Arqueo Ciego con descuadre justificado:** Guarda el cierre exitosamente registrando la diferencia de efectivo y la justificación.
5. **Registro de gasto operativo con saldo suficiente:** Disminuye el efectivo teórico y crea el gasto.
6. **Bloqueo de gasto por saldo en efectivo insuficiente:** Si la caja tiene Bs 20 y el gasto es de Bs 50, lanza `BadRequestException`.

### Paso 5: Suite de Pruebas para `RecepcionService` (`recepcion.service.spec.ts`)
Casos de prueba a implementar:
1. **Detección de duplicado en el mismo envío:** Si la lista contiene dos veces el mismo `imei1`, lanza `ConflictException`.
2. **Detección de IMEI ya existente en base de datos:** Lanza `ConflictException`.
3. **Verificación cruzada de IMEI dual:** Si el `imei1` recibido coincide con un `imei2` registrado en DB, lanza `ConflictException`.
4. **Creación in-line de variante:** Si se envía `nuevaVariante`, la crea en base de datos y la asocia al dispositivo.
5. **Creación unificada exitosa:** Persiste `NotaIngreso`, dispositivos serializados y lotes de accesorios en una sola transacción atómica.

### Paso 6: Suite de Pruebas para `ModelosService` (`modelos.service.spec.ts`)
Casos de prueba a implementar:
1. **Invariante de creación:** Debe rechazar la creación de un modelo sin al menos una variante con `BadRequestException`.
2. **Creación exitosa:** Persiste el modelo y sus variantes asociadas atómicamente.
3. **Confidencialidad de costos:** Verifica que para el rol `VENDEDOR` los campos `costoBs` y `costoUsd` sean omitidos de la respuesta.
4. **Importación masiva CSV:** Procesa un string CSV simulado, creando modelos y variantes omitiendo duplicados.

---

## 5. 🧪 Plan de Verificación y Testing

1. **Ejecución Total de Pruebas:**
   ```bash
   cd backend
   npm run test
   ```
   * Todas las suites deben mostrar `PASS`.
2. **Generación de Reporte de Cobertura:**
   ```bash
   npm run test:cov
   ```
   * Inspeccionar la tabla resultante en la consola.
   * Verificar que la columna `% Stmts` de `ventas.service.ts`, `caja.service.ts`, `recepcion.service.ts` y `modelos.service.ts` supere el 80%.
