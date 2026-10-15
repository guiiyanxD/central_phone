# 📋 Product Backlog - CentralPhone

Este documento define el **Product Backlog oficial** del proyecto CentralPhone, estructurado en Épicas e Historias de Usuario (User Stories) redactadas bajo el marco de trabajo **SCRUM**, con criterios de aceptación en formato **Gherkin (Given-When-Then)**, estimación en Story Points y *Definition of Done* (DoD).

---

## 🎯 Definition of Done (DoD) General
Para que cualquier Historia de Usuario sea declarada **DONE**, debe cumplir:
1. Código fuente en TypeScript compilando sin errores ni warnings críticos en Frontend (Next.js) y Backend (NestJS).
2. Pruebas unitarias e integración pasando en verde (cobertura mínima de lógica de negocio: 80%).
3. Cumplimiento estricto de la regla de variables de entorno: ninguna credencial hardcodeada, todo en `.env` / referenciado en `docker-compose.yml`.
4. Validaciones de entrada implementadas con DTOs tipados (`class-validator` / Zod).
5. Migraciones de Prisma generadas y aplicadas de forma reproducible.
6. Criterios de aceptación (Gherkin) verificados y probados.
7. Código revisado y documentado con comentarios técnicos pertinentes.

---

## 🏛️ ÉPICA 1: Infraestructura, Seguridad y Gestión de Sucursales

### US01: Setup del Entorno Contenerizado y Gestión Segura de Credenciales
* **Como** Desarrollador / DevOps del equipo,
* **Quiero** configurar el entorno de desarrollo multi-contenedor con Docker Compose y variables de entorno desacopladas,
* **Para** garantizar que la base de datos PostgreSQL, el backend NestJS y el frontend Next.js se ejecuten de forma idéntica y segura en cualquier equipo sin exponer secretos.
* **Prioridad**: Must Have (Sprint 0) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Inicialización de servicios con variables de entorno
  * **Dado que** existe un archivo `.env` configurado según `.env.example`,
  * **Cuando** se ejecuta `docker compose up -d`,
  * **Entonces** los contenedores de `postgres`, `backend` y `frontend` inician en estado *healthy* sin hardcodear credenciales en `docker-compose.yml`.
* **Escenario 2**: Conectividad y migraciones de Prisma
  * **Dado que** el contenedor de PostgreSQL está levantado,
  * **Cuando** el backend ejecuta `npx prisma migrate dev`,
  * **Entonces** las tablas del esquema en 3FN se crean exitosamente en la base de datos.

---

### US02: Autenticación de Usuarios y Control de Acceso por Roles (RBAC)
* **Como** Administrador del sistema,
* **Quiero** autenticarme mediante credenciales seguras y contar con permisos diferenciados entre Administrador y Vendedor,
* **Para** blindar las operaciones críticas del negocio y permitir a los vendedores operar solo en su sucursal asignada.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Inicio de sesión exitoso
  * **Dado que** un usuario con rol `VENDEDOR` existe con email y contraseña válida,
  * **Cuando** ingresa sus credenciales en el login,
  * **Entonces** el sistema retorna un token JWT firmado y redirige a la vista del Punto de Venta de su sucursal asignada.
* **Escenario 2**: Bloqueo de acceso no autorizado
  * **Dado que** un usuario con rol `VENDEDOR` intenta acceder a la ruta de configuración global o gestión de usuarios,
  * **Cuando** realiza la petición HTTP,
  * **Entonces** el backend responde con código de estado `403 Forbidden` y el frontend muestra mensaje de acceso denegado.

---

### US03: Configuración Anti-Fraude del QR Oficial y Cuentas Bancarias
* **Como** Administrador del negocio,
* **Quiero** cargar y actualizar de forma centralizada la imagen del QR oficial y los datos bancarios de la empresa,
* **Para** garantizar que los empleados no puedan utilizar sus propios QRs personales para recibir pagos de clientes.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Administrador actualiza el QR oficial
  * **Dado que** un usuario autenticado con rol `ADMIN` ingresa a "Configuración de Empresa",
  * **Cuando** sube una imagen PNG/JPEG del código QR oficial y completa los datos de Banco, Titular y Nro. de Cuenta,
  * **Entonces** el sistema almacena la imagen en el directorio seguro, actualiza el registro singleton `configuracion_negocio` y registra auditoría del usuario que realizó el cambio.
* **Escenario 2**: Vendedor solo tiene permiso de lectura del QR
  * **Dado que** un usuario con rol `VENDEDOR` consulta las opciones del sistema,
  * **Cuando** inspecciona la configuración o pantalla de cobro,
  * **Entonces** el sistema únicamente le muestra la imagen del QR de forma inalterable y no ofrece ningún botón ni endpoint para sustituir el archivo.

---

### US04: Gestión de Sucursales de Tienda
* **Como** Administrador,
* **Quiero** registrar y administrar las sucursales físicas de CentralPhone,
* **Para** asignar empleados, asociar el inventario local y controlar las cajas diarias de cada tienda de forma independiente.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Creación de nueva sucursal
  * **Dado que** el Administrador completa el formulario con Nombre, Dirección, Teléfono y Ciudad,
  * **Cuando** presiona "Guardar Sucursal",
  * **Entonces** la sucursal se persiste en estado `activo = true` y queda disponible para asignación de usuarios y recepción de mercadería.

---

## 📱 ÉPICA 2: Catálogo de Dispositivos y Accesorios

### US05: Alta de Modelos con Invariante Obligatoria de Variantes ($\ge 1$)
* **Como** Administrador,
* **Quiero** registrar modelos de dispositivos exigiendo obligatoriamente al menos una variante (Color, Capacidad, Tipo SIM),
* **Para** evitar la existencia de modelos huérfanos sin características y estandarizar el catálogo de teléfonos.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Creación exitosa de modelo con sus variantes iniciales
  * **Dado que** el usuario ingresa el nombre "iPhone 18 Pro" y agrega al menos una variante ("Black", "256GB", "SIM Físico"),
  * **Cuando** envía la solicitud de guardado,
  * **Entonces** el backend inserta el modelo y la variante dentro de una misma transacción atómica en la base de datos.
* **Escenario 2**: Intento de creación de modelo sin variantes
  * **Dado que** el usuario intenta guardar el modelo "iPhone 18 Pro" sin especificar ninguna variante,
  * **Cuando** envía el formulario,
  * **Entonces** el sistema bloquea el guardado retornando un error de validación: "Un modelo debe contar con al menos una variante definida".

---

### US06: Carga Masiva de Catálogo de Variantes desde Archivo CSV
* **Como** Administrador,
* **Quiero** importar un archivo CSV con las combinaciones oficiales de Apple (Modelo, Color, Capacidad),
* **Para** pre-poblar el catálogo de la tienda en segundos sin realizar entradas manuales repetitivas.
* **Prioridad**: Should Have (Sprint 1) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Importación correcta de combinaciones
  * **Dado que** el Administrador carga el archivo `combinaciones_iphone18.csv`,
  * **Cuando** presiona "Procesar Catálogo",
  * **Entonces** el sistema procesa el CSV, crea los modelos inexistentes, vincula todas las variantes y notifica: "36 variantes importadas con éxito".
* **Escenario 2**: Detección de duplicados en CSV
  * **Dado que** una variante ya existe en la base de datos,
  * **Cuando** el archivo CSV vuelve a contenerla,
  * **Entonces** el sistema omite el registro duplicado sin interrumpir la inserción de las variantes restantes.

---

### US07: Catálogo Base de Accesorios y Categorías
* **Como** Administrador,
* **Quiero** registrar las categorías y accesorios base de la tienda (ej. "Funda iPhone 13", "Cabezal 20W"),
* **Para** tener un catálogo general sobre el cual se crearán los lotes diferenciados de venta.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Alta de accesorio base
  * **Dado que** existe la categoría "Fundas",
  * **Cuando** el usuario registra el accesorio "Funda iPhone 13",
  * **Entonces** el accesorio queda registrado en el catálogo global listo para recibir lotes en cualquier sucursal.

---

## 📦 ÉPICA 3: Recepción Unificada de Mercadería e Inventario

### US08: Registro de Nota de Ingreso Unificada con Validación de IMEIs
* **Como** Vendedor / Administrador,
* **Quiero** registrar la llegada de mercadería desde un proveedor mediante una Nota de Ingreso con validación de IMEIs únicos,
* **Para** ingresar teléfonos al inventario con sus costos históricos en Bolivianos y Dólares sin permitir series duplicadas.
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 8 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Ingreso exitoso de dispositivo serializado
  * **Dado que** se ingresa Proveedor "Javier", Sucursal "Central", variante "iPhone 18 Pro Black 256GB" y un IMEI 1 nunca antes registrado,
  * **Cuando** se confirma la Nota de Ingreso,
  * **Entonces** se crea la `nota_ingreso`, se inserta el `dispositivo` en estado `DISPONIBLE` y se asocian sus costos históricos en Bs y $.
* **Escenario 2**: Detección de IMEI o Serie duplicada
  * **Dado que** un IMEI 1 ya existe en la base de datos de cualquier sucursal,
  * **Cuando** el usuario intenta ingresarlo en una nueva nota,
  * **Entonces** el sistema bloquea la inserción y resalta el campo con la alerta: "El IMEI [número] ya se encuentra registrado en el sistema".

---

### US09: Creación In-Line ("Al Vuelo") de Variantes en Recepción
* **Como** Vendedor / Administrador recepcionista,
* **Quiero** dar de alta rápidamente una nueva combinación de color o capacidad desde el formulario de recepción,
* **Para** no hacer esperar al proveedor ni abandonar la pantalla de ingreso de mercadería.
* **Prioridad**: Should Have (Sprint 1) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Creación al vuelo sin salir del formulario
  * **Dado que** el usuario está registrando una Nota de Ingreso y el teléfono recibido tiene un color nuevo no listado,
  * **Cuando** selecciona `+ Crear Variante Rápida` e ingresa el color y capacidad,
  * **Entonces** la variante se persiste de inmediato y queda preseleccionada en el formulario para continuar escaneando los IMEIs.

---

### US10: Registro de Lotes Diferenciados de Accesorios
* **Como** Vendedor / Administrador,
* **Quiero** registrar entradas de accesorios asignándoles un nombre diferenciador, costo de compra y precio de venta,
* **Para** permitir que en la misma tienda convivan fundas del mismo modelo pero con diferentes calidades y precios (ej. Bs 40 vs Bs 100).
* **Prioridad**: Must Have (Sprint 1) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Ingreso de lote con precio diferenciado
  * **Dado que** se selecciona el accesorio "Funda iPhone 13",
  * **Cuando** el usuario registra "Silicona simple" con costo Bs 25, precio venta Bs 40 y cantidad 20 unidades,
  * **Entonces** se crea un `lote_accesorio` independiente en la sucursal con `stock_actual = 20` y precio visible de Bs 40.

---

### US11: Monitor de Inventario y Filtros por IMEI y Lotes
* **Como** Vendedor / Administrador,
* **Quiero** buscar dispositivos por IMEI, serie, modelo o estado, y consultar existencias de lotes de accesorios,
* **Para** ubicar rápidamente qué equipos están disponibles y alertar sobre stock bajo.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Búsqueda instantánea por IMEI
  * **Dado que** el vendedor escanea o tipea los 15 dígitos de un IMEI en el buscador de inventario,
  * **Cuando** presiona enter,
  * **Entonces** el sistema muestra de inmediato el estado actual (`DISPONIBLE`, `VENDIDO`), modelo, color, capacidad, sucursal física y proveedor de origen.

---

## 🛒 ÉPICA 4: Punto de Venta (POS), Cobros y Caja Diaria

### US12: Apertura y Cierre de Caja Diaria con Arqueo Ciego
* **Como** Vendedor,
* **Quiero** abrir mi turno con un monto inicial en efectivo y realizar el cierre mediante conteo a ciegas,
* **Para** asegurar la transparencia del efectivo físico y justificar cualquier descuadre de dinero.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Apertura obligatoria de turno
  * **Dado que** un vendedor inicia su turno sin caja abierta,
  * **Cuando** ingresa el monto inicial de Bs 300,
  * **Entonces** la caja pasa a estado `ABIERTA` y se desbloquea el terminal de ventas.
* **Escenario 2**: Cierre con detección de faltante
  * **Dado que** el sistema calcula que deberían haber Bs 1.500 en efectivo pero el vendedor cuenta físicamente Bs 1.450,
  * **Cuando** registra el cierre,
  * **Entonces** el sistema detecta una diferencia de -Bs 50, exige ingresar un motivo de justificación y archiva el turno en estado `CERRADA`.

---

### US13: Registro de Gastos Operativos Menores de Caja
* **Como** Vendedor,
* **Quiero** registrar egresos menores de dinero de la caja (chips Tigo, refrigerios/tomicha, transporte),
* **Para** mantener cuadrado el efectivo de la tienda y justificar las salidas de dinero del día.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Registro de gasto en efectivo con saldo suficiente
  * **Dado que** la caja abierta tiene Bs 800 en efectivo,
  * **Cuando** el vendedor registra un gasto de Bs 25 por "Chip Tigo Yuli" en categoría "Chips/Telefonía",
  * **Entonces** se crea el registro en `gastos_operativos` y el saldo disponible en efectivo de la caja disminuye a Bs 775.
* **Escenario 2**: Bloqueo por saldo en efectivo insuficiente
  * **Dado que** la caja tiene Bs 20 en efectivo,
  * **Cuando** el vendedor intenta registrar un gasto de Bs 50,
  * **Entonces** el sistema bloquea la operación alertando: "Saldo en efectivo insuficiente en caja".

---

### US14: Registro de Venta en Mostrador (POS)
* **Como** Vendedor,
* **Quiero** armar una venta seleccionando teléfonos por su IMEI y accesorios desde su lote con precio específico,
* **Para** facturar los productos al cliente deduciendo el stock de forma atómica y exacta.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 8 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Venta mixta de equipo y accesorio
  * **Dado que** el vendedor agrega un iPhone 15 por su IMEI y 1 funda seleccionando el lote de Bs 40,
  * **Cuando** confirma la transacción,
  * **Entonces** el sistema ejecuta una transacción ACID: marca el IMEI como `VENDIDO`, descuenta 1 unidad del lote de Bs 40, registra el snapshot de los costos históricos y actualiza la venta.

---

### US15: Cobro con Proyección del QR Oficial y Registro de Referencia
* **Como** Vendedor,
* **Quiero** seleccionar el método de cobro QR y mostrar en pantalla el código QR corporativo inalterable,
* **Para** permitir al cliente pagar desde su banca móvil y registrar el código de comprobante para auditoría.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Cobro exitoso por QR oficial
  * **Dado que** el cliente elige pagar con QR un total de Bs 4.000,
  * **Cuando** el vendedor selecciona "Pago QR",
  * **Entonces** el sistema proyecta en pantalla la imagen del QR corporativo de la empresa, y al confirmar la transferencia exige ingresar el número de referencia bancaria antes de finalizar el ticket.

---

### US16: Emisión de Comprobante / Recibo con Garantía y Datos de Cliente
* **Como** Vendedor,
* **Quiero** capturar el nombre y WhatsApp del cliente y generar un recibo de venta digital/imprimible,
* **Para** brindar respaldo de compra, detallar los IMEIs vendidos y estipular las condiciones de garantía.
* **Prioridad**: Must Have (Sprint 2) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Generación de recibo de compra
  * **Dado que** se finaliza una venta,
  * **Cuando** se genera el comprobante,
  * **Entonces** el documento muestra: Fecha, Nombre de Cliente, Teléfono, Detalle de ítems con IMEI/Serie, método de pago, monto total y enlace para compartir por WhatsApp.

---

## 📊 ÉPICA 5: Reportes Financieros y Auditoría

### US17: Reporte de Rentabilidad Neta y Balance de Caja
* **Como** Administrador,
* **Quiero** consultar las ganancias netas del día o de un rango de fechas por sucursal,
* **Para** conocer la rentabilidad real de la tienda calculada como `Venta - Costo Histórico - Gastos Operativos`.
* **Prioridad**: Must Have (Sprint 3) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Cálculo dinámico de rentabilidad neta
  * **Dado que** se consultan las ventas de una fecha seleccionada,
  * **Cuando** el Administrador visualiza el reporte financiero,
  * **Entonces** el sistema muestra: Total Ingresos Bs, Total Costo Mercadería Bs, Ganancia Bruta, Total Gastos Operativos y Ganancia Neta Real, desglosado por Efectivo y QR.

---

### US18: Auditoría y Línea de Vida Completa por IMEI
* **Como** Administrador,
* **Quiero** buscar cualquier IMEI y visualizar su trazabilidad completa,
* **Para** resolver reclamos de garantía, devoluciones o auditar a qué proveedor se le compró y a qué cliente se le vendió.
* **Prioridad**: Should Have (Sprint 3) | **Estimación**: 3 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Trazabilidad completa de un dispositivo
  * **Dado que** el Administrador consulta un IMEI específico,
  * **Cuando** carga la vista de auditoría,
  * **Entonces** se despliega la cronología: Fecha de recepción, Nota de ingreso, Proveedor de origen, Costo de adquisición, Sucursal destino, Fecha de venta, Vendedor que atendió, Cliente comprador y Ganancia neta generada.

---

### US19: Anulación de Venta con Rollback Atómico (Solo Admin)
* **Como** Administrador,
* **Quiero** anular una venta errónea revirtiendo el inventario y el dinero de caja de forma atómica,
* **Para** corregir equivocaciones de mostrador sin descuadrar el stock ni la contabilidad.
* **Prioridad**: Should Have (Sprint 3) | **Estimación**: 5 SP

#### Criterios de Aceptación (Gherkin):
* **Escenario 1**: Reversa atómica de venta con caja abierta
  * **Dado que** una venta de la jornada actual contiene un error,
  * **Cuando** el Administrador autoriza la anulación e ingresa el motivo,
  * **Entonces** la venta pasa a estado `ANULADA`, los IMEIs regresan a estado `DISPONIBLE`, los lotes de accesorios incrementan su stock y se deduce el importe de la caja activa.
