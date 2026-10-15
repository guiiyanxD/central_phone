# Design System - CentralPhone

<!-- impeccable:design-schema 1 -->

## Visual World & Identity Thesis: Pure Light Minimalist (Apple Precision)

La identidad visual de **CentralPhone** evoluciona hacia una estética **Modo Claro primario**, inspirada en los principios de diseño de hardware y software de Apple: limpieza radical, blancos puros, grises cálidos de precisión industrial, microinteracciones suaves y tipografía de legibilidad absoluta. 

Elimina cualquier artificio de "maqueta/demo" y se concibe como un software de producción bancario y de retail de alta gama: sobrio, silencioso, confiable y directo.

---

## 🎨 Paleta Cromática Oficial (Light Mode Primario)

### 1. Canvas y Superficies
* **Ground / Canvas Principal**: `#F8FAFC` (Slate 50 - Suave, libre de reflejos, reduce fatiga visual).
* **Superficies de Contenido (Cards / Modales)**: `#FFFFFF` (Blanco puro con sutil sombra `0 1px 3px 0 rgb(0 0 0 / 0.04)`).
* **Superficies Secundarias (Hover / Sub-bloques)**: `#F1F5F9` (Slate 100).
* **Bordes y Divisores de Precisión**: `#E2E8F0` (Slate 200 - Hairlines de 1px definidos, nítidos).

### 2. Jerarquía Tipográfica de Tinta (Ink)
* **Texto Primario**: `#0F172A` (Slate 900 - Contraste nítido para títulos y números críticos).
* **Texto Secundario**: `#475569` (Slate 600 - Descripciones y etiquetas de apoyo).
* **Texto Terciario / Metadatos**: `#64748B` (Slate 500 - IMEIs, números de serie, timestamps).
* **Placeholders**: `#94A3B8` (Slate 400).

### 3. Acentos Funcionales del Negocio
* **Brand Accent (Acciones Primarias)**: `#0F172A` / `#000000` (Monocromo Apple: botones principales negros con texto blanco).
* **Operación de Caja & Disponibilidad**: `#059669` (Esmeralda 600) con contenedor sutil `#ECFDF5` y borde `#A7F3D0`.
* **Cobro QR & Canales Digitales**: `#2563EB` (Azul 600) con contenedor `#EFF6FF` y borde `#BFDBFE`.
* **Alertas & Descuadres de Caja**: `#D97706` (Ámbar 600) con contenedor `#FFFBEB`.
* **Acciones Destructivas / Errores**: `#DC2626` (Rojo 600) con contenedor `#FEF2F2`.

---

## 🏛️ Arquitectura de la Vista de Bienvenida (Welcome Hub)

En lugar de lanzar al usuario abruptamente a un dashboard analítico o a un formulario de venta:
1. **Centro de Operaciones (Hub)**: Una pantalla de bienvenida despejada que orienta al usuario según la tarea que necesita realizar.
2. **Portales de Flujo (Accesos Directos Primarios)**:
   * **Punto de Venta (POS)**: Abrir terminal de mostrador, escanear IMEI y cobrar.
   * **Recepción de Mercadería**: Ingresar pedidos de proveedores (teléfonos y lotes de accesorios).
   * **Control de Inventario**: Consultar existencias, IMEIs y lotes por sucursal.
   * **Caja Diaria & Arqueo**: Apertura, registro de gastos y arqueo de turno.
3. **Indicador Sutil de Sucursal**:
   * No invasivo: Una cápsula minimalista integrada en el encabezado con punto de estado suave (`● Tienda Central`), transmitiendo contexto sin saturar.

---

## ⚡ Estándares de Microinteracciones y Estados de Carga

* **Botones**: Estado activo suave (`active:scale-[0.99]`), transición de opacidad y `Loader2` giratorio al ejecutar mutaciones, bloqueando clics concurrentes.
* **Skeletons**: Shimmer de fondo `#E2E8F0` que replica las dimensiones exactas de las tarjetas y tablas durante cargas reales.
* **Transiciones**: Suaves, de 150-200ms (`ease-out`), evitando saltos bruscos en el DOM.
