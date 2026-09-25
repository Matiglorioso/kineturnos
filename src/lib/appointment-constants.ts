import { SessionType } from "@/types";

export const SESSION_TYPES: SessionType[] = [
  "Evaluación inicial",
  "Rehabilitación",
  "Kinesiología respiratoria",
  "RPG",
  "Traumatología",
  "Deportiva",
  "Control",
];

/** Todos los turnos duran 1 hora. */
export const APPOINTMENT_SLOT_DURATION_MINUTES = 60;

/**
 * Horario del consultorio, común a todos los profesionales: los turnos
 * empiezan en bloques de 1 hora desde la apertura y terminan antes del cierre.
 */
export const CLINIC_OPENING_TIME = "08:00";
export const CLINIC_CLOSING_TIME = "18:00";
