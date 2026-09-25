-- Notificaciones por correo al paciente (RF05): creación, confirmación,
-- reprogramación, cancelación y recordatorio 24 h antes.
CREATE TYPE "tipo_notificacion" AS ENUM ('creacion', 'confirmacion', 'reprogramacion', 'cancelacion', 'recordatorio');

CREATE TYPE "estado_notificacion" AS ENUM ('pendiente', 'enviando', 'enviada', 'fallida', 'omitida');

CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "tipo" "tipo_notificacion" NOT NULL,
    "estado" "estado_notificacion" NOT NULL DEFAULT 'pendiente',
    "destinatario" TEXT,
    "datos" JSONB NOT NULL,
    "clave" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviada_en" TIMESTAMPTZ(6),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notificaciones_clave_key" ON "notificaciones"("clave");
CREATE INDEX "notificaciones_turno_id_idx" ON "notificaciones"("turno_id");
CREATE INDEX "notificaciones_estado_idx" ON "notificaciones"("estado");

ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
