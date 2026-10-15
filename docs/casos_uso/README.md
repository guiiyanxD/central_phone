# Catálogo Integral de Casos de Uso - CentralPhone

Este documento cataloga todos los Casos de Uso del sistema, divididos en módulos funcionales y formalizados mediante diagramas PlantUML en este mismo directorio.

---

## 🗺️ Diagramas PlantUML Disponibles

* 🌐 [Diagrama General de Casos de Uso](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/casos_uso/casos_uso_general.puml)
* 📦 [Módulo 1: Catálogo, Recepción e Inventario](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/casos_uso/cu_catalogo_inventario.puml)
* 💳 [Módulo 2: Punto de Venta (POS), Caja Diaria y Clientes](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/casos_uso/cu_ventas_caja.puml)
* ⚙️ [Módulo 3: Administración, Seguridad y Reportes](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/casos_uso/cu_administracion_reportes.puml)

---

## 👥 Actores del Sistema

1. **Usuario (Base)**: Persona autenticada con credenciales válidas en el sistema.
2. **Vendedor**: Personal de tienda asignado a una sucursal; opera el Punto de Venta, abre y cierra su caja, registra gastos menores, consulta inventarios y recepciona mercadería.
3. **Administrador**: Dueño o encargado general; administra usuarios, sucursales, el QR oficial único de cobro, precios y catálogos, transferencias entre sucursales y reportes de rentabilidad.
4. **Proveedor** *(Externo)*: Abastece mercadería mediante notas de ingreso.
5. **Cliente** *(Externo)*: Adquiere productos y liquida mediante Efectivo o QR Oficial.

---

## 📋 Matriz Detallada de Casos de Uso

### Módulo 1: Catálogo, Recepción e Inventario
| Código | Caso de Uso | Actor Principal | Descripción |
| :--- | :--- | :--- | :--- |
| **CU_INV_01** | Gestionar Modelos de Dispositivo | Administrador | Alta y edición de modelos base (ej. iPhone 18 Pro). Exige obligatoriamente al menos una variante. |
| **CU_INV_02** | Gestionar Variantes de Dispositivo | Administrador | Definición de combinaciones comerciales: Color, Capacidad (GB) y Tipo de SIM. |
| **CU_INV_03** | Importar Catálogo en Lote (CSV) | Administrador | Carga masiva de combinaciones oficiales (ej. `combinaciones_iphone18.csv`). |
| **CU_INV_04** | Gestionar Categorías de Accesorios | Administrador | Alta y mantenimiento de agrupadores (Fundas, Cargadores, Hidrogel, Audio). |
| **CU_INV_05** | Gestionar Catálogo de Accesorios | Administrador | Alta del accesorio base (ej. "Funda iPhone 13"). |
| **CU_INV_06** | Crear Variante In-line ("Al Vuelo") | Vendedor / Admin | Modal rápido para dar de alta una variante durante la recepción sin abandonar el formulario. |
| **CU_INV_07** | Gestionar Proveedores | Administrador | Directorio de proveedores mayoristas (Beby, Javier, Gabriela). |
| **CU_INV_08** | Registrar Nota de Ingreso Unificada | Vendedor / Admin | Encabezado de recepción de mercadería (Proveedor, Sucursal, Fecha, Nro. Comprobante). |
| **CU_INV_09** | Registrar Dispositivos Serializados | Vendedor / Admin | Inclusión de unidades físicas con validación de IMEI 1, IMEI 2, Serie, Condición y Costos. |
| **CU_INV_10** | Registrar Lotes Diferenciados de Accesorio | Vendedor / Admin | Entrada de accesorios especificando nombre diferenciador (ej. Bs 40 vs Bs 100), costo y stock. |
| **CU_INV_11** | Consultar Historial de Notas de Ingreso | Vendedor / Admin | Listado auditable de compras y entradas de stock. |
| **CU_INV_12** | Anular Nota de Ingreso | Administrador | Reversa entradas erróneas siempre que las unidades no hayan sido vendidas. |
| **CU_INV_13** | Consultar Inventario de Dispositivos | Vendedor / Admin | Búsqueda por IMEI, Serie, Modelo, Estado (Disponible, Vendido) y Sucursal. |
| **CU_INV_14** | Consultar Stock de Lotes de Accesorios | Vendedor / Admin | Monitor de existencias de accesorios con alertas de stock mínimo por sucursal. |
| **CU_INV_15** | Transferir Dispositivo entre Sucursales | Administrador | Traslado de un teléfono físico de una tienda a otra con registro de trazabilidad. |
| **CU_INV_16** | Transferir Stock de Lote entre Sucursales | Administrador | Movimiento de unidades de un lote de accesorios entre sucursales. |
| **CU_INV_17** | Modificar Estado de Dispositivo | Administrador | Cambio manual a 'Garantía', 'En Reparación' o 'Defectuoso'. |

---

### Módulo 2: Punto de Venta (POS), Caja Diaria y Clientes
| Código | Caso de Uso | Actor Principal | Descripción |
| :--- | :--- | :--- | :--- |
| **CU_POS_01** | Abrir Caja Diaria | Vendedor | Inicio de turno en la sucursal registrando monto base en efectivo. |
| **CU_POS_02** | Registrar Gasto Operativo Menor | Vendedor | Salida rápida de dinero (Chips, refrigerio/tomicha, transporte) indicando categoría y concepto. |
| **CU_POS_03** | Gestionar Categorías de Gastos | Administrador | Mantenimiento de conceptos tipificados de egresos de caja. |
| **CU_POS_04** | Cerrar Caja Diaria / Arqueo | Vendedor | Cuadre final: cotejo entre efectivo real contado y el sistema, reportando diferencias. |
| **CU_POS_05** | Consultar Historial de Cajas | Administrador | Auditoría de turnos cerrados, montos de apertura y balances por sucursal. |
| **CU_POS_06** | Registrar Venta (POS) | Vendedor | Flujo de facturación/salida de productos al mostrador. |
| **CU_POS_07** | Validar Caja Abierta | Sistema | Verificación obligatoria de sesión activa antes de permitir ventas. |
| **CU_POS_08** | Seleccionar Dispositivo por IMEI | Vendedor | Búsqueda y asignación de teléfono garantizando estado 'DISPONIBLE'. |
| **CU_POS_09** | Seleccionar Lote Diferenciado de Accesorio | Vendedor | Selección del lote con su respectivo precio visible (ej. Bs 40 vs Bs 100) y descuento de stock. |
| **CU_POS_10** | Procesar Cobro con Estrategia de Pago | Vendedor | Ejecución del pago vía Efectivo o QR Oficial. |
| **CU_POS_11** | Mostrar QR Oficial Centralizado | Sistema | Renderizado en pantalla del QR corporativo inalterable para escaneo del cliente. |
| **CU_POS_12** | Registrar Referencia de Transferencia QR | Vendedor | Ingreso del código de confirmación del comprobante bancario. |
| **CU_POS_13** | Asociar / Registrar Datos de Cliente | Vendedor | Captura de Nombre y WhatsApp/Teléfono para la garantía del equipo. |
| **CU_POS_14** | Emitir Recibo / Comprobante de Venta | Vendedor | Generación de comprobante digital/impreso con detalle de IMEIs y condiciones de garantía. |
| **CU_POS_15** | Consultar Ventas del Día | Vendedor | Listado de tickets generados en el turno actual. |
| **CU_POS_16** | Anular Venta | Administrador | Cancelación de ticket que devuelve el IMEI a 'DISPONIBLE' y restaura el stock del lote. |
| **CU_POS_17** | Gestionar Clientes | Vendedor / Admin | Búsqueda rápida de clientes y actualización de números de contacto. |
| **CU_POS_18** | Consultar Historial de Cliente | Vendedor / Admin | Trazabilidad de compras previas y garantías vigentes de un cliente. |

---

### Módulo 3: Administración, Seguridad y Reportes
| Código | Caso de Uso | Actor Principal | Descripción |
| :--- | :--- | :--- | :--- |
| **CU_ADM_01** | Iniciar Sesión | Usuario | Acceso seguro con email y contraseña encriptada. |
| **CU_ADM_02** | Cerrar Sesión | Usuario | Invalidación de token de sesión. |
| **CU_ADM_03** | Cambiar Contraseña Propia | Usuario | Actualización de clave personal. |
| **CU_ADM_04** | Gestionar Usuarios | Administrador | Alta de empleados, asignación de rol (Admin/Vendedor) y sucursal sede. |
| **CU_ADM_05** | Configurar QR Oficial de Cobro | Administrador | Carga/reemplazo de imagen de QR corporativo y datos de cuenta bancaria (Anti-fraude). |
| **CU_ADM_06** | Actualizar Datos de Empresa | Administrador | Parámetros comerciales (Logo, Nombre, Teléfono central). |
| **CU_ADM_07** | Gestionar Sucursales | Administrador | Registro de nuevas tiendas físicas y datos de localización. |
| **CU_ADM_08** | Consultar Reporte de Rentabilidad Neta | Administrador | Cálculo dinámico: `Ingresos - Costos Históricos = Ganancia Neta` por período y sucursal. |
| **CU_ADM_09** | Consultar Ventas por Método de Pago | Administrador | Desglose consolidado: Total recaudado en Efectivo vs Total recaudado en QR Oficial. |
| **CU_ADM_10** | Consultar Reporte de Gastos Operativos | Administrador | Consolidación de egresos clasificados por categoría. |
| **CU_ADM_11** | Auditoría y Trazabilidad por IMEI | Administrador | Hoja de vida del equipo: fecha de ingreso, proveedor, traspasos, venta, cliente y ganancia. |
| **CU_ADM_12** | Exportar Reportes | Administrador | Descarga de datos en formatos tabulares (Excel / PDF). |
