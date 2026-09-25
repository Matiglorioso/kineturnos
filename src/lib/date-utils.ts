import { normalizeTime } from "@/lib/time-utils";
import { isValid, parse, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

export const APP_DATE_FORMAT = "dd-MM-yyyy";
const APP_DATE_REGEX = /^\d{2}-\d{2}-\d{4}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Zona horaria del consultorio: "hoy" no depende de la del servidor (UTC en Vercel). */
export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

const appClockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getAppClockParts(referenceDate: Date): Record<string, string> {
  return Object.fromEntries(
    appClockFormatter
      .formatToParts(referenceDate)
      .map((part) => [part.type, part.value])
  );
}

export function toAppDate(date: Date): string {
  return format(date, APP_DATE_FORMAT);
}

/** Fecha de hoy (dd-MM-yyyy) en la zona horaria del consultorio. */
export function getTodayAppDate(referenceDate: Date = new Date()): string {
  const { day, month, year } = getAppClockParts(referenceDate);
  return `${day}-${month}-${year}`;
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

export function isPastAppDate(dateStr: string, now: Date = new Date()): boolean {
  if (!parseAppDate(dateStr)) return false;
  return compareAppDates(dateStr, getTodayAppDate(now)) < 0;
}

export function isFutureAppDate(dateStr: string, now: Date = new Date()): boolean {
  if (!parseAppDate(dateStr)) return false;
  return compareAppDates(dateStr, getTodayAppDate(now)) > 0;
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

/** Compara fechas dd-MM-yyyy. Retorna negativo si a < b, 0 si iguales, positivo si a > b. */
export function compareAppDates(dateA: string, dateB: string): number {
  const parsedA = parseAppDate(dateA);
  const parsedB = parseAppDate(dateB);

  if (!parsedA && !parsedB) return dateA.localeCompare(dateB);
  if (!parsedA) return -1;
  if (!parsedB) return 1;

  return parsedA.getTime() - parsedB.getTime();
}

export function maxAppDate(dates: string[]): string | null {
  if (dates.length === 0) return null;

  return dates.reduce((latest, current) =>
    compareAppDates(current, latest) > 0 ? current : latest
  );
}
