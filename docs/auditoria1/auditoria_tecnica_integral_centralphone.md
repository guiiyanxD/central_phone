# 📑 INFORME DE AUDITORÍA TÉCNICA INTEGRAL — CENTRALPHONE

**Fecha de Auditoría:** 15 de Octubre de 2026  
**Proyecto:** CentralPhone (Sistema de Gestión Comercial e Inventario Serializado)  
**Alcance:** Backend (NestJS + Prisma), Frontend (Next.js 14 App Router + Tailwind), Base de Datos (PostgreSQL), Infraestructura (Docker) y Cumplimiento de Reglas de Dominio y Seguridad.

---

## 1. 📊 Resumen Ejecutivo y Diagnóstico Global

El proyecto **CentralPhone** presenta una **base arquitectónica sólida, bien estructurada y fiel a las necesidades de negocio del retail móvil boliviano**. Destaca por su modelado relacional en 3FN, transacciones ACID para operaciones críticas (ventas e ingresos de mercadería), tipado estricto (0 errores de compilación TypeScript) y un frontend con diseño minimalista inspirado en los estándares de Apple ("Apple Precision").

Sin embargo, la auditoría revela **hallazgos de seguridad críticos** (credenciales expuestas en frontend con elevación de privilegios accesible desde la UI), un **desajuste de contrato entre backend y frontend** que anula la actualización de datos bancarios en el POS, **vulnerabilidades operativas en caja** (precio libre sin piso mínimo por parte del vendedor) y una **omisión total de pruebas automatizadas**, incumpliendo la *Definition of Done (DoD)* del proyecto.

### Cuadro de Madurez del Sistema

| Dimensión | Calificación (1 a 10) | Estado | Observación Principal |
| :--- | :---: | :---: | :--- |
| **Arquitectura de Software** | **8.5 / 10** | 🟢 Sólido | Separación modular limpia en NestJS, DTOs y validación tipada. |
| **Modelado de Datos (3FN)** | **9.0 / 10** | 🟢 Excelente | Snapshot histórico de costos, serialización estricta y lotes. |
| **Experiencia de Usuario (UI/UX)** | **8.8 / 10** | 🟢 Muy Bueno | Alineado a DESIGN.md, diseño limpio y accesible para mostrador. |
| **Reglas de Negocio / Dominio** | **8.0 / 10** | 🟡 Bueno | Cajas a ciegas y recepción unificada implementados; falta anulación. |
| **Seguridad y Control de Acceso** | **4.5 / 10** | 🔴 Crítico | Backdoor de cambio de rol en cliente y credenciales quemadas. |
| **Calidad de Código y Pruebas** | **2.0 / 10** | 🔴 Deficiente | 0% de pruebas unitarias/e2e (DoD exigía 80%). |
| **DevOps & Versionado** | **5.0 / 10** | 🟡 Regular | Sin repositorio Git inicializado; Dockerfile enfocado solo a desarrollo. |

---

## 2. 🛡️ Evaluación de Cumplimiento de Reglas Inmutables (GEMINI.md)

### 2.1. Regla Inmutable 1: Seguridad y Variables de Entorno
* **Estado:** 🔴 **INCUMPLIMIENTO CRÍTICO**
* **Evidencias encontradas:**
  1. **Credenciales en Frontend (Bundle del Cliente):** En `frontend/src/context/auth-context.tsx`, la función `switchRole` contiene las contraseñas en texto plano:
     ```typescript
     targetRole === 'ADMIN'
       ? { email: 'admin@centralphone.com', password: 'admin123456' }
       : { email: 'vendedor@centralphone.com', password: 'vendedor123' };
     ```
  2. **Elevación de Privilegios en UI:** En `frontend/src/components/layout/navbar.tsx`, existe un menú desplegable visible para cualquier usuario que permite mutar de `VENDEDOR` a `ADMIN` con un solo clic.
  3. **Credenciales en Pantalla de Login:** En `frontend/src/app/login/page.tsx`, botones de acceso rápido exponen públicamente los passwords.
  4. **Contraseñas quemadas en Seeder Backend:** En `backend/src/prisma/seed.service.ts`, los hashes iniciales se generan con passwords fijas en código en lugar de provenir de variables `.env`.
  5. **Ruta absoluta local hardcodeada:** En `backend/src/prisma/seed.service.ts`, existe la ruta estática: `'C:\\Users\\USUARIO\\Desktop\\proyectos_personales\\julieth\\central_iphone\\docs\\requerimientos\\combinaciones_iphone18.csv'`.

### 2.2. Reglas Inmutables de Negocio y Dominio
* **Trazabilidad Serializada (Regla 1):** 🟢 **Cumplida**. `numero_serie` e `imei_1` son únicos a nivel de esquema en `schema.prisma`. Los estados (`DISPONIBLE`, `VENDIDO`, etc.) están bien modelados.
* **Invariante de Modelo y Variantes (Regla 2):** 🟢 **Cumplida**. En `modelos.service.ts`, se valida atómicamente que todo modelo nazca con al menos una variante. Creación in-line soportada en `recepcion.service.ts`.
* **Recepción Unificada (Regla 3):** 🟢 **Cumplida**. `NotaIngreso` unifica dispositivos y lotes de accesorios bajo una sola transacción.
* **Lotes Diferenciados para Accesorios (Regla 4):** 🟢 **Cumplida**. Implementado en `LoteAccesorio` con `nombreDiferenciador`, stock independiente y precio propio.
* **Seguridad Anti-Fraude en QR (Regla 5):** 🟡 **Parcialmente Comprometida**. El backend restringe la edición del QR a `ADMIN` vía `RolesGuard`. Sin embargo, el **Bug de Contrato** impide que los datos bancarios modificados se reflejen en la UI.
* **Inmutabilidad de Costos en 3FN (Regla 6):** 🟢 **Cumplida**. `DetalleVenta` almacena snapshots de `costoUnitarioBs` y `precioUnitarioBs`. La ganancia se calcula dinámicamente en tiempo de consulta.
* **Control de Caja y Arqueo Ciego (Regla 7):** 🟢 **Cumplida**. No se puede vender sin caja abierta (`ventas.service.ts`), el cierre exige conteo a ciegas y justificación de descuadres (`caja.service.ts`).
* **Escalabilidad Multi-Sucursal (Regla 8):** 🟢 **Cumplida**. Tablas relacionadas a `sucursal_id`.

---

## 3. 🔍 Defectos, Bugs y Puntos Débiles Detectados

### 🔴 Defecto 1 (Crítico): Desajuste de Contrato de Datos Bancarios (Bug UI/API)
* **Ubicación:** 
  * `frontend/src/app/pos/page.tsx`
  * `frontend/src/app/page.tsx`
  * `frontend/src/app/configuracion/page.tsx`
* **Causa:** El backend `ConfiguracionNegocio` almacena y devuelve:
  * `bancoOficial`
  * `titularCuenta`
  * `numeroCuenta`
  Mientras que el frontend intenta leer una propiedad inexistente:
  ```typescript
  configuracion?.datosBancarios?.banco
  configuracion?.datosBancarios?.titular
  configuracion?.datosBancarios?.numeroCuenta
  ```
* **Impacto:** Como `datosBancarios` siempre es `undefined`, el frontend recurre al operador `||` con los valores estáticos quemados (`Banco de Crédito BCP`, `Alex Gomez`, etc.). Si el Administrador actualiza la cuenta bancaria en la base de datos, **el vendedor y el cliente continuarán viendo los datos anteriores o la cuenta vacía (`Cta: ` en blanco)**.

---

### 🔴 Defecto 2 (Crítico): Puerta Trasera (Backdoor) de Conmutación de Roles en Producción
* **Ubicación:** 
  * `frontend/src/context/auth-context.tsx`
  * `frontend/src/components/layout/navbar.tsx`
* **Impacto:** Cualquier persona con acceso a una terminal de vendedor puede abrir el menú de usuario en la barra de navegación, presionar "Administrador" y el cliente ejecutará un inicio de sesión silencioso con las credenciales maestras. Esto permite que cualquier empleado modifique el QR oficial, apruebe gastos o altere la configuración.

---

### 🟠 Defecto 3 (Alto): Venta sin Piso Mínimo y Exposición de Costos Confidenciales en POS
* **Ubicación:** `frontend/src/app/pos/page.tsx` y `backend/src/ventas/ventas.service.ts`
* **Causa:** 
  1. En la base de datos, `Dispositivo` solo almacena `costoBs` y no posee un `precioVentaSugeridoBs`. El frontend calcula un precio sugerido arbitrario: `Math.round(Number(disp.costoBs) * 1.15)`.
  2. Para hacer este cálculo, el backend envía `costoBs` al navegador del vendedor en `api.modelos.getDispositivos()`.
  3. En `pos/page.tsx`, el vendedor tiene habilitada la edición del precio unitario sin ninguna validación de piso mínimo (puede cambiar el precio a Bs 10 y procesar la venta).
* **Impacto:** Violación de la confidencialidad de costos para el rol `VENDEDOR` y riesgo financiero de venta a pérdida por error o dolo.

---

### 🟡 Defecto 4 (Medio): Verificación Cruzada Incompleta de IMEI 1 vs IMEI 2
* **Ubicación:** `backend/src/recepcion/recepcion.service.ts`
* **Causa:** Al validar la recepción de mercadería, el backend verifica:
  ```typescript
  const imei1Existente = await tx.dispositivo.findUnique({
    where: { imei1: d.imei1.trim() },
  });
  ```
  Si un teléfono que ingresa tiene un `imei1` que ya fue registrado previamente como `imei2` de otro equipo (muy común en equipos Dual SIM / eSIM donde los proveedores alternan ranuras), esta verificación previa no lo detecta y fallará con un error no controlado de clave única de base de datos.
* **Solución:** Consultar `where: { OR: [{ imei1: valor }, { imei2: valor }] }`.

---

### 🟡 Defecto 5 (Medio): Falta de Repositorio Git en la Raíz
* **Ubicación:** Raíz del proyecto.
* **Causa:** El comando `git status` arroja `fatal: not a git repository`.
* **Impacto:** Ningún archivo cuenta con trazabilidad de commits ni historial de versiones local, y las directivas de `.gitignore` no tienen efecto protector activo ante fugas accidentales.

---

### 🟡 Defecto 6 (Medio): Precisión de Punto Flotante en Cálculos Monetarios
* **Ubicación:** `backend/src/ventas/ventas.service.ts` y `backend/src/caja/caja.service.ts`
* **Causa:** Se utiliza la conversión nativa `Number(decimal)` y sumas estándar de JavaScript (`totalVentaBs += subtotal`).
* **Impacto:** JavaScript maneja números en formato IEEE 754 de 64 bits de coma flotante, lo que en operaciones sucesivas puede generar pequeñas discrepancias de centavos (`0.1 + 0.2 = 0.30000000000000004`). Se recomienda operar con enteros en centavos o helpers de redondeo estricto `Math.round((val + Number.EPSILON) * 100) / 100`.

---

## 4. 🏆 Fortalezas Técnicas y Aciertos de Diseño

1. **Modelado Relacional Impecable en 3FN:**
   El esquema de base de datos en `schema.prisma` es uno de los mayores aciertos del proyecto. Separa perfectamente catálogos de existencias físicas, desacopla lotes de accesorios y garantiza que la ganancia neta no sea una columna estática desincronizable, sino un cálculo puro a partir de snapshots.

2. **Transacciones ACID Robustas:**
   Tanto en la recepción de inventario como en el cobro del POS, el backend ejecuta `prisma.$transaction(...)`. Si se produce una falla a mitad de la venta (ej. caída de red o stock insuficiente en el último ítem), ningún dispositivo queda en estado huérfano ni se deduce stock indebido.

3. **Mecanismo de Arqueo Ciego Excepcional:**
   La implementación de la caja diaria (`caja.service.ts`) resuelve con maestría el fraude por cuadre manual: el vendedor no sabe cuánto efectivo espera el sistema; cuenta el dinero físico, lo ingresa, y si hay una diferencia mayor a 1 centavo, el sistema bloquea el cierre hasta que se justifique formalmente para auditoría del Administrador.

4. **Diseño Visual e Identidad "Apple Precision":**
   El frontend está construido con una consistencia estética notable (`DESIGN.md`): escala de grises limpia (Slate), tipografía nítida, badges funcionales de estado, modales contextuales rápidos y microinteracciones de confirmación que optimizan la velocidad de atención en mostrador.

5. **Excelente Salud de Compilación TypeScript:**
   Tanto el backend NestJS como el frontend Next.js compilaron con **0 errores tipados** (`npx tsc --noEmit`), evidenciando interfaces bien definidas y apego a los estándares del lenguaje.

---

## 5. 📋 Estado de Cumplimiento del Product Backlog

Comparativa contra `docs/backlog/PRODUCT_BACKLOG.md`:

| Épica / User Story | Prioridad | Estado | Comentarios |
| :--- | :---: | :---: | :--- |
| **US01: Setup Docker & .env** | Must Have | 🟢 **DONE** | Docker Compose funcional con healthchecks de Postgres. |
| **US02: Autenticación & RBAC** | Must Have | 🟡 **PARCIAL** | JWT y guards listos, pero vulnerado por el conmutador de roles en UI. |
| **US03: Configuración Anti-Fraude QR** | Must Have | 🟡 **PARCIAL** | Backend blindado con `@Roles(RolUsuario.ADMIN)`, pero bug en frontend. |
| **US04: Gestión de Sucursales** | Must Have | 🟢 **DONE** | CRUD implementado en backend y consumido en frontend. |
| **US05: Alta de Modelos con Invariante**| Must Have | 🟢 **DONE** | Valida atomicamente $\ge 1$ variante. |
| **US06: Carga Masiva de Variantes CSV** | Should Have | 🟢 **DONE** | Auto-importador funcional en seed y endpoint administrativo. |
| **US07: Catálogo Base de Accesorios** | Must Have | 🟢 **DONE** | Categorías y accesorios base estructurados. |
| **US08: Nota de Ingreso Unificada** | Must Have | 🟢 **DONE** | Dispositivos y lotes en una sola nota con proveedor y comprobante. |
| **US09: Creación In-Line de Variantes** | Should Have | 🟢 **DONE** | Modal "al vuelo" integrado en la recepción de mercadería. |
| **US10: Lotes Diferenciados de Accesorios**| Must Have | 🟢 **DONE** | Lotes con diferenciador, costos y precios independientes. |
| **US11: Monitor de Inventario por IMEI**| Must Have | 🟢 **DONE** | Búsqueda por IMEI/Serie/Modelo y filtros por estado. |
| **US12: Apertura & Arqueo Ciego de Caja**| Must Have | 🟢 **DONE** | Bloqueo de POS si caja cerrada, arqueo ciego y justificación. |
| **US13: Gastos Operativos de Caja** | Must Have | 🟢 **DONE** | Registro de gastos con validación de saldo en efectivo disponible. |
| **US14: Venta en Mostrador (POS)** | Must Have | 🟢 **DONE** | Carrito dinámico, snapshot de costos y deducción atómica de inventario. |
| **US15: Cobro QR & Referencia Obligatoria**| Must Have | 🟢 **DONE** | Referencia bancaria obligatoria para confirmar venta. |
| **US16: Comprobante de Compra y Cliente**| Must Have | 🟢 **DONE** | Captura de cliente y generación de ticket con IMEI y garantía. |
| **US17: Reporte de Rentabilidad Neta** | Must Have | 🔴 **PENDIENTE** | No existe pantalla de reportes por fecha/sucursal ni cálculo consolidado. |
| **US18: Auditoría y Línea de Vida IMEI**| Should Have | 🔴 **PENDIENTE** | No hay trazabilidad cronológica individual por IMEI (proveedor $\to$ venta $\to$ cliente). |
| **US19: Anulación de Venta con Rollback**| Should Have | 🔴 **PENDIENTE** | `Venta` carece de estado `ANULADA` y no hay endpoint de reversa atómica. |

---

## 6. 🚀 Plan de Remediación y Mejoras Recomendadas

### 🎯 Fase 1: Correcciones Críticas de Seguridad y Contrato (Inmediato)
* Purgar contraseñas en texto plano del frontend y eliminar el menú de conmutación de roles de la barra de navegación.
* Corregir el contrato de datos del QR y cuentas bancarias entre backend y frontend.
* Parametrizar contraseñas maestras y rutas en `backend/src/prisma/seed.service.ts` mediante variables `.env`.
* Inicializar el repositorio Git en la raíz del proyecto.

### 💼 Fase 2: Robustecimiento del Dominio Financiero y Control de Precios
* Incorporar `precioVentaSugeridoBs` en el modelo `Dispositivo` y censurar el costo de compra para el rol `VENDEDOR`.
* Establecer validaciones de piso mínimo en mostrador para evitar ventas a pérdida sin autorización de `ADMIN`.
* Implementar verificación cruzada dual de IMEIs (`imei1` vs `imei2`).

### 🧪 Fase 3: Calidad de Software y Cumplimiento del DoD
* Configurar infraestructura de pruebas con Jest y Supertest en Backend, y Testing Library en Frontend.
* Desarrollar pruebas unitarias y de integración para los servicios críticos (`VentasService`, `CajaService`, `RecepcionService`, `ModelosService`).
* Alcanzar la meta del 80% de cobertura de lógica de negocio.

### 📈 Fase 4: Completitud del Backlog (Épica 5)
* Implementar US19: Anulación de ventas con reversa atómica de stock y recálculo de caja activa.
* Implementar US18: Vista de auditoría cronológica y línea de vida completa por IMEI.
* Implementar US17: Dashboard analítico de rentabilidad neta consolidada y reportes de caja por rango de fechas.

### 🐳 Fase 5: Docker en Producción y CI/CD
* Crear Dockerfiles multi-stage para optimizar peso y rendimiento en despliegue.
* Configurar workflows de GitHub Actions para validación continua (lint, typecheck, tests).
