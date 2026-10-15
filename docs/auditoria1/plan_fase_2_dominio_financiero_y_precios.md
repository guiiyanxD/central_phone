# 💼 PLAN DE EJECUCIÓN — FASE 2: DOMINIO FINANCIERO, CONTROL DE PRECIOS Y TRAZABILIDAD DUAL DE IMEI

**Proyecto:** CentralPhone  
**Documento de Referencia:** [`docs/auditoria1/auditoria_tecnica_integral_centralphone.md`](./auditoria_tecnica_integral_centralphone.md)  
**Nivel de Prioridad:** Alto (P1) — Integridad Financiera y Confidencialidad  
**Estimación Total:** 12 horas de desarrollo  

---

## 1. 🎯 Objetivos de la Fase

1. **Estandarización de Precios de Venta en Teléfonos:** Incorporar la columna `precioVentaSugeridoBs` en el modelo `Dispositivo` de la base de datos, asignado desde la recepción de mercadería y eliminando la fórmula arbitraria del frontend (`costo * 1.15`).
2. **Confidencialidad de Costos Mayoristas (RBAC Financiero):** Censurar los campos sensibles `costoBs` y `costoUsd` en las consultas de catálogo/dispositivos cuando el usuario tenga rol `VENDEDOR`.
3. **Piso Mínimo y Control de Descuentos en Mostrador (POS):** Impedir que el vendedor reduzca el precio unitario de teléfonos o accesorios por debajo del costo o de un margen mínimo de seguridad sin clave/autorización de `ADMIN`.
4. **Verificación Cruzada Rigurosa de IMEIs Duales:** Blindar la recepción de mercadería para verificar que ni `imei1` ni `imei2` existan previamente en ninguna de las dos columnas de la base de datos.
5. **Precisión Aritmética en Cálculos de Caja y Ventas:** Implementar redondeo financiero estricto a 2 decimales para evitar desfasajes por precisión de punto flotante en JavaScript.

---

## 2. 📋 Criterios de Éxito y Definition of Done (DoD)

* [ ] El esquema de Prisma incluye `precioVentaSugeridoBs Decimal @default(0.00) @map("precio_venta_sugerido_bs") @db.Decimal(10, 2)` en `Dispositivo`.
* [ ] Migración de Prisma (`add-precio-sugerido-dispositivo`) aplicada y probada en PostgreSQL.
* [ ] La pantalla de recepción de mercadería ([`recepcion/page.tsx`](../../frontend/src/app/recepcion/page.tsx)) permite capturar tanto el costo de adquisición como el precio de venta sugerido al público de cada teléfono.
* [ ] La API de inventario para el mostrador (`GET /modelos/dispositivos`) omite `costoBs` y `costoUsd` para usuarios con rol `VENDEDOR`.
* [ ] El terminal de venta ([`pos/page.tsx`](../../frontend/src/app/pos/page.tsx)) toma el precio de venta sugerido oficial sin exponer costos de adquisición.
* [ ] Si un vendedor intenta ingresar un precio de venta inferior al 95% del precio sugerido, el sistema bloquea el cobro o solicita código de autorización del Administrador.
* [ ] La recepción rechaza cualquier teléfono cuyo `imei1` coincida con un `imei2` existente en el historial o viceversa.
* [ ] Todas las operaciones monetarias en backend redondean mediante helper seguro de centavos.

---

## 3. 📂 Archivos Involucrados

| Archivo | Ruta | Acción |
| :--- | :--- | :--- |
| **Prisma Schema** | `backend/prisma/schema.prisma` | Modificar (añadir `precioVentaSugeridoBs`). |
| **DTO Recepción Teléfono** | `backend/src/recepcion/dto/linea-dispositivo.dto.ts` | Modificar (añadir campo `precioVentaSugeridoBs`). |
| **Servicio Recepción** | `backend/src/recepcion/recepcion.service.ts` | Modificar (guardar precio sugerido y chequeo dual `OR`). |
| **Servicio Modelos/Stock**| `backend/src/modelos/modelos.service.ts` | Modificar (sanitizar costos según rol del usuario). |
| **Controlador Modelos** | `backend/src/modelos/modelos.controller.ts` | Modificar (inyectar usuario para evaluación de rol). |
| **Servicio Ventas** | `backend/src/ventas/ventas.service.ts` | Modificar (validar piso mínimo y precisión decimal). |
| **Formulario Recepción**| `frontend/src/app/recepcion/page.tsx` | Modificar (añadir columna de Precio Venta Sugerido). |
| **Terminal POS** | `frontend/src/app/pos/page.tsx` | Modificar (usar precio sugerido y validar piso mínimo). |

---

## 4. 🛠️ Paso a Paso Detallado de Implementación

### Paso 1: Modificación del Esquema Prisma y Migración
1. En `backend/prisma/schema.prisma`, actualizar el modelo `Dispositivo`:
   ```prisma
   model Dispositivo {
     id                    Int                  @id @default(autoincrement())
     varianteId            Int                  @map("variante_id")
     sucursalId            Int                  @map("sucursal_id")
     notaIngresoId         Int                  @map("nota_ingreso_id")
     numeroSerie           String               @unique @map("numero_serie") @db.VarChar(50)
     imei1                 String               @unique @map("imei_1") @db.VarChar(20)
     imei2                 String?              @unique @map("imei_2") @db.VarChar(20)
     condicion             CondicionDispositivo @default(NUEVO)
     costoBs               Decimal              @map("costo_bs") @db.Decimal(10, 2)
     costoUsd              Decimal              @map("costo_usd") @db.Decimal(10, 2)
     precioVentaSugeridoBs Decimal              @default(0.00) @map("precio_venta_sugerido_bs") @db.Decimal(10, 2)
     estadoInventario      EstadoInventario     @default(DISPONIBLE) @map("estado_inventario")

     // Relaciones...
     @@map("dispositivos")
   }
   ```
2. Ejecutar la migración:
   ```bash
   npx prisma migrate dev --name add-precio-sugerido-dispositivo
   npx prisma generate
   ```

### Paso 2: Actualización de DTO y Lógica de Recepción de Mercadería
1. En `backend/src/recepcion/dto/linea-dispositivo.dto.ts`, añadir:
   ```typescript
   @IsNotEmpty({ message: 'El precio de venta sugerido es obligatorio.' })
   @IsNumber({}, { message: 'El precio de venta sugerido debe ser numérico.' })
   @Min(0, { message: 'El precio no puede ser negativo.' })
   precioVentaSugeridoBs: number;
   ```
2. En `backend/src/recepcion/recepcion.service.ts`:
   * **Verificación cruzada de IMEI dual (Corrección del Defecto 4):**
     ```typescript
     for (const d of dispositivos) {
       const imei1Clean = d.imei1.trim();
       const imei1Existente = await tx.dispositivo.findFirst({
         where: {
           OR: [{ imei1: imei1Clean }, { imei2: imei1Clean }],
         },
       });
       if (imei1Existente) {
         throw new ConflictException(`El IMEI 1 '${imei1Clean}' ya se encuentra registrado en el sistema.`);
       }

       if (d.imei2 && d.imei2.trim().length > 0) {
         const imei2Clean = d.imei2.trim();
         const imei2Existente = await tx.dispositivo.findFirst({
           where: {
             OR: [{ imei1: imei2Clean }, { imei2: imei2Clean }],
           },
         });
         if (imei2Existente) {
           throw new ConflictException(`El IMEI 2 '${imei2Clean}' ya se encuentra registrado en el sistema.`);
         }
       }
     }
     ```
   * Guardar `precioVentaSugeridoBs` en la creación de cada dispositivo en `tx.dispositivo.create()`.

### Paso 3: Confidencialidad de Costos en Inventario y POS
1. Modificar `backend/src/modelos/modelos.service.ts`:
   * Recibir el rol del usuario (`userRole: RolUsuario`) en `findDispositivos()`.
   * Si `userRole !== RolUsuario.ADMIN`, transformar la lista de dispositivos para omitir `costoBs` y `costoUsd`:
     ```typescript
     return dispositivos.map((disp) => {
       if (userRole !== 'ADMIN') {
         const { costoBs, costoUsd, ...safeData } = disp;
         return safeData;
       }
       return disp;
     });
     ```
2. Modificar `backend/src/modelos/modelos.controller.ts`:
   * Inyectar `@CurrentUser() user: any` en el endpoint `GET modelos/dispositivos` y pasarlo al servicio.

### Paso 4: Ajustes en Interfaz de Recepción (`frontend/src/app/recepcion/page.tsx`)
1. Actualizar la interfaz `TelefonoRow` para incluir `precioVentaSugeridoBs: number`.
2. En la tabla de teléfonos, agregar una columna editable para "Precio Venta Sugerido (Bs)".
3. Sugerir automáticamente al tipear el costo: `precioVentaSugeridoBs = Math.round(costoBs * 1.15)`.
4. Incluir `precioVentaSugeridoBs` en el payload enviado a `api.recepcion.create()`.

### Paso 5: Control de Precios y Piso Mínimo en POS (`frontend/src/app/pos/page.tsx`)
1. Al agregar un teléfono al carrito (`handleAddPhoneToCart`):
   ```typescript
   // ANTES (erróneo y arbitrario):
   // const precioSugerido = Math.round(Number(disp.costoBs) * 1.15);

   // DESPUÉS (oficial):
   const precioOficial = Number(disp.precioVentaSugeridoBs) || 0;
   ```
2. Al intentar modificar el precio en el carrito (`handleUpdatePrice`):
   * Validar que el precio no sea inferior al 90% del precio sugerido.
   * Si es inferior, mostrar advertencia visual: *"El precio ingresado está por debajo del margen mínimo autorizado para vendedores."*
3. En el backend (`VentasService.createVenta`), verificar que `item.precioVentaBs >= Number(disp.costoBs)` para impedir ventas por debajo del costo real (dumping no autorizado).

### Paso 6: Helper de Aritmética Financiera Segura
Crear un archivo utilitario `backend/src/common/utils/money.util.ts`:
```typescript
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
```
Aplicar `roundMoney` en `totalVentaBs`, subtotales y balances de caja.

---

## 5. 🧪 Plan de Verificación y Testing

1. **Prueba de Migración y Esquema:**
   * Ejecutar `npx prisma studio` y confirmar la presencia de `precio_venta_sugerido_bs`.
2. **Prueba de Recepción con Validación Dual de IMEI:**
   * Registrar un teléfono con `imei1: "351234567890123"` e `imei2: "359876543210987"`.
   * En una segunda recepción, intentar registrar otro equipo con `imei1: "359876543210987"`.
   * **Resultado esperado:** Bloqueo con mensaje de error: *"El IMEI 1 '359876543210987' ya se encuentra registrado en el sistema."*
3. **Prueba de Confidencialidad de Costos:**
   * Conectar con token de vendedor a `GET /api/v1/modelos/dispositivos`.
   * Verificar en el JSON de respuesta que las propiedades `costoBs` y `costoUsd` **no existen**.
4. **Prueba de Venta con Precio Sugerido en POS:**
   * Ingresar al POS como vendedor, agregar el equipo creado.
   * Verificar que el precio inicial cargado sea idéntico al registrado en la recepción.
   * Intentar tipear un precio de Bs 50 y verificar que el sistema rechace la venta.
