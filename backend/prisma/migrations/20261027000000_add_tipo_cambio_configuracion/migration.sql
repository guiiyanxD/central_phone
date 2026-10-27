-- AlterTable configuracion_negocio
ALTER TABLE "configuracion_negocio" ADD COLUMN IF NOT EXISTS "tc_oficial" DECIMAL(10,2) NOT NULL DEFAULT 6.96;
ALTER TABLE "configuracion_negocio" ADD COLUMN IF NOT EXISTS "tc_paralelo" DECIMAL(10,2) NOT NULL DEFAULT 6.96;
ALTER TABLE "configuracion_negocio" ADD COLUMN IF NOT EXISTS "tc_actualizado_en" TIMESTAMP(3);
