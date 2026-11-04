-- AlterTable
ALTER TABLE "ventas" ADD COLUMN "monto_permuta_bs" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "monto_efectivo_bs" DECIMAL(10,2),
ADD COLUMN "monto_digital_bs" DECIMAL(10,2),
ADD COLUMN "permuta_dispositivo_id" INTEGER,
ADD COLUMN "permuta_nota_ingreso_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ventas_permuta_dispositivo_id_key" ON "ventas"("permuta_dispositivo_id");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_permuta_dispositivo_id_fkey" FOREIGN KEY ("permuta_dispositivo_id") REFERENCES "dispositivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_permuta_nota_ingreso_id_fkey" FOREIGN KEY ("permuta_nota_ingreso_id") REFERENCES "notas_ingreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
