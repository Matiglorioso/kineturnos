-- CUIL y fecha de nacimiento del paciente (RF08). Opcionales: los pacientes ya cargados no los tienen.
ALTER TABLE "pacientes" ADD COLUMN "cuil" TEXT;
ALTER TABLE "pacientes" ADD COLUMN "fecha_nacimiento" DATE;
