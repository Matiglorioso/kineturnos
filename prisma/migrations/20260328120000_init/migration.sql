-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_paciente" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "estado_turno" AS ENUM ('pendiente', 'confirmado', 'atendido', 'cancelado', 'ausente');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('admin', 'recepcion', 'profesional');

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_pila" TEXT,
    "apellido" TEXT,
    "dni" TEXT NOT NULL,
    "dni_normalizado" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "obra_social" TEXT NOT NULL DEFAULT 'Particular',
    "email" TEXT,
    "observaciones" TEXT,
    "estado" "estado_paciente" NOT NULL DEFAULT 'activo',
    "ultimo_turno" TEXT,
    "fecha_alta" TEXT,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesionales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_pila" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "matricula" TEXT,
    "matricula_normalizada" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "especialidad" TEXT NOT NULL,
    "dias_atencion" TEXT[],
    "horario_inicio" TEXT NOT NULL,
    "horario_fin" TEXT NOT NULL,
    "duracion_default" INTEGER NOT NULL DEFAULT 45,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "color_avatar" TEXT NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "profesionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL DEFAULT 'recepcion',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "profesional_id" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profesional_id" TEXT NOT NULL,
    "paciente_nombre" TEXT NOT NULL,
    "profesional_nombre" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "estado" "estado_turno" NOT NULL DEFAULT 'pendiente',
    "tipo_sesion" TEXT NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_dni_normalizado_key" ON "pacientes"("dni_normalizado");

-- CreateIndex
CREATE INDEX "pacientes_estado_idx" ON "pacientes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "profesionales_matricula_normalizada_key" ON "profesionales"("matricula_normalizada");

-- CreateIndex
CREATE INDEX "profesionales_activo_idx" ON "profesionales"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_profesional_id_key" ON "usuarios"("profesional_id");

-- CreateIndex
CREATE INDEX "turnos_fecha_idx" ON "turnos"("fecha");

-- CreateIndex
CREATE INDEX "turnos_estado_idx" ON "turnos"("estado");

-- CreateIndex
CREATE INDEX "turnos_profesional_id_fecha_idx" ON "turnos"("profesional_id", "fecha");

-- CreateIndex
CREATE INDEX "turnos_paciente_id_idx" ON "turnos"("paciente_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
