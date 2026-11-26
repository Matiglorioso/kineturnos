import { appDateToDb, appTimeToDb } from "@/lib/db/date-codec";
import type { Appointment, AppointmentStatus, SessionType } from "@/types";

export interface AppointmentWriteInput {
  id?: string;
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  sessionType: SessionType;
  notes?: string;
}

export function appointmentToWriteInput(
  appointment: Appointment
): AppointmentWriteInput {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    professionalId: appointment.professionalId,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    sessionType: appointment.sessionType,
    notes: appointment.notes,
  };
}

export function toTurnoWriteData(
  input: AppointmentWriteInput,
  names: { pacienteNombre: string; profesionalNombre: string }
) {
  return {
    pacienteId: input.patientId,
    profesionalId: input.professionalId,
    pacienteNombre: names.pacienteNombre,
    profesionalNombre: names.profesionalNombre,
    fecha: appDateToDb(input.date, "date"),
    hora: appTimeToDb(input.time, "time"),
    estado: input.status,
    tipoSesion: input.sessionType,
    observaciones: input.notes?.trim() || null,
  };
}

/** Id de un turno nuevo: lo genera siempre el servidor (nunca el que manda el cliente). */
export function newAppointmentId(): string {
  // globalThis.crypto (Web Crypto): este módulo también lo importa el cliente, sin node:crypto.
  return `a-${globalThis.crypto.randomUUID()}`;
}

export function toAppointmentFormInput(input: AppointmentWriteInput) {
  return {
    patientId: input.patientId,
    professionalId: input.professionalId,
    date: input.date,
    time: input.time,
    sessionType: input.sessionType,
    status: input.status,
  };
}
