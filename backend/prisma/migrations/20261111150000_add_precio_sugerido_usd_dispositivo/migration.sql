-- AlterTable: Agregar precio_venta_sugerido_usd a dispositivos
ALTER TABLE "dispositivos" ADD COLUMN IF NOT EXISTS "precio_venta_sugerido_usd" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
