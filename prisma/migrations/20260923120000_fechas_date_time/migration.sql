-- Migra fechas/horas de TEXT (dd-MM-yyyy / HH:mm) a DATE / TIME.
-- Acepta también ISO yyyy-MM-dd (datos legados). '' se trata como NULL.
-- Si hay algún valor que no se pueda convertir, la migración aborta sin cambios.

DO $$
DECLARE
  bad_turnos INTEGER;
  bad_pacientes INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_turnos
  FROM turnos
  WHERE fecha !~ '^\d{2}-\d{2}-\d{4}$'
    AND fecha !~ '^\d{4}-\d{2}-\d{2}'
     OR hora !~ '^\d{2}:\d{2}(:\d{2})?$';

  SELECT COUNT(*) INTO bad_pacientes
  FROM pacientes
  WHERE (NULLIF(ultimo_turno, '') IS NOT NULL
         AND ultimo_turno !~ '^\d{2}-\d{2}-\d{4}$'
         AND ultimo_turno !~ '^\d{4}-\d{2}-\d{2}')
     OR (NULLIF(fecha_alta, '') IS NOT NULL
         AND fecha_alta !~ '^\d{2}-\d{2}-\d{4}$'
         AND fecha_alta !~ '^\d{4}-\d{2}-\d{2}');

  IF bad_turnos > 0 OR bad_pacientes > 0 THEN
    RAISE EXCEPTION 'Formato de fecha/hora inválido: % turno(s), % paciente(s). Corregilos antes de migrar.',
      bad_turnos, bad_pacientes;
  END IF;
END $$;

CREATE FUNCTION pg_temp.kt_to_date(value TEXT) RETURNS DATE AS $$
  SELECT CASE
    WHEN NULLIF(value, '') IS NULL THEN NULL
    WHEN value ~ '^\d{2}-\d{2}-\d{4}$' THEN to_date(value, 'DD-MM-YYYY')
    ELSE substring(value FROM 1 FOR 10)::date
  END
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE "turnos"
  ALTER COLUMN "fecha" TYPE DATE USING pg_temp.kt_to_date("fecha"),
  ALTER COLUMN "hora" TYPE TIME(0) USING "hora"::time;

ALTER TABLE "pacientes"
  ALTER COLUMN "ultimo_turno" TYPE DATE USING pg_temp.kt_to_date("ultimo_turno"),
  ALTER COLUMN "fecha_alta" TYPE DATE USING pg_temp.kt_to_date("fecha_alta");
