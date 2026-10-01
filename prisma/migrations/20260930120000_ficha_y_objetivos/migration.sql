-- Ficha clínica (alertas y antecedentes) y objetivos del tratamiento.
-- CreateTable
CREATE TABLE "fichas_clinicas" (
    "paciente_id" TEXT NOT NULL,
    "alertas" TEXT,
    "antecedentes" TEXT,
    "actualizado_por_nombre" TEXT NOT NULL,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichas_clinicas_pkey" PRIMARY KEY ("paciente_id")
);

-- CreateTable
CREATE TABLE "objetivos_tratamiento" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cumplido" BOOLEAN NOT NULL DEFAULT false,
    "cumplido_en" TIMESTAMPTZ(6),
    "creado_por_nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivos_tratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objetivos_tratamiento_paciente_id_idx" ON "objetivos_tratamiento"("paciente_id");

-- AddForeignKey
ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "fichas_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos_tratamiento" ADD CONSTRAINT "objetivos_tratamiento_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

