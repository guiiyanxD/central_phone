# 🛡️ REGLAS INMUTABLES Y CONTEXTO TÉCNICO - CENTRALPHONE

Este documento establece las directrices arquitectónicas, de seguridad y de negocio que rigen el desarrollo del proyecto **CentralPhone**. Estas reglas son **inmutables** y de obligatorio cumplimiento en todos los sprints y tareas.

---

## 🔒 1. Regla Inmutable de Seguridad y Variables de Entorno

1. **Cero Secretos Expuestos**: Ninguna contraseña, usuario, clave secreta de JWT, API key, cadena de conexión a base de datos, puerto sensible ni ruta de archivos puede estar quemada (hardcodeada) en el código fuente, repositorios, Dockerfiles ni scripts.
2. **Uso Obligatorio de `.env`**: Toda configuración variable y credencial debe residir exclusivamente en el archivo `.env`.
3. **Plantilla Obligatoria `.env.example`**: El proyecto debe contar y mantener al día un archivo `.env.example` en la raíz, que documente todas las variables necesarias con valores ficticios/de ejemplo sin exponer datos reales.
4. **Referencia desde `docker-compose.yml`**: Toda la infraestructura contenerizada debe mapear e inyectar variables de entorno referenciando el archivo `.env` mediante la directiva `env_file:` o interpolación de variables `${VAR_NAME}`.
5. **GitIgnore Estricto**: El archivo `.env` y cualquier archivo con credenciales locales (`*.local.env`) deben estar explícitamente listados en `.gitignore`.

---

## 🛠️ 2. Stack Tecnológico Oficial

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | **React + TypeScript + Next.js (App Router)** | Aplicación cliente optimizada para PC de mostrador y tablets en tienda. |
| **Diseño y UI** | **Tailwind CSS + Shadcn UI** | Sistema de diseño de alta velocidad, tipado y accesible. |
| **Backend** | **NestJS (Node.js / TypeScript)** | API REST modular, Clean Architecture, inyección de dependencias y validaciones estrictas (class-validator). |
| **Base de Datos** | **PostgreSQL** | Motor relacional con transacciones ACID para integridad de inventario y caja. |
| **ORM** | **Prisma ORM** | Modelado de datos tipado de punta a punta, migraciones deterministas y queries optimizadas. |
| **Contenerización** | **Docker & Docker Compose** | Orquestación aislada de los servicios (PostgreSQL, Backend NestJS y Frontend Next.js). |

---

## ⚖️ 3. Reglas Inmutables del Negocio y del Dominio

1. **Trazabilidad Serializada Estricta por Dispositivo**:
   * Cada unidad física de teléfono es única y está identificada obligatoriamente por `numero_serie` (UK) y `imei_1` (UK), con soporte opcional de `imei_2` (UK) para equipos Dual SIM / eSIM.
   * Ningún teléfono puede ingresar o salir del sistema sin sus identificadores unívocos.
   * Estados de ciclo de vida del dispositivo: `DISPONIBLE`, `VENDIDO`, `RESERVADO`, `EN_GARANTIA`, `DEFECTUOSO`.

2. **Invariante de Modelo y Variantes (Catálogo)**:
   * Todo `ModeloDispositivo` (ej: iPhone 18 Pro) nace y existe obligatoriamente con **al menos una** `VarianteDispositivo` (Color, Capacidad GB, Tipo SIM). No existen modelos huérfanos sin variantes.
   * Para no demorar la entrega de proveedores en tienda, se implementa creación in-line ("al vuelo") de variantes en el formulario de recepción.

3. **Recepción Unificada de Mercadería (`NotaIngreso`)**:
   * Los teléfonos y los accesorios ingresan juntos mediante una sola Nota de Ingreso vinculada a un proveedor mayorista, una sucursal destino, un usuario receptor y un comprobante.

4. **Lotes Diferenciados para un Mismo Accesorio**:
   * Un accesorio base (ej: "Funda iPhone 13") puede contar con múltiples lotes de inventario simultáneos.
   * Cada lote cuenta obligatoriamente con: `nombre_diferenciador` (ej: "Silicona Simple Bs 40" vs "MagSafe Reforzada Bs 100"), costo unitario de adquisición, precio de venta sugerido y stock independiente.

5. **Seguridad Anti-Fraude en Pagos (QR Corporativo Centralizado)**:
   * El código QR oficial estático y los datos bancarios de la empresa son únicos y globales.
   * **Solo el rol `ADMIN`** tiene permisos para subir o actualizar la imagen del QR y la cuenta receptora.
   * En el Punto de Venta (POS), los vendedores tienen acceso de **solo lectura** para proyectar el QR oficial al cliente, registrando el número de comprobante o referencia bancaria para auditoría.

6. **Inmutabilidad de Costos y Cálculo Financiero en 3FN**:
   * La tabla `detalle_ventas` almacena el snapshot del `costo_unitario_bs` y `precio_unitario_bs` al momento exacto de la venta.
   * La ganancia neta se calcula dinámicamente: `subtotal_bs - (costo_unitario_bs * cantidad)`. No se almacenan valores redundantes que puedan desincronizarse.

7. **Control Obligatorio de Caja Diaria y Arqueo**:
   * No se permite procesar ninguna venta si no existe una sesión de caja `ABIERTA` para el usuario en la sucursal actual.
   * El cierre de turno exige un **conteo físico a ciegas** por parte del vendedor. Si existe diferencia (sobrante o faltante) respecto al balance teórico del sistema, es obligatorio registrar una justificación para auditoría del Administrador.

8. **Escalabilidad Multi-Sucursal**:
   * Toda sucursal opera de manera independiente con su propio inventario de dispositivos físicos, sus propios lotes de accesorios y sus propias cajas diarias.
