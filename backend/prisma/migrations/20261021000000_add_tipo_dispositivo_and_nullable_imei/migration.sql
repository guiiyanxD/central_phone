-- CreateEnum
CREATE TYPE "TipoDispositivo" AS ENUM ('IPHONE', 'IPAD', 'MAC', 'WATCH', 'AIRPODS', 'OTRO');

-- AlterTable
ALTER TABLE "modelos_dispositivo" ADD COLUMN "tipo" "TipoDispositivo" NOT NULL DEFAULT 'IPHONE';

-- AlterTable
ALTER TABLE "dispositivos" ALTER COLUMN "imei_1" DROP NOT NULL;
