-- Migration: Add Módulo de Permutas y Gastos de Dispositivo
-- AlterEnum
ALTER TYPE "CondicionDispositivo" ADD VALUE IF NOT EXISTS 'PERMUTA';

-- AlterTable notas_ingreso
ALTER TABLE "notas_ingreso" ADD COLUMN IF NOT EXISTS "tipo_ingreso" VARCHAR(20) NOT NULL DEFAULT 'MAYORISTA';

-- AlterTable dispositivos
ALTER TABLE "dispositivos" ADD COLUMN IF NOT EXISTS "porcentaje_bateria" INTEGER;

-- CreateTable gastos_dispositivos
CREATE TABLE IF NOT EXISTS "gastos_dispositivos" (
    "id" SERIAL NOT NULL,
    "dispositivo_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "caja_id" INTEGER,
    "concepto" VARCHAR(150) NOT NULL,
    "costo_bs" DECIMAL(10,2) NOT NULL,
    "observacion" TEXT,
    "aplico_en_caja" BOOLEAN NOT NULL DEFAULT false,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "anulado_en" TIMESTAMP(3),
    "anulado_por_id" INTEGER,
    "motivo_anulacion" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_dispositivos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gastos_dispositivos_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_dispositivos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "gastos_dispositivos_anulado_por_id_fkey" FOREIGN KEY ("anulado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "gastos_dispositivos_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas_diarias"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
