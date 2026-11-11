-- CreateEnum
CREATE TYPE "CategoriaMargen" AS ENUM ('DISPOSITIVO_NUEVO', 'DISPOSITIVO_USADO', 'ACCESORIO', 'PERMUTA');

-- CreateEnum
CREATE TYPE "TipoAumentoMargen" AS ENUM ('PORCENTAJE', 'ABSOLUTO');

-- CreateTable
CREATE TABLE "reglas_margen_precio" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaMargen" NOT NULL,
    "tipo_aumento" "TipoAumentoMargen" NOT NULL DEFAULT 'PORCENTAJE',
    "valor_bs" DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    "tipo_aumento_usd" "TipoAumentoMargen" NOT NULL DEFAULT 'PORCENTAJE',
    "valor_usd" DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglas_margen_precio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reglas_margen_precio_categoria_key" ON "reglas_margen_precio"("categoria");

-- Insert initial default rules
INSERT INTO "reglas_margen_precio" ("categoria", "tipo_aumento", "valor_bs", "tipo_aumento_usd", "valor_usd", "actualizado_en")
VALUES 
  ('DISPOSITIVO_NUEVO', 'PORCENTAJE', 15.00, 'PORCENTAJE', 15.00, CURRENT_TIMESTAMP),
  ('DISPOSITIVO_USADO', 'PORCENTAJE', 15.00, 'PORCENTAJE', 15.00, CURRENT_TIMESTAMP),
  ('ACCESORIO', 'PORCENTAJE', 15.00, 'PORCENTAJE', 15.00, CURRENT_TIMESTAMP),
  ('PERMUTA', 'PORCENTAJE', 15.00, 'PORCENTAJE', 15.00, CURRENT_TIMESTAMP)
ON CONFLICT ("categoria") DO NOTHING;
