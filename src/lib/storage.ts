"use client";

import { normalizeAppDate } from "@/lib/date-utils";
import {
  buildProfessionalName,
  PROFESSIONAL_DURATION_OPTIONS,
} from "@/lib/professional-utils";
import {
  Appointment,
  AppointmentStatus,
  Patient,
  Professional,
  SessionType,
  WeekDay,
} from "@/types";

export const STORAGE_KEYS = {
  patients: "kineturnos:patients",
  appointments: "kineturnos:appointments",
  professionals: "kineturnos:professionals",
} as const;

const WEEK_DAYS: WeekDay[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pendiente",
  "confirmado",
  "atendido",
  "cancelado",
  "ausente",
];

const SESSION_TYPES: SessionType[] = [
  "Evaluación inicial",
  "Rehabilitación",
  "Kinesiología respiratoria",
  "RPG",
  "Traumatología",
  "Deportiva",
  "Control",
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isPatient(value: unknown): value is Patient {
  if (!value || typeof value !== "object") return false;

  const patient = value as Patient;

  return (
    typeof patient.id === "string" &&
    typeof patient.name === "string" &&
    typeof patient.dni === "string" &&
    typeof patient.phone === "string" &&
    typeof patient.insurance === "string" &&
    (patient.status === "activo" || patient.status === "inactivo") &&
    (patient.createdAt === undefined || typeof patient.createdAt === "string")
  );
}

function isAppointment(value: unknown): value is Appointment {
  if (!value || typeof value !== "object") return false;

  const appointment = value as Appointment;

  return (
    typeof appointment.id === "string" &&
    typeof appointment.patientId === "string" &&
    typeof appointment.patientName === "string" &&
    typeof appointment.professionalId === "string" &&
    typeof appointment.professionalName === "string" &&
    typeof appointment.date === "string" &&
    typeof appointment.time === "string" &&
    typeof appointment.duration === "number" &&
    APPOINTMENT_STATUSES.includes(appointment.status) &&
    SESSION_TYPES.includes(appointment.sessionType)
  );
}

function isPatientArray(value: unknown): value is Patient[] {
  return Array.isArray(value) && value.every(isPatient);
}

function isAppointmentArray(value: unknown): value is Appointment[] {
  return Array.isArray(value) && value.every(isAppointment);
}

function isProfessional(value: unknown): value is Professional {
  if (!value || typeof value !== "object") return false;

  const professional = value as Professional;

  return (
    typeof professional.id === "string" &&
    typeof professional.name === "string" &&
    typeof professional.specialty === "string" &&
    Array.isArray(professional.days) &&
    professional.days.every((day) => typeof day === "string") &&
    typeof professional.active === "boolean" &&
    typeof professional.avatarColor === "string" &&
    (typeof professional.scheduleStart === "string" ||
      typeof professional.schedule === "string") &&
    (typeof professional.scheduleEnd === "string" ||
      typeof professional.schedule === "string")
  );
}

function isProfessionalArray(value: unknown): value is Professional[] {
  return Array.isArray(value) && value.every(isProfessional);
}

export function loadFromStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T
): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage`, error);
  }
}

function migratePatient(patient: Patient): Patient {
  return {
    ...patient,
    createdAt: patient.createdAt
      ? normalizeAppDate(patient.createdAt)
      : undefined,
    lastAppointment: patient.lastAppointment
      ? normalizeAppDate(patient.lastAppointment)
      : undefined,
  };
}

function migrateAppointment(appointment: Appointment): Appointment {
  return {
    ...appointment,
    date: normalizeAppDate(appointment.date),
  };
}

export function loadPatients(fallback: Patient[]): Patient[] {
  const loaded = loadFromStorage(STORAGE_KEYS.patients, fallback, isPatientArray);
  return loaded.map(migratePatient);
}

export function savePatients(patients: Patient[]): void {
  saveToStorage(STORAGE_KEYS.patients, patients);
}

export function loadAppointments(fallback: Appointment[]): Appointment[] {
  const loaded = loadFromStorage(
    STORAGE_KEYS.appointments,
    fallback,
    isAppointmentArray
  );
  return loaded.map(migrateAppointment);
}

export function saveAppointments(appointments: Appointment[]): void {
  saveToStorage(STORAGE_KEYS.appointments, appointments);
}

export function clearStoredPatients(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.patients);
}

export function clearStoredAppointments(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.appointments);
}

function migrateProfessional(professional: Professional): Professional {
  let scheduleStart = professional.scheduleStart;
  let scheduleEnd = professional.scheduleEnd;

  if ((!scheduleStart || !scheduleEnd) && professional.schedule) {
    const parts = professional.schedule.split("-").map((part) => part.trim());
    scheduleStart = parts[0] ?? "08:00";
    scheduleEnd = parts[1] ?? "18:00";
  }

  scheduleStart = (scheduleStart ?? "08:00").slice(0, 5);
  scheduleEnd = (scheduleEnd ?? "18:00").slice(0, 5);

  const nameParts = professional.name.trim().split(/\s+/);
  const firstName =
    professional.firstName ??
    (nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0] ?? "");
  const lastName =
    professional.lastName ??
    (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "");

  const days = professional.days.filter((day): day is WeekDay =>
    WEEK_DAYS.includes(day as WeekDay)
  );

  const defaultDuration = PROFESSIONAL_DURATION_OPTIONS.includes(
    professional.defaultDuration as (typeof PROFESSIONAL_DURATION_OPTIONS)[number]
  )
    ? professional.defaultDuration
    : 45;

  return {
    ...professional,
    firstName,
    lastName,
    name: buildProfessionalName(firstName, lastName) || professional.name,
    days: days.length > 0 ? days : ["Lunes"],
    scheduleStart,
    scheduleEnd,
    defaultDuration,
    schedule: undefined,
  };
}

export function loadProfessionals(fallback: Professional[]): Professional[] {
  const loaded = loadFromStorage(
    STORAGE_KEYS.professionals,
    fallback,
    isProfessionalArray
  );
  return loaded.map(migrateProfessional);
}

export function saveProfessionals(professionals: Professional[]): void {
  saveToStorage(STORAGE_KEYS.professionals, professionals);
}

export function clearStoredProfessionals(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.professionals);
}
