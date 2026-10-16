-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA', 'ANULADA');

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA';
ALTER TABLE "ventas" ADD COLUMN "motivo_anulacion" TEXT;
ALTER TABLE "ventas" ADD COLUMN "anulado_por_usuario_id" INTEGER;
ALTER TABLE "ventas" ADD COLUMN "fecha_anulacion" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_anulado_por_usuario_id_fkey" FOREIGN KEY ("anulado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
