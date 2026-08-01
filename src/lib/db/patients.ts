import { mapPatient } from "@/lib/db/mappers";
import {
  patientToWriteInput,
  resolveCreatedAt,
  resolvePatientId,
  toPacienteWriteData,
  type PatientWriteInput,
} from "@/lib/db/patient-write";
import { DuplicateFieldError } from "@/lib/db/errors";
import { syncTurnoPatientName } from "@/lib/db/sync";
import { maxAppDate } from "@/lib/date-utils";
import {
  DUPLICATE_DNI_MESSAGE,
  normalizeDni,
} from "@/lib/document-validation";
import { prisma } from "@/lib/prisma";
import type { Patient } from "@/types";

export type { PatientWriteInput } from "@/lib/db/patient-write";
export { patientToWriteInput } from "@/lib/db/patient-write";

export async function getPatientsFromDb(): Promise<Patient[]> {
  const records = await prisma.paciente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      turnos: {
        select: { fecha: true },
      },
    },
  });

  return records.map((record) => {
    const latestFromTurnos = maxAppDate(record.turnos.map((t) => t.fecha));
    return mapPatient({
      ...record,
      ultimoTurno: latestFromTurnos ?? record.ultimoTurno,
    });
  });
}

export async function getPatientByIdFromDb(id: string): Promise<Patient | null> {
  const record = await prisma.paciente.findUnique({
    where: { id },
    include: {
      turnos: {
        select: { fecha: true },
      },
    },
  });

  if (!record) return null;

  const latestFromTurnos = maxAppDate(record.turnos.map((t) => t.fecha));
  return mapPatient({
    ...record,
    ultimoTurno: latestFromTurnos ?? record.ultimoTurno,
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
      fechaAlta: resolveCreatedAt(input),
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

export async function deletePatientFromDb(id: string): Promise<void> {
  await prisma.paciente.delete({ where: { id } });
}

export async function countPatientAppointmentsInDb(patientId: string): Promise<number> {
  return prisma.turno.count({ where: { pacienteId: patientId } });
}
