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
 * Horario del consultorio (lunes a viernes), común a todos los profesionales: dos tramos,
 * de 07:00 a 12:00 y de 13:00 a 20:00. Los turnos empiezan en bloques de 1 hora dentro de
 * cada tramo y terminan antes de su cierre: no hay turnos durante la pausa de las 12:00.
 */
export const CLINIC_SCHEDULE_BLOCKS = [
  { start: "07:00", end: "12:00" },
  { start: "13:00", end: "20:00" },
] as const;

export const CLINIC_OPENING_TIME = CLINIC_SCHEDULE_BLOCKS[0].start;
export const CLINIC_CLOSING_TIME = CLINIC_SCHEDULE_BLOCKS[CLINIC_SCHEDULE_BLOCKS.length - 1].end;
