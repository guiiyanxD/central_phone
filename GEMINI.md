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

---

## 💾 9. Directriz Inmutable de Almacenamiento Multimedia y Optimización de Imágenes

1. **Persistencia Desacoplada de Contenedores (Host Bind Mount)**:
   * Todo archivo multimedia persistente (imágenes de códigos QR, comprobantes y catálogos futuros) debe almacenarse en el sistema de archivos del host mediante un Bind Mount (`./uploads:/app/uploads`).
   * Está estrictamente prohibido depender únicamente de volúmenes nombrados efímeros de Docker que puedan destruirse en comandos de reconstrucción (`docker compose down -v`).
2. **Pipeline Obligatorio de Optimización con `sharp`**:
   * Ninguna imagen puede persistirse o servirse en su formato crudo. Toda carga debe procesarse en el backend con la librería **`sharp`** para:
     * Redimensionar a dimensiones máximas controladas (ej. 800x800 px).
     * Purgar metadatos EXIF sensibles o vectores maliciosos.
     * Comprimir con preservación de contraste visual para lectura óptica de QR.
3. **Resiliencia y Auto-Restauración de Semilla (Seeder)**:
   * Si la base de datos es reiniciada o reconstruida desde cero, el servicio de inicialización (`ensureConfiguracionExists`) debe auto-detectar y restaurar la imagen física existente en `./uploads/qr/` y los datos bancarios reales, evitando la inserción de placeholders ficticios.
4. **Evolución Arquitectónica hacia Catálogo Masivo**:
   * Cuando el negocio escale a miles de imágenes de productos (fotografías de catálogo por variante), la arquitectura evolucionará hacia un servicio de almacenamiento de objetos autohospedado compatible con S3 (**SeaweedFS** o **MinIO**), manteniendo intacto el pipeline de compresión previo con `sharp`.

---

## 🛑 10. Regla Inmutable de Protección de Base de Datos y Comandos Destructivos Prohibidos

1. **Prohibición Total de Flags Destructivos en Docker (`-v`, `--volumes`)**:
   * Queda terminantemente **PROHIBIDO** para cualquier agente de IA, desarrollador o script automatizado ejecutar:
     * `docker compose down -v` o `docker compose down --volumes`.
     * `docker volume rm` sobre cualquier volumen de datos del sistema (`centralphone_postgres_data` o `postgres_data`).
     * `docker system prune --volumes` o `docker volume prune -f`.
   * **Comandos Seguros Obligatorios**:
     * Detener contenedores de forma segura: `docker compose down` (sin flags de volúmenes) o `docker compose stop`.
     * Reconstruir contenedores tras cambios de código o dependencias: `docker compose up -d --build`.
2. **Prohibición de Resets de Base de Datos (`prisma migrate reset`)**:
   * Queda terminantemente **PROHIBIDO** ejecutar `npx prisma migrate reset` o `prisma migrate reset`. Este comando ejecuta un `DROP SCHEMA public CASCADE`, destruyendo de forma irreversible las ventas históricas, arqueos de caja y el inventario serializado.
   * La aplicación de cambios de esquema debe realizarse únicamente con:
     * En entornos de desarrollo: `npx prisma migrate dev` (sin flags de reseteo).
     * En entornos de despliegue / producción: `npx prisma migrate deploy`.
3. **Blindaje de Comandos Destructivos en Scripts (`package.json`)**:
   * Los comandos `prisma:reset` y `migrate:reset` están interceptados en los scripts de Node/NPM con salida de error (`exit 1`), impidiendo su invocación accidental tanto por humanos como por agentes.
4. **Principio de No Destrucción para Agentes de Inteligencia Artificial**:
   * Ningún agente de IA debe sugerir, ejecutar ni generar planes que incluyan el borrado de bases de datos, eliminación de volúmenes o truncado de tablas (`TRUNCATE`, `DROP DATABASE`, `DROP TABLE`).
   * Ante cualquier situación que requiera saneamiento de datos, el agente debe detenerse y solicitar confirmación explícita previa por escrito al usuario.
