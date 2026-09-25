-- Todos los turnos duran 1 hora y el horario de atención es el del consultorio
-- (08:00 a 18:00, en el código): se eliminan el horario y la duración por
-- defecto de cada profesional y la duración de cada turno.
ALTER TABLE "profesionales"
  DROP COLUMN "horario_inicio",
  DROP COLUMN "horario_fin",
  DROP COLUMN "duracion_default";

ALTER TABLE "turnos" DROP COLUMN "duracion";
