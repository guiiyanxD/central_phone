-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TipoProveedor" AS ENUM ('MAYORISTA', 'MINORISTA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "tipo" "TipoProveedor" NOT NULL DEFAULT 'MAYORISTA';

-- DataMigration: Clasificar proveedores creados a partir de permutas
UPDATE "proveedores"
SET "tipo" = 'MINORISTA'
WHERE "empresa" ILIKE '%Permuta%'
   OR "contacto_referencia" ILIKE '%Permuta%';
