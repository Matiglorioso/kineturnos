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

export const APPOINTMENT_SLOT_DURATION_MINUTES = 60;

export const APPOINTMENT_DURATION_OPTIONS = [
  APPOINTMENT_SLOT_DURATION_MINUTES,
] as const;
