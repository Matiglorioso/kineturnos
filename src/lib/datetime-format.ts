import {
  APP_DATE_FORMAT,
  formatAppDate,
  formatAppDateLong,
  formatTodayLongLabel,
} from "@/lib/date-utils";
import { APPOINTMENT_SLOT_DURATION_MINUTES } from "@/lib/appointment-constants";
import { getEndTime, normalizeTime } from "@/lib/time-utils";

export { APP_DATE_FORMAT, formatAppDate, formatAppDateLong, formatTodayLongLabel };

/** Hora corta HH:mm */
export function formatTimeShort(time: string): string {
  return normalizeTime(time);
}

/** Ej: 09:00 - 10:00 hs (todos los turnos duran 1 hora) */
export function formatAppointmentTimeRange(time: string): string {
  return `${formatTimeShort(time)} - ${getEndTime(time, APPOINTMENT_SLOT_DURATION_MINUTES)} hs`;
}

/** Ej: 25-05-2026 a las 09:00 hs */
export function formatAppointmentSlotLabel(date: string, time: string): string {
  return `${formatAppDate(date)} a las ${formatTimeShort(time)} hs`;
}

/** Ej: 09:00 - 10:00 hs (60 min) */
export function formatAppointmentScheduleDetail(time: string): string {
  return `${formatAppointmentTimeRange(time)} (${APPOINTMENT_SLOT_DURATION_MINUTES} min)`;
}

/** Fecha + rango horario para listados */
export function formatAppointmentListLine(
  date: string,
  time: string
): { dateLabel: string; timeLabel: string } {
  return {
    dateLabel: formatAppDate(date),
    timeLabel: formatAppointmentTimeRange(time),
  };
}
