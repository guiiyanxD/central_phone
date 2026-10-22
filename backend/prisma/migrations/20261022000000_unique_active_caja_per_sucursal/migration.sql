-- CreateIndex
-- Regla Inmutable: Máximo una caja ABIERTA por sucursal simultáneamente (Protección ACID contra carreras)
CREATE UNIQUE INDEX "idx_cajas_diarias_unica_abierta_sucursal" ON "cajas_diarias" ("sucursal_id") WHERE "estado" = 'ABIERTA';
