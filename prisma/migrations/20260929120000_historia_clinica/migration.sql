-- Historia clínica digital (RF11-RF13): un registro por sesión, y trazabilidad
-- de quién y cuándo lee o modifica la información clínica (RNF07).
-- CreateEnum
CREATE TYPE "accion_historia_clinica" AS ENUM ('lectura', 'alta', 'edicion');

-- CreateTable
CREATE TABLE "historia_clinica" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profesional_id" TEXT,
    "profesional_nombre" TEXT,
    "turno_id" TEXT,
    "autor_id" TEXT NOT NULL,
    "autor_nombre" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "evolucion" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historia_clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accesos_historia_clinica" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "registro_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "usuario_nombre" TEXT NOT NULL,
    "usuario_rol" TEXT NOT NULL,
    "accion" "accion_historia_clinica" NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accesos_historia_clinica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "historia_clinica_turno_id_key" ON "historia_clinica"("turno_id");

-- CreateIndex
CREATE INDEX "historia_clinica_paciente_id_fecha_idx" ON "historia_clinica"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "accesos_historia_clinica_paciente_id_fecha_idx" ON "accesos_historia_clinica"("paciente_id", "fecha");

-- AddForeignKey
ALTER TABLE "historia_clinica" ADD CONSTRAINT "historia_clinica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historia_clinica" ADD CONSTRAINT "historia_clinica_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historia_clinica" ADD CONSTRAINT "historia_clinica_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos_historia_clinica" ADD CONSTRAINT "accesos_historia_clinica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

