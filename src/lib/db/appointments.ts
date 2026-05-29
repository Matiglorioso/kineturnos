import { mapAppointment } from "@/lib/db/mappers";
import {
  NotFoundError,
  ValidationError,
} from "@/lib/db/errors";
import {
  appointmentToWriteInput,
  resolveAppointmentId,
  toAppointmentFormInput,
  toTurnoWriteData,
  type AppointmentWriteInput,
} from "@/lib/db/appointment-write";
import { getProfessionalsFromDb } from "@/lib/db/professionals";
import { validateAppointmentForm } from "@/lib/appointment-validation";
import { prisma } from "@/lib/prisma";
import type { Appointment, AppointmentStatus } from "@/types";

export type { AppointmentWriteInput } from "@/lib/db/appointment-write";
export { appointmentToWriteInput } from "@/lib/db/appointment-write";

export async function getAppointmentsFromDb(): Promise<Appointment[]> {
  const records = await prisma.turno.findMany({
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  return records.map(mapAppointment);
}

export async function getAppointmentByIdFromDb(
  id: string
): Promise<Appointment | null> {
  const record = await prisma.turno.findUnique({ where: { id } });
  return record ? mapAppointment(record) : null;
}

async function resolveAppointmentNames(patientId: string, professionalId: string) {
  const [paciente, profesional] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: patientId } }),
    prisma.profesional.findUnique({ where: { id: professionalId } }),
  ]);

  if (!paciente) {
    throw new NotFoundError("Paciente no encontrado.");
  }

  if (!profesional) {
    throw new NotFoundError("Profesional no encontrado.");
  }

  return {
    pacienteNombre: paciente.nombre,
    profesionalNombre: profesional.nombre,
  };
}

export async function assertAppointmentInputValid(
  input: AppointmentWriteInput,
  excludeId?: string
): Promise<void> {
  const [appointments, professionals] = await Promise.all([
    getAppointmentsFromDb(),
    getProfessionalsFromDb(),
  ]);

  const errors = validateAppointmentForm(
    toAppointmentFormInput(input),
    appointments,
    professionals,
    excludeId
  );

  const firstErrorEntry = Object.entries(errors).find(([, message]) => message);
  if (firstErrorEntry) {
    const [field, message] = firstErrorEntry;
    throw new ValidationError(message!, field);
  }
}

export async function createAppointmentInDb(
  input: AppointmentWriteInput
): Promise<Appointment> {
  await assertAppointmentInputValid(input);

  const names = await resolveAppointmentNames(
    input.patientId,
    input.professionalId
  );

  const record = await prisma.turno.create({
    data: {
      id: resolveAppointmentId(input),
      ...toTurnoWriteData(input, names),
    },
  });

  return mapAppointment(record);
}

export async function updateAppointmentInDb(
  id: string,
  input: AppointmentWriteInput
): Promise<Appointment> {
  await assertAppointmentInputValid(input, id);

  const names = await resolveAppointmentNames(
    input.patientId,
    input.professionalId
  );

  const record = await prisma.turno.update({
    where: { id },
    data: toTurnoWriteData(input, names),
  });

  return mapAppointment(record);
}

export async function updateAppointmentStatusInDb(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const existing = await getAppointmentByIdFromDb(id);
  if (!existing) {
    throw new NotFoundError("Turno no encontrado.");
  }

  return updateAppointmentInDb(id, {
    ...appointmentToWriteInput(existing),
    status,
  });
}
