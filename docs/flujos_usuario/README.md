# Flujos de Usuario y Procesos de Negocio - CentralPhone

Este directorio contiene la representación gráfica y formal de los **4 Flujos Operativos Maestros (End-to-End User Journeys)** del sistema en formato PlantUML (`.puml`).

---

## 🗺️ Índice de Flujos de Proceso

### 1. 🛒 [Flujo de Venta en Punto de Venta (POS)](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/flujos_usuario/flujo_venta_pos.puml)
* **Carriles**: `Cliente`, `Vendedor`, `Sistema POS`.
* **Proceso**:
  * Control previo de caja abierta obligatoria.
  * Agregado dinámico de teléfonos (escaneo/búsqueda por IMEI 'DISPONIBLE') o accesorios (selección por nombre diferenciador y precio de lote).
  * Captura de cliente para garantía/WhatsApp.
  * Bifurcación de cobro: **Efectivo** (con cálculo de cambio) vs. **QR Oficial Centralizado** (proyección en pantalla inalterable + captura de número de referencia bancaria).
  * Transacción atómica ACID: deducción de existencias, marcado de IMEI como 'VENDIDO', ingreso a caja y emisión de ticket.

### 2. 📦 [Flujo de Recepción Unificada de Mercadería](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/flujos_usuario/flujo_recepcion_mercaderia.puml)
* **Carriles**: `Proveedor`, `Vendedor / Admin`, `Sistema de Inventario`.
* **Proceso**:
  * Entrada conjunta de teléfonos y lotes de accesorios desde una sola entrega.
  * Soporte de **Creación In-Line ("Al Vuelo")** de variantes si no existían previamente en el catálogo para no demorar al proveedor.
  * Validación estricta de unicidad de IMEI 1, IMEI 2 y Serie para evitar duplicados en la base de datos.
  * Creación de lotes de accesorios con su respectivo precio de venta sugerido y costo unitario.

### 3. 💵 [Flujo del Ciclo de Caja Diaria y Arqueo](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/flujos_usuario/flujo_caja_diaria.puml)
* **Carriles**: `Vendedor`, `Sistema de Caja`, `Administrador`.
* **Proceso**:
  * **Apertura**: Conteo y registro del fondo inicial de cambio en efectivo.
  * **Operación**: Registro concurrente de ventas y egresos menores clasificados (chips, refrigerio/tomicha, transporte) con validación de saldo disponible.
  * **Cierre & Arqueo**: Conteo físico a ciegas, cálculo automático de saldos teóricos (efectivo y total QR), detección de faltante o sobrante con justificación obligatoria y auditoría administrativa.

### 4. 🔄 [Flujo de Anulación de Venta y Garantías](file:///C:/Users/USUARIO/Desktop/proyectos_personales/julieth/central_iphone/docs/flujos_usuario/flujo_anulacion_garantia.puml)
* **Carriles**: `Cliente`, `Vendedor`, `Administrador`, `Sistema CentralPhone`.
* **Proceso**:
  * **Anulación por error**: Autorización de Administrador, reversa atómica de la venta (IMEI regresa a 'DISPONIBLE', lote de accesorio repone existencias y dinero se reversa de la caja activa).
  * **Atención de Garantía Técnica**: Búsqueda por IMEI en el historial de tienda, validación de vigencia de garantía y emisión de orden de servicio técnico en estado 'EN_GARANTIA'.
