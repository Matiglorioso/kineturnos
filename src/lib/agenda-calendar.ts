import { formatAppDate, parseAppDate, toAppDate } from "@/lib/date-utils";
import { addDays, addMonths, endOfMonth, startOfMonth } from "date-fns";

/** Mes del calendario: `month` va de 0 (enero) a 11 (diciembre). */
export type CalendarMonth = { year: number; month: number };

export type CalendarCell = { date: string; inMonth: boolean };

export function getCalendarMonth(appDate: string): CalendarMonth {
  const date = parseAppDate(appDate) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function shiftCalendarMonth(value: CalendarMonth, delta: number): CalendarMonth {
  const date = addMonths(new Date(value.year, value.month, 1), delta);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function isSameCalendarMonth(a: CalendarMonth, b: CalendarMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

function monthIndex(value: CalendarMonth): number {
  return value.year * 12 + value.month;
}

/** "Octubre 2026" */
export function formatCalendarMonth(value: CalendarMonth): string {
  const label = formatAppDate(toAppDate(new Date(value.year, value.month, 1)), "MMMM yyyy");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Todos los días del mes, en formato dd-MM-yyyy. */
export function getMonthDays(value: CalendarMonth): string[] {
  const first = startOfMonth(new Date(value.year, value.month, 1));
  const last = endOfMonth(first).getDate();
  return Array.from({ length: last }, (_, index) => toAppDate(addDays(first, index)));
}

/**
 * Grilla del mes por semanas, de lunes a domingo, con los días de los meses
 * vecinos que completan la primera y la última semana (`inMonth: false`).
 */
export function getMonthGrid(value: CalendarMonth): CalendarCell[][] {
  const first = new Date(value.year, value.month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  const last = endOfMonth(first);
  const weeks: CalendarCell[][] = [];

  for (let cursor = start; cursor <= last || weeks.length === 0; ) {
    const week: CalendarCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      week.push({ date: toAppDate(cursor), inMonth: cursor.getMonth() === value.month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/**
 * Pestañas de meses de la agenda: el mes actual y los dos siguientes. Si el
 * día elegido cae fuera de ese rango, las pestañas se corren para incluirlo.
 */
export function getMonthTabs(today: CalendarMonth, selected: CalendarMonth): CalendarMonth[] {
  let start = today;
  if (monthIndex(selected) < monthIndex(today)) start = selected;
  if (monthIndex(selected) > monthIndex(today) + 2) start = shiftCalendarMonth(selected, -2);
  return [0, 1, 2].map((delta) => shiftCalendarMonth(start, delta));
}

/** Día a elegir al pasar a otro mes: hoy si es el mes actual; si no, el primer día hábil (lunes a sábado). */
export function getDefaultDayForMonth(value: CalendarMonth, today: string): string {
  if (isSameCalendarMonth(getCalendarMonth(today), value)) return today;
  return getMonthDays(value).find((date) => parseAppDate(date)!.getDay() !== 0)!;
}

export function isSunday(appDate: string): boolean {
  return parseAppDate(appDate)?.getDay() === 0;
}

/** Cantidad de turnos por día (dd-MM-yyyy). */
export function countAppointmentsByDay(appointments: { date: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    counts.set(appointment.date, (counts.get(appointment.date) ?? 0) + 1);
  }
  return counts;
}

/** Etiqueta de la cantidad en un día: hasta 9, después "9+". */
export function formatDayCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/** Nombre accesible de un día: "viernes 16 de octubre de 2026, 3 turnos". */
export function dayAriaLabel(date: string, count: number): string {
  const label = formatAppDate(date, "EEEE d 'de' MMMM 'de' yyyy");
  if (count === 0) return `${label}, sin turnos`;
  return `${label}, ${count} ${count === 1 ? "turno" : "turnos"}`;
}
