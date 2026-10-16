# 📈 PLAN DE EJECUCIÓN — FASE 4: COMPLETITUD DEL BACKLOG (ÉPICA 5)
## Auditoría por IMEI, Anulación Atómica de Ventas y Reportes Financieros de Rentabilidad

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md) y [`docs/backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md)  
**Nivel de Prioridad:** Medio-Alto (P2) — Cierre Funcional del Producto  
**Estimación Total:** 20 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Implementar US19 (Anulación de Venta con Rollback Atómico):** Permitir exclusivamente al rol `ADMIN` anular transacciones erróneas, revirtiendo el estado de los teléfonos a `DISPONIBLE`, restituyendo el inventario a los lotes de accesorios y ajustando los saldos teóricos de caja dentro de una transacción ACID.
2. **Implementar US18 (Línea de Vida y Trazabilidad Completa por IMEI):** Construir una vista cronológica e inspección detallada de cualquier dispositivo desde su recepción mayorista (proveedor, costo, fecha), pasando por su estancia en stock y venta final (cliente, ticket, precio), hasta su estado de garantía.
3. **Implementar US17 (Reporte de Rentabilidad Neta Consolidada):** Desarrollar un módulo administrativo y dashboard financiero que calcule la rentabilidad real del negocio: `Ingresos - Costo Histórico de Mercadería (CMV) - Gastos Operativos`, desglosado por sucursal y rango de fechas.

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [x] Esquema Prisma actualizado con `enum EstadoVenta { COMPLETADA, ANULADA }`, campos `estado`, `motivoAnulacion` y `anuladoPorUsuarioId` en el modelo `Venta`.
* [x] Migración de Prisma (`add-estado-anulacion-venta`) aplicada exitosamente.
* [x] Endpoint `PATCH /api/v1/ventas/:id/anular` protegido estrictamente con `@UseGuards(RolesGuard)` y `@Roles(RolUsuario.ADMIN)`.
* [x] La anulación revierte atómicamente todos los ítems del ticket sin dejar registros huérfanos.
* [x] Endpoint `GET /api/v1/modelos/dispositivos/:imei/linea-vida` retorna la historia completa del equipo (proveedor, comprobante, venta, comprador y garantía).
* [x] En [`inventario/page.tsx`](../../frontend/src/app/inventario/page.tsx), un clic en cualquier IMEI abre un modal con su línea de vida interactiva.
* [x] Nueva ruta de frontend `/reportes` exclusiva para rol `ADMIN` con indicadores clave (Total Ventas, CMV, Ganancia Bruta, Gastos Operativos y Ganancia Neta).
* [x] Las ventas anuladas se excluyen automáticamente de los balances activos de caja y de la rentabilidad neta real.

---

## 3. 📂 Archivos Involucrados

| Archivo | Ruta | Acción |
| :--- | :--- | :--- |
| **Prisma Schema** | `backend/prisma/schema.prisma` | Modificar (añadir campos de anulación a `Venta`). |
| **DTO Anulación** | `backend/src/ventas/dto/anular-venta.dto.ts` | Crear (validación de motivo de anulación). |
| **Servicio Ventas** | `backend/src/ventas/ventas.service.ts` | Modificar (método `anularVenta` y métricas de rentabilidad). |
| **Controlador Ventas** | `backend/src/ventas/ventas.controller.ts` | Modificar (endpoints de anular y reporte financiero). |
| **Servicio Modelos** | `backend/src/modelos/modelos.service.ts` | Modificar (método de línea de vida por IMEI). |
| **Controlador Modelos**| `backend/src/modelos/modelos.controller.ts` | Modificar (endpoint de auditoría de IMEI). |
| **API Client** | `frontend/src/lib/api.ts` | Modificar (agregar métodos de anulación, reportes y línea de vida). |
| **Modal Línea de Vida**| `frontend/src/app/inventario/modal-linea-vida.tsx`| Crear (componente visual de cronología de IMEI). |
| **Página Reportes** | `frontend/src/app/reportes/page.tsx` | Crear (dashboard analítico de rentabilidad para Admin). |
| **Navbar UI** | `frontend/src/components/layout/navbar.tsx` | Modificar (añadir link "Reportes" visible solo para `ADMIN`). |

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Extensión del Modelo `Venta` en Prisma
1. En `backend/prisma/schema.prisma`:
   ```prisma
   enum EstadoVenta {
     COMPLETADA
     ANULADA
   }

   model Venta {
     id                    Int         @id @default(autoincrement())
     cajaId                Int         @map("caja_id")
     usuarioId             Int         @map("usuario_id")
     clienteId             Int?        @map("cliente_id")
     metodoPagoId          Int         @map("metodo_pago_id")
     fechaHora             DateTime    @default(now()) @map("fecha_hora")
     totalVentaBs          Decimal     @map("total_venta_bs") @db.Decimal(10, 2)
     comprobanteReferencia String?     @map("comprobante_referencia") @db.VarChar(100)
     comprobanteImagenUrl  String?     @map("comprobante_imagen_url") @db.VarChar(500)
     estado                EstadoVenta @default(COMPLETADA)
     motivoAnulacion       String?     @map("motivo_anulacion") @db.Text
     anuladoPorUsuarioId   Int?        @map("anulado_por_usuario_id")
     fechaAnulacion        DateTime?   @map("fecha_anulacion")

     anuladoPor            Usuario?    @relation("VentasAnuladas", fields: [anuladoPorUsuarioId], references: [id])
     // Resto de relaciones...
   }
   ```
2. Ejecutar migración:
   ```bash
   npx prisma migrate dev --name add-estado-anulacion-venta
   npx prisma generate
   ```

### Paso 2: Implementación de la Anulación Atómica (US19)
1. Crear DTO `backend/src/ventas/dto/anular-venta.dto.ts`:
   ```typescript
   import { IsNotEmpty, IsString, MinLength } from 'class-validator';

   export class AnularVentaDto {
     @IsNotEmpty({ message: 'El motivo de anulación es obligatorio.' })
     @IsString()
     @MinLength(10, { message: 'El motivo de anulación debe contener al menos 10 caracteres.' })
     motivo: string;
   }
   ```
2. En `backend/src/ventas/ventas.service.ts`:
   ```typescript
   async anularVenta(ventaId: number, adminUserId: number, dto: AnularVentaDto) {
     return this.prisma.$transaction(async (tx) => {
       const venta = await tx.venta.findUnique({
         where: { id: ventaId },
         include: { detalles: true, caja: true },
       });

       if (!venta) throw new NotFoundException(`La venta #${ventaId} no existe.`);
       if (venta.estado === 'ANULADA') throw new BadRequestException('Esta venta ya se encuentra anulada.');

       // 1. Revertir inventario de teléfonos
       for (const det of venta.detalles) {
         if (det.tipoItem === 'DISPOSITIVO' && det.dispositivoId) {
           await tx.dispositivo.update({
             where: { id: det.dispositivoId },
             data: { estadoInventario: 'DISPONIBLE' },
           });
         }

         // 2. Revertir stock de accesorios
         if (det.tipoItem === 'ACCESORIO' && det.loteAccesorioId) {
           await tx.loteAccesorio.update({
             where: { id: det.loteAccesorioId },
             data: { stockActual: { increment: det.cantidad } },
           });
         }
       }

       // 3. Marcar venta como ANULADA
       return tx.venta.update({
         where: { id: venta.id },
         data: {
           estado: 'ANULADA',
           motivoAnulacion: dto.motivo.trim(),
           anuladoPorUsuarioId: adminUserId,
           fechaAnulacion: new Date(),
         },
         include: { detalles: true, cliente: true, metodoPago: true },
       });
     });
   }
   ```
3. Exponer en `VentasController`:
   ```typescript
   @Patch(':id/anular')
   @UseGuards(RolesGuard)
   @Roles(RolUsuario.ADMIN)
   async anularVenta(
     @Param('id', ParseIntPipe) id: number,
     @CurrentUser('id') adminId: number,
     @Body() dto: AnularVentaDto,
   ) {
     return this.ventasService.anularVenta(id, adminId, dto);
   }
   ```

### Paso 3: Servicio de Auditoría y Línea de Vida de IMEI (US18)
En `backend/src/modelos/modelos.service.ts`, crear método `getLineaVidaImei(imei: string)`:
* Buscar dispositivo por `imei1` o `imei2`.
* Cargar relaciones:
  * `notaIngreso` $\to$ `proveedor`, `fechaIngreso`, `numeroComprobante`.
  * `sucursal`.
  * `detalleVentas` $\to$ `venta` $\to$ `cliente`, `usuario`, `metodoPago`.
* Retornar un objeto estructurado:
  ```typescript
  {
    dispositivo: { id, imei1, imei2, serie, modelo, color, capacidad, estadoActual },
    origen: { proveedor: prov.nombre, fechaIngreso, comprobante, costoBs, costoUsd },
    venta: venta ? { ticketId, fecha, vendedor: u.nombre, cliente: cli.nombreCompleto, telefono: cli.telefono, precioVentaBs, gananciaBs } : null,
    garantia: { estado: disp.estadoInventario, diasDesdeVenta: ... }
  }
  ```

### Paso 4: Servicio y Dashboard de Rentabilidad Neta (US17)
1. En `backend/src/ventas/ventas.service.ts`, crear `getReporteRentabilidad(fechaInicio, fechaFin, sucursalId)`:
   * Consultar todas las ventas `COMPLETADAS` en el período.
   * Calcular:
     * `totalIngresosBs = sum(venta.totalVentaBs)`
     * `totalCostoMercaderiaBs = sum(det.costoUnitarioBs * det.cantidad)`
     * `gananciaBrutaBs = totalIngresosBs - totalCostoMercaderiaBs`
   * Consultar todos los gastos operativos en el período y sumar:
     * `totalGastosOperativosBs = sum(gasto.montoBs)`
   * Calcular ganancia neta final:
     * `gananciaNetaRealBs = gananciaBrutaBs - totalGastosOperativosBs`
2. En `frontend/src/app/reportes/page.tsx`:
   * Crear tarjetas de métricas en estilo Apple Precision (Slate/Emerald/Amber).
   * Selector de rango de fechas (Hoy, Esta Semana, Este Mes, Rango Personalizado) y filtro por sucursal.
   * Tabla detallada de ventas con botón para **Anular Venta** (con confirmación modal exigiendo motivo de anulación).

---

## 5. 🧪 Plan de Verificación y Testing

1. **Prueba de Anulación de Venta (US19):**
   * Crear una venta en POS de 1 iPhone (IMEI `351111111111111`) y 2 fundas.
   * Verificar en inventario que el iPhone figure como `VENDIDO` y el stock de fundas haya bajado en 2.
   * Conectar como usuario `ADMIN` y ejecutar anulación indicando motivo: `"Error en método de cobro ingresado por vendedor"`.
   * Verificar que el iPhone regrese inmediatamente a estado `DISPONIBLE` y las fundas incrementen su stock en 2.
   * Intentar anular la misma venta por segunda vez y comprobar que el sistema la rechaza con `BadRequestException`.
2. **Prueba de Línea de Vida (US18):**
   * Consultar el IMEI de un teléfono vendido en `/inventario`.
   * Confirmar que el modal despliegue con exactitud: Proveedor de compra, fecha de ingreso, comprobante, vendedor que atendió y nombre del cliente.
3. **Prueba de Rentabilidad Neta (US17):**
   * Abrir `/reportes` con sesión de `ADMIN`.
   * Verificar que las ventas anuladas no sumen en ingresos ni en costos.
   * Confirmar la fórmula matemática: `Ganancia Neta = Ingresos - CMV - Gastos de Caja`.
