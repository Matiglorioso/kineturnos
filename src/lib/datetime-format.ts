import {
  APP_DATE_FORMAT,
  formatAppDate,
  formatAppDateLong,
  formatTodayLongLabel,
} from "@/lib/date-utils";
import { getEndTime, normalizeTime } from "@/lib/time-utils";

export { APP_DATE_FORMAT, formatAppDate, formatAppDateLong, formatTodayLongLabel };

/** Hora corta HH:mm */
export function formatTimeShort(time: string): string {
  return normalizeTime(time);
}

/** Ej: 09:00 - 09:45 hs */
export function formatAppointmentTimeRange(
  time: string,
  durationMinutes: number
): string {
  return `${formatTimeShort(time)} - ${getEndTime(time, durationMinutes)} hs`;
}

/** Ej: 25-05-2026 a las 09:00 hs */
export function formatAppointmentSlotLabel(date: string, time: string): string {
  return `${formatAppDate(date)} a las ${formatTimeShort(time)} hs`;
}

/** Ej: 09:00 - 09:45 hs (45 min) */
export function formatAppointmentScheduleDetail(
  time: string,
  durationMinutes: number
): string {
  return `${formatAppointmentTimeRange(time, durationMinutes)} (${durationMinutes} min)`;
}

/** Fecha + rango horario para listados */
export function formatAppointmentListLine(
  date: string,
  time: string,
  durationMinutes: number
): { dateLabel: string; timeLabel: string } {
  return {
    dateLabel: formatAppDate(date),
    timeLabel: formatAppointmentTimeRange(time, durationMinutes),
  };
}
