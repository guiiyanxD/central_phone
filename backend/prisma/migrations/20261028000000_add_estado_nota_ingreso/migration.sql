-- AlterTable notas_ingreso
ALTER TABLE "notas_ingreso" ADD COLUMN IF NOT EXISTS "estado" VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA';
ALTER TABLE "notas_ingreso" ADD COLUMN IF NOT EXISTS "anulada_en" TIMESTAMP(3);
ALTER TABLE "notas_ingreso" ADD COLUMN IF NOT EXISTS "motivo_anulacion" TEXT;
