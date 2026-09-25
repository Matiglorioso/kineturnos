import { appDateToDb } from "@/lib/db/date-codec";
import { getTodayAppDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

/**
 * Recalcula `ultimoTurno` como el último turno atendido con fecha ≤ hoy
 * (mismo criterio que `getPatientLastAppointmentDate`). `fecha` es DATE:
 * MAX() ordena bien en SQL.
 */
export async function recomputePatientLastAppointment(
  patientId: string
): Promise<void> {
  const result = await prisma.turno.aggregate({
    where: {
      pacienteId: patientId,
      estado: "atendido",
      fecha: { lte: appDateToDb(getTodayAppDate()) },
    },
    _max: { fecha: true },
  });

  const ultimoTurno = result._max.fecha ?? null;

  await prisma.paciente.update({
    where: { id: patientId },
    data: { ultimoTurno },
  });
}

export async function syncTurnoPatientName(
  patientId: string,
  nombre: string
): Promise<void> {
  await prisma.turno.updateMany({
    where: { pacienteId: patientId },
    data: { pacienteNombre: nombre },
  });
}

export async function syncTurnoProfessionalName(
  professionalId: string,
  nombre: string
): Promise<void> {
  await prisma.turno.updateMany({
    where: { profesionalId: professionalId },
    data: { profesionalNombre: nombre },
  });
}
