-- AlterTable: Adicionar columna fecha_gasto a gastos_dispositivos
ALTER TABLE "gastos_dispositivos" ADD COLUMN IF NOT EXISTS "fecha_gasto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Sincronizar fecha_gasto con fecha_registro para registros existentes
UPDATE "gastos_dispositivos" SET "fecha_gasto" = "fecha_registro" WHERE "fecha_gasto" IS NULL;
