import { mapPatient } from "@/lib/db/mappers";
import {
  patientToWriteInput,
  resolveCreatedAt,
  resolvePatientId,
  toPacienteWriteData,
  type PatientWriteInput,
} from "@/lib/db/patient-write";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/appointment-status";
import { DeleteBlockedError, DuplicateFieldError } from "@/lib/db/errors";
import { syncTurnoPatientName } from "@/lib/db/sync";
import {
  appDateToDb,
  dbDateToApp,
  optionalAppDateToDb,
} from "@/lib/db/date-codec";
import { getPatientLastAppointmentDate } from "@/lib/patient-appointments";
import {
  DUPLICATE_DNI_MESSAGE,
  normalizeDni,
} from "@/lib/document-validation";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus, Patient } from "@/types";

export type { PatientWriteInput } from "@/lib/db/patient-write";
export { patientToWriteInput } from "@/lib/db/patient-write";

/**
 * Mismo criterio que el valor guardado (`recomputePatientLastAppointment`):
 * último atendido con fecha ≤ hoy. Sin turnos se conserva el valor cargado.
 */
function resolveLastAppointment(
  turnos: { fecha: Date; estado: AppointmentStatus }[],
  stored: Date | null
): Date | null {
  if (turnos.length === 0) return stored;

  const last = getPatientLastAppointmentDate(
    turnos.map((turno) => ({
      date: dbDateToApp(turno.fecha),
      status: turno.estado,
    }))
  );
  return last ? appDateToDb(last) : null;
}

export async function getPatientsFromDb(options?: {
  professionalId?: string;
}): Promise<Patient[]> {
  const records = await prisma.paciente.findMany({
    where: options?.professionalId
      ? { turnos: { some: { profesionalId: options.professionalId } } }
      : undefined,
    orderBy: { nombre: "asc" },
    include: {
      turnos: {
        select: { fecha: true, estado: true },
      },
    },
  });

  return records.map((record) =>
    mapPatient({
      ...record,
      ultimoTurno: resolveLastAppointment(record.turnos, record.ultimoTurno),
    })
  );
}

export async function getPatientByIdFromDb(id: string): Promise<Patient | null> {
  const record = await prisma.paciente.findUnique({
    where: { id },
    include: {
      turnos: {
        select: { fecha: true, estado: true },
      },
    },
  });

  if (!record) return null;

  return mapPatient({
    ...record,
    ultimoTurno: resolveLastAppointment(record.turnos, record.ultimoTurno),
  });
}

export async function assertPatientDniAvailable(
  dni: string,
  excludeId?: string
): Promise<void> {
  const dniNormalizado = normalizeDni(dni);
  const existing = await prisma.paciente.findUnique({
    where: { dniNormalizado },
  });

  if (existing && existing.id !== excludeId) {
    throw new DuplicateFieldError("dni", DUPLICATE_DNI_MESSAGE);
  }
}

export async function createPatientInDb(input: PatientWriteInput): Promise<Patient> {
  await assertPatientDniAvailable(input.dni);

  const record = await prisma.paciente.create({
    data: {
      id: resolvePatientId(input),
      ...toPacienteWriteData(input),
      fechaAlta: optionalAppDateToDb(resolveCreatedAt(input), "createdAt"),
    },
  });

  return mapPatient(record);
}

export async function updatePatientInDb(
  id: string,
  input: PatientWriteInput
): Promise<Patient> {
  await assertPatientDniAvailable(input.dni, id);

  const existing = await getPatientByIdFromDb(id);
  const writeData = toPacienteWriteData(input);

  const record = await prisma.paciente.update({
    where: { id },
    data: writeData,
  });

  if (existing && existing.name !== writeData.nombre) {
    await syncTurnoPatientName(id, writeData.nombre);
  }

  return mapPatient(record);
}

/**
 * Borra el paciente y su historial (cascada). Se bloquea si tiene turnos
 * activos (pendiente/confirmado), igual que con los profesionales.
 */
export async function deletePatientFromDb(id: string): Promise<void> {
  const activeCount = await prisma.turno.count({
    where: { pacienteId: id, estado: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
  });

  if (activeCount > 0) {
    throw new DeleteBlockedError(
      `No se puede eliminar el paciente porque tiene ${activeCount} turno(s) activo(s) (pendiente o confirmado). Cancelalos o atendelos antes de eliminar, o marcá al paciente como inactivo.`
    );
  }

  await prisma.paciente.delete({ where: { id } });
}

export async function countPatientAppointmentsInDb(patientId: string): Promise<number> {
  return prisma.turno.count({ where: { pacienteId: patientId } });
}

/** True si el paciente tiene al menos un turno con el profesional. */
export async function patientBelongsToProfessionalInDb(
  patientId: string,
  professionalId: string
): Promise<boolean> {
  const count = await prisma.turno.count({
    where: { pacienteId: patientId, profesionalId: professionalId },
  });
  return count > 0;
}
