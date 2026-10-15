# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Frontend**: React + TypeScript + Next.js (App Router) + Tailwind CSS + Shadcn UI
- **Backend**: NestJS (TypeScript, Arquitectura Modular / Clean Architecture)
- **Base de Datos & ORM**: PostgreSQL + Prisma ORM
- **Entorno e Infraestructura**: Docker & Docker Compose (servicios contenerizados para base de datos y backend)

## Users

- **Vendedor de Mostrador**: Personal de tienda en punto de venta (PC o tablet). Requiere agilidad máxima para escanear/buscar IMEIs, despachar fundas/accesorios rápidamente, cobrar en efectivo o proyectar el QR oficial sin fricciones, y registrar egresos menores diarios.
- **Administrador / Dueño**: Propietario del negocio o encargado de sucursal. Requiere control total anti-fraude (gestión exclusiva del QR corporativo y cuentas de banco), auditoría de compras a proveedores, control de rentabilidad neta real (venta - costo histórico), apertura y arqueo ciego de cajas, y transferencias entre sucursales.
- **Cliente**: Comprador en tienda que exige claridad en los precios, garantía por escrito con respaldo de IMEI y agilidad en el pago mediante QR Simple de la banca boliviana.

## Product Purpose

Digitalizar, profesionalizar y blindar financieramente las operaciones de la tienda de dispositivos móviles y accesorios **CentralPhone**. Elimina las planillas manuales de cálculo propensas a errores, garantizando trazabilidad unitaria estricta por IMEI, control de lotes diferenciados de accesorios (distintas calidades y precios), arqueos de caja transparentes y protección anti-fraude en pagos por QR.

## Positioning

A diferencia de los sistemas POS genéricos de retail que no comprenden el ciclo de vida de un teléfono (IMEIs duales, condiciones nuevo/usado, números de serie y garantías unitarias) o que asumen un único precio para accesorios homónimos, **CentralPhone** está diseñado a la medida de la industria móvil boliviana: rastreo serializado por IMEI, gestión de lotes con precios diferenciados para un mismo accesorio, control anti-fraude con QR corporativo inalterable y cálculo exacto de rentabilidad neta histórica.

## Operating Context

- **Entorno Físico**: Puntos de venta físicos en mostrador (PC de escritorio, laptops y tablets) con teclado, mouse y lector óptico de código de barras / IMEIs.
- **Entorno Bancario**: Mercado boliviano con adopción masiva del sistema de cobro interoperable QR (Simple / Billetera Móvil), donde la visualización limpia y de alta resolución del código QR en pantalla es vital para el éxito de la transacción.
- **Dinámica de Mercadería**: Entregas frecuentes por parte de proveedores mayoristas (Beby, Javier, Gabriela) donde llegan simultáneamente teléfonos con IMEIs y bultos de accesorios con precios variables según la calidad del lote.

## Capabilities and Constraints

- **Trazabilidad Serializada**: Validación estricta de unicidad para `imei_1`, `imei_2` y `numero_serie`. Estados de inventario: `DISPONIBLE`, `VENDIDO`, `RESERVADO`, `EN_GARANTIA`, `DEFECTUOSO`.
- **Invariante de Modelo**: Un `ModeloDispositivo` siempre se compone de al menos una `VarianteDispositivo` (Color, Capacidad GB, Tipo SIM). No existen modelos huérfanos. Creación in-line ("al vuelo") habilitada en recepción.
- **Lotes Diferenciados de Accesorios**: Soporte para que un mismo accesorio base (ej. "Funda iPhone 13") tenga lotes independientes en stock con su propio costo, precio de venta diferenciado (ej. Bs 40 vs Bs 100) y etiqueta identificadora para el vendedor.
- **Seguridad Anti-Fraude**: El QR estático oficial de cobro y los datos bancarios son globales y de solo lectura para el vendedor; únicamente el rol `ADMIN` puede modificar o subir la imagen del QR para evitar desvíos de fondos.
- **Multi-Sucursal**: Preparado para operar múltiples tiendas físicas sin almacén central, manteniendo stock de accesorios, equipos y cajas diarias independientes por sucursal.
- **Cálculo Financiero Histórico**: `detalle_ventas` captura el snapshot del costo unitario al momento de la venta para calcular la ganancia real exacta en 3FN, inmune a futuras compras.

## Brand Commitments

- **Nombre Comercial**: CentralPhone.
- **Identidad Visual**: Logotipo oficial registrado en `docs/requerimientos/logo.png`.
- **Tono y Voz**: Profesional, confiable, ágil y seguro.
- **Moneda**: Manejo primario en Bolivianos (Bs) con registro referencial del costo en Dólares ($).

## Evidence on Hand

- `docs/requerimientos/logo.png`: Logotipo de la marca CentralPhone.
- `docs/requerimientos/ingresos.jpeg`: Planilla histórica de compras, inventario de teléfonos, IMEIs y proveedores.
- `docs/requerimientos/ventas_del_dia.jpeg`: Planilla real de ventas diarias, cobros en QR/Efectivo, gastos de caja y márgenes de ganancia.
- `docs/requerimientos/combinaciones_iphone18.csv`: Catálogo base de variantes oficiales de Apple (Modelo, Color, Capacidad).
- `docs/modelo_datos/modelo_datos.puml`: Modelo de datos en Tercera Forma Normal (3FN).
- `docs/diagrama_clases/diagrama_clases.puml`: Diagrama de clases con métodos de negocio y Strategy Pattern para pagos.
- `docs/casos_uso/`: Especificación completa de casos de uso y matriz detallada.
- `docs/flujos_usuario/`: Diagramas de actividad PlantUML para los 4 flujos maestros de negocio.

## Product Principles

1. **Integridad y Trazabilidad Absoluta**: Ningún teléfono entra o sale del sistema sin su identidad física unívoca (IMEI/Serie), y ningún monto de dinero entra o sale sin estar vinculado a una caja diaria y método de cobro auditable.
2. **Cero Fricción en Mostrador**: La interfaz de venta debe permitir cerrar una transacción en menos de 20 segundos mediante búsqueda rápida de IMEIs, selección clara de lotes de accesorios y renderizado instantáneo del QR de cobro.
3. **Seguridad y Control Anti-Fraude por Diseño**: Los recursos financieros sensibles (QR oficial, anulación de ventas, arqueos de caja y costos confidenciales) están blindados por control de acceso basado en roles (RBAC).
4. **Resiliencia Operativa**: Separación arquitectónica limpia entre Frontend (Next.js) y Backend (NestJS con Docker), asegurando que el punto de venta sea reactivo, desacoplado y preparado para escalar a múltiples sucursales.

## Accessibility & Inclusion

- Contraste visual elevado y tipografía de fácil legibilidad para entornos de mostrador con iluminación variable.
- Navegabilidad óptima tanto por teclado (atajos rápidos para escáner de códigos de barras) como por interfaz táctil en tablets.
