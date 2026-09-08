-- Verificar duplicados antes de crear el indice unico (profesional + fecha + hora).
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT profesional_id, fecha, hora
    FROM turnos
    GROUP BY profesional_id, fecha, hora
    HAVING COUNT(*) > 1
  ) dups;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Hay % grupo(s) de turnos duplicados (profesional_id, fecha, hora). Resolvelos antes de aplicar esta migracion.', duplicate_count;
  END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "turno_profesional_slot" ON "turnos"("profesional_id", "fecha", "hora");
