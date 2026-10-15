-- AlterTable: Agregar precio_venta_sugerido_bs a dispositivos
ALTER TABLE "dispositivos" ADD COLUMN IF NOT EXISTS "precio_venta_sugerido_bs" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
