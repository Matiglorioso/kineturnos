import { normalizeTime } from "@/lib/time-utils";
import { format, isValid, parse, parseISO, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";

export const APP_DATE_FORMAT = "dd-MM-yyyy";
const APP_DATE_REGEX = /^\d{2}-\d{2}-\d{4}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function toAppDate(date: Date): string {
  return format(date, APP_DATE_FORMAT);
}

export function getTodayAppDate(referenceDate: Date = new Date()): string {
  return toAppDate(referenceDate);
}

export function isValidAppDate(dateStr: string): boolean {
  if (!APP_DATE_REGEX.test(dateStr)) return false;
  return parseAppDate(dateStr) !== null;
}

export function parseAppDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  if (APP_DATE_REGEX.test(dateStr)) {
    const parsed = parse(dateStr, APP_DATE_FORMAT, new Date());
    return isValid(parsed) ? parsed : null;
  }

  if (ISO_DATE_REGEX.test(dateStr)) {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : null;
  }

  if (dateStr.includes("T")) {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeAppDate(dateStr: string): string {
  const parsed = parseAppDate(dateStr);
  if (!parsed) return dateStr;
  return toAppDate(parsed);
}

export function formatAppDate(
  dateStr: string,
  pattern: string = APP_DATE_FORMAT
): string {
  const parsed = parseAppDate(dateStr);
  if (!parsed) return dateStr;
  return format(parsed, pattern, { locale: es });
}

export function formatAppDateLong(dateStr: string): string {
  return formatAppDate(dateStr, `EEEE ${APP_DATE_FORMAT}`);
}

export function formatTodayLongLabel(referenceDate: Date = new Date()): string {
  return format(referenceDate, `EEEE ${APP_DATE_FORMAT}`, { locale: es });
}

export function isPastAppDate(dateStr: string): boolean {
  const selected = parseAppDate(dateStr);
  if (!selected) return false;
  return isBefore(startOfDay(selected), startOfDay(new Date()));
}

export function getAppointmentDateTime(dateStr: string, time: string): Date {
  const base = parseAppDate(dateStr) ?? new Date();
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function areSameAppDay(dateA: string, dateB: string): boolean {
  const parsedA = parseAppDate(dateA);
  const parsedB = parseAppDate(dateB);
  if (!parsedA || !parsedB) return dateA === dateB;
  return toAppDate(parsedA) === toAppDate(parsedB);
}
