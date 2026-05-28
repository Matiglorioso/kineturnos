import type {
  Paciente,
  Profesional,
  Turno,
} from "@prisma/client";
import type { Appointment, Patient, Professional, WeekDay } from "@/types";

export function mapPatient(record: Paciente): Patient {
  return {
    id: record.id,
    name: record.nombre,
    firstName: record.nombrePila ?? undefined,
    lastName: record.apellido ?? undefined,
    dni: record.dni,
    phone: record.telefono,
    insurance: record.obraSocial,
    email: record.email ?? undefined,
    notes: record.observaciones ?? undefined,
    status: record.estado,
    lastAppointment: record.ultimoTurno ?? undefined,
    createdAt: record.fechaAlta ?? undefined,
  };
}

export function mapProfessional(record: Profesional): Professional {
  return {
    id: record.id,
    name: record.nombre,
    firstName: record.nombrePila,
    lastName: record.apellido,
    license: record.matricula ?? undefined,
    email: record.email ?? undefined,
    phone: record.telefono ?? undefined,
    specialty: record.especialidad,
    days: record.diasAtencion as WeekDay[],
    scheduleStart: record.horarioInicio,
    scheduleEnd: record.horarioFin,
    defaultDuration: record.duracionDefault,
    active: record.activo,
    avatarColor: record.colorAvatar,
    notes: record.observaciones ?? undefined,
  };
}

export function mapAppointment(record: Turno): Appointment {
  return {
    id: record.id,
    patientId: record.pacienteId,
    patientName: record.pacienteNombre,
    professionalId: record.profesionalId,
    professionalName: record.profesionalNombre,
    date: record.fecha,
    time: record.hora,
    duration: record.duracion,
    status: record.estado,
    sessionType: record.tipoSesion as Appointment["sessionType"],
    notes: record.observaciones ?? undefined,
  };
}
