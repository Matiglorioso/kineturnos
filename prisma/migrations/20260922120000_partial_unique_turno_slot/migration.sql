-- El unique total bloqueaba reagendar un horario cuyo turno fue cancelado/ausente.
-- Solo los estados que ocupan agenda (pendiente/confirmado/atendido) deben ser únicos por slot.
DROP INDEX IF EXISTS "turno_profesional_slot";

CREATE UNIQUE INDEX "turno_profesional_slot_activo"
  ON "turnos" ("profesional_id", "fecha", "hora")
  WHERE "estado" NOT IN ('cancelado', 'ausente');
