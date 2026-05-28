import type {
  Appointment as PrismaAppointment,
  Patient as PrismaPatient,
  Professional as PrismaProfessional,
} from "@prisma/client";
import type { Appointment, Patient, Professional, WeekDay } from "@/types";

export function mapPatient(record: PrismaPatient): Patient {
  return {
    id: record.id,
    name: record.name,
    firstName: record.firstName ?? undefined,
    lastName: record.lastName ?? undefined,
    dni: record.dni,
    phone: record.phone,
    insurance: record.insurance,
    email: record.email ?? undefined,
    notes: record.notes ?? undefined,
    status: record.status,
    lastAppointment: record.lastAppointment ?? undefined,
    createdAt: record.createdAt ?? undefined,
  };
}

export function mapProfessional(record: PrismaProfessional): Professional {
  return {
    id: record.id,
    name: record.name,
    firstName: record.firstName,
    lastName: record.lastName,
    license: record.license ?? undefined,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    specialty: record.specialty,
    days: record.days as WeekDay[],
    scheduleStart: record.scheduleStart,
    scheduleEnd: record.scheduleEnd,
    defaultDuration: record.defaultDuration,
    active: record.active,
    avatarColor: record.avatarColor,
    notes: record.notes ?? undefined,
  };
}

export function mapAppointment(record: PrismaAppointment): Appointment {
  return {
    id: record.id,
    patientId: record.patientId,
    patientName: record.patientName,
    professionalId: record.professionalId,
    professionalName: record.professionalName,
    date: record.date,
    time: record.time,
    duration: record.duration,
    status: record.status,
    sessionType: record.sessionType as Appointment["sessionType"],
    notes: record.notes ?? undefined,
  };
}
