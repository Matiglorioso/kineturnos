-- AlterForeignKey: turnos.profesional_id
-- Antes: ON DELETE RESTRICT (bloqueaba borrar profesional con cualquier turno)
-- Ahora: ON DELETE CASCADE (alineado con pacientes; la API bloquea solo turnos activos)

ALTER TABLE "turnos" DROP CONSTRAINT "turnos_profesional_id_fkey";

ALTER TABLE "turnos" ADD CONSTRAINT "turnos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
