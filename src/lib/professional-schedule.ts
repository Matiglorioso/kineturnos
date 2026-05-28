import { parseAppDate } from "@/lib/date-utils";
import { getEndTime, isEndTimeAfterStart, timeToMinutes } from "@/lib/time-utils";
import { Professional } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export { isEndTimeAfterStart };

export function getProfessionalScheduleLabel(professional: Professional): string {
  return `${professional.scheduleStart.slice(0, 5)} - ${professional.scheduleEnd.slice(0, 5)}`;
}

export function getWeekdayLabelFromAppDate(dateStr: string): string | null {
  const parsed = parseAppDate(dateStr);
  if (!parsed) return null;

  const label = format(parsed, "EEEE", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function normalizeWeekday(day: string): string {
  return day
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Valida si el profesional atiende ese dia de la semana (fecha dd-MM-yyyy). */
export function professionalWorksOnDay(
  professional: Professional,
  dateStr: string
): boolean {
  const weekday = getWeekdayLabelFromAppDate(dateStr);
  if (!weekday) return false;

  const target = normalizeWeekday(weekday);
  return professional.days.some((day) => normalizeWeekday(day) === target);
}

/** Valida que inicio + duracion caigan dentro del horario laboral del profesional. */
export function isWithinProfessionalSchedule(
  professional: Professional,
  startTime: string,
  durationMinutes: number
): boolean {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const scheduleStart = timeToMinutes(professional.scheduleStart);
  const scheduleEnd = timeToMinutes(professional.scheduleEnd);
  return start >= scheduleStart && end <= scheduleEnd;
}

export type ProfessionalSlotValidationErrors = {
  day?: string;
  schedule?: string;
};

export function validateProfessionalAppointmentSlot(
  professional: Professional | undefined,
  date: string,
  time: string,
  durationMinutes: number
): ProfessionalSlotValidationErrors {
  if (!professional) return {};

  if (!professionalWorksOnDay(professional, date)) {
    const weekday = getWeekdayLabelFromAppDate(date);
    return {
      day: `${professional.name} no atiende los ${weekday ?? "ese dia"}. Dias: ${professional.days.join(", ")}.`,
    };
  }

  if (!isWithinProfessionalSchedule(professional, time, durationMinutes)) {
    return {
      schedule: `El horario debe estar entre ${getProfessionalScheduleLabel(professional)}.`,
    };
  }

  return {};
}

/** Alias descriptivo para calculo de fin de turno en UI de agenda del profesional. */
export function getAppointmentEndTime(
  startTime: string,
  durationMinutes: number
): string {
  return getEndTime(startTime, durationMinutes);
}
