-- 1. CreateTable tipos_dispositivo
CREATE TABLE "tipos_dispositivo" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_dispositivo_pkey" PRIMARY KEY ("id")
);

-- 2. CreateIndex unique nombre
CREATE UNIQUE INDEX "tipos_dispositivo_nombre_key" ON "tipos_dispositivo"("nombre");

-- 3. Seed initial 6 types
INSERT INTO "tipos_dispositivo" ("nombre", "descripcion") VALUES
    ('IPHONE', 'Teléfonos inteligentes Apple iPhone'),
    ('IPAD', 'Tablets Apple iPad'),
    ('MAC', 'Computadoras portátiles y de escritorio Apple Mac'),
    ('WATCH', 'Relojes inteligentes Apple Watch'),
    ('AIRPODS', 'Auriculares y audio inalámbrico Apple AirPods'),
    ('OTRO', 'Otros dispositivos y periféricos Apple')
ON CONFLICT ("nombre") DO NOTHING;

-- 4. Convert tipo in modelos_dispositivo from enum to VARCHAR(50)
ALTER TABLE "modelos_dispositivo" ALTER COLUMN "tipo" TYPE VARCHAR(50) USING "tipo"::text;
ALTER TABLE "modelos_dispositivo" ALTER COLUMN "tipo" SET DEFAULT 'IPHONE';

-- 5. Add column tipo_id to modelos_dispositivo
ALTER TABLE "modelos_dispositivo" ADD COLUMN "tipo_id" INTEGER;

-- 6. Link existing modelos to tipos_dispositivo based on tipo string
UPDATE "modelos_dispositivo" m
SET "tipo_id" = t.id
FROM "tipos_dispositivo" t
WHERE m."tipo" = t."nombre";

-- 7. Add foreign key constraint
ALTER TABLE "modelos_dispositivo" ADD CONSTRAINT "modelos_dispositivo_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos_dispositivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Drop old enum type safely
DROP TYPE IF EXISTS "TipoDispositivo";
