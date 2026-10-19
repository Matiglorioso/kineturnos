-- Obras sociales (RF07, RF14, RF15): catálogo, datos de afiliado del paciente y
-- autorizaciones con cantidad de sesiones y vencimiento; cada turno atendido
-- queda vinculado a la autorización que consumió.
-- CreateEnum
CREATE TYPE "estado_autorizacion" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- AlterTable
ALTER TABLE "pacientes" ADD COLUMN     "nro_afiliado" TEXT,
ADD COLUMN     "obra_social_id" TEXT,
ADD COLUMN     "plan_obra_social" TEXT;

-- AlterTable
ALTER TABLE "turnos" ADD COLUMN     "autorizacion_id" TEXT;

-- CreateTable
CREATE TABLE "obras_sociales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,

    CONSTRAINT "obras_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autorizaciones" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "obra_social_id" TEXT NOT NULL,
    "numero" TEXT,
    "estado" "estado_autorizacion" NOT NULL DEFAULT 'pendiente',
    "sesiones" INTEGER NOT NULL,
    "fecha_desde" DATE NOT NULL,
    "vencimiento" DATE,
    "observaciones" TEXT,
    "creado_por_nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "obras_sociales_nombre_normalizado_key" ON "obras_sociales"("nombre_normalizado");

-- CreateIndex
CREATE INDEX "autorizaciones_paciente_id_idx" ON "autorizaciones"("paciente_id");

-- CreateIndex
CREATE INDEX "autorizaciones_obra_social_id_idx" ON "autorizaciones"("obra_social_id");

-- CreateIndex
CREATE INDEX "pacientes_obra_social_id_idx" ON "pacientes"("obra_social_id");

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_obra_social_id_fkey" FOREIGN KEY ("obra_social_id") REFERENCES "obras_sociales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_autorizacion_id_fkey" FOREIGN KEY ("autorizacion_id") REFERENCES "autorizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorizaciones" ADD CONSTRAINT "autorizaciones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorizaciones" ADD CONSTRAINT "autorizaciones_obra_social_id_fkey" FOREIGN KEY ("obra_social_id") REFERENCES "obras_sociales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Datos: el catálogo arranca con las obras sociales que ya tienen escritas los
-- pacientes (sin "Particular"), y cada paciente queda vinculado a la suya.
-- El nombre se normaliza (minúsculas, sin espacios repetidos) para no duplicar.
INSERT INTO "obras_sociales" ("id", "nombre", "nombre_normalizado")
SELECT 'os-' || md5(n.norm), n.nombre, n.norm
FROM (
  SELECT DISTINCT ON (lower(regexp_replace(btrim("obra_social"), '\s+', ' ', 'g')))
    lower(regexp_replace(btrim("obra_social"), '\s+', ' ', 'g')) AS norm,
    regexp_replace(btrim("obra_social"), '\s+', ' ', 'g') AS nombre
  FROM "pacientes"
  WHERE btrim("obra_social") <> '' AND lower(btrim("obra_social")) <> 'particular'
  ORDER BY 1, 2
) n
ON CONFLICT ("nombre_normalizado") DO NOTHING;

UPDATE "pacientes" p
SET "obra_social_id" = os."id", "obra_social" = os."nombre"
FROM "obras_sociales" os
WHERE os."nombre_normalizado" = lower(regexp_replace(btrim(p."obra_social"), '\s+', ' ', 'g'));

UPDATE "pacientes" SET "obra_social" = 'Particular' WHERE "obra_social_id" IS NULL;
