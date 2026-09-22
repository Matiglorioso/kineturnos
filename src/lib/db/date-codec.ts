import { ValidationError } from "./errors";

/**
 * Conversión entre el formato de la app (fecha `dd-MM-yyyy`, hora `HH:mm`)
 * y las columnas PostgreSQL `DATE` / `TIME`.
 *
 * Prisma representa `@db.Date` como medianoche UTC y `@db.Time` como
 * 1970-01-01 en UTC, así que toda la conversión usa componentes UTC para
 * no depender de la zona horaria del servidor.
 */

const APP_DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_REGEX = /^(\d{2}):(\d{2})/;

const pad = (value: number) => String(value).padStart(2, "0");

export function appDateToDb(value: string, field = "date"): Date {
  const trimmed = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const app = APP_DATE_REGEX.exec(trimmed);
  const iso = app ? null : ISO_DATE_REGEX.exec(trimmed);

  if (app) {
    day = Number(app[1]);
    month = Number(app[2]);
    year = Number(app[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    throw new ValidationError("Fecha inválida. Usá el formato dd-mm-aaaa.", field);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ValidationError("Fecha inválida.", field);
  }

  return date;
}

export function optionalAppDateToDb(
  value: string | null | undefined,
  field?: string
): Date | null {
  if (!value || !value.trim()) return null;
  return appDateToDb(value, field);
}

export function dbDateToApp(date: Date): string {
  return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date.getUTCFullYear()}`;
}

export function optionalDbDateToApp(date: Date | null | undefined): string | undefined {
  return date ? dbDateToApp(date) : undefined;
}

export function appTimeToDb(value: string, field = "time"): Date {
  const match = TIME_REGEX.exec(value.trim());
  const hours = match ? Number(match[1]) : NaN;
  const minutes = match ? Number(match[2]) : NaN;

  if (!match || hours > 23 || minutes > 59) {
    throw new ValidationError("Hora inválida. Usá el formato HH:mm.", field);
  }

  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

export function dbTimeToApp(time: Date): string {
  return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}`;
}

/** Fecha más reciente de una lista de fechas DB (o null si está vacía). */
export function maxDbDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}
