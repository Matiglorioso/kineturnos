import {
  APPOINTMENT_SLOT_DURATION_MINUTES,
  CLINIC_CLOSING_TIME,
  CLINIC_OPENING_TIME,
} from "@/lib/appointment-constants";
import { parseAppDate } from "@/lib/date-utils";
import { timeToMinutes } from "@/lib/time-utils";
import { Professional } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Ej: "08:00 - 18:00": horario del consultorio, igual para todos los profesionales. */
export function getClinicScheduleLabel(): string {
  return `${CLINIC_OPENING_TIME} - ${CLINIC_CLOSING_TIME}`;
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

/** Valida que el turno (1 h) empiece y termine dentro del horario del consultorio. */
export function isWithinClinicSchedule(startTime: string): boolean {
  const start = timeToMinutes(startTime);
  return (
    start >= timeToMinutes(CLINIC_OPENING_TIME) &&
    start + APPOINTMENT_SLOT_DURATION_MINUTES <= timeToMinutes(CLINIC_CLOSING_TIME)
  );
}

export type ProfessionalSlotValidationErrors = {
  day?: string;
  schedule?: string;
};

export function validateProfessionalAppointmentSlot(
  professional: Professional | undefined,
  date: string,
  time: string
): ProfessionalSlotValidationErrors {
  if (!professional) return {};

  if (!professionalWorksOnDay(professional, date)) {
    const weekday = getWeekdayLabelFromAppDate(date);
    return {
      day: `${professional.name} no atiende los ${weekday ?? "ese día"}. Días: ${professional.days.join(", ")}.`,
    };
  }

  if (!isWithinClinicSchedule(time)) {
    return {
      schedule: `El horario debe estar entre ${getClinicScheduleLabel()}.`,
    };
  }

  return {};
}
