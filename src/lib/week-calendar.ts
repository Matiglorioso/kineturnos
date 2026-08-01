import { timeToMinutes } from "@/lib/time-utils";
import { parseAppDate, toAppDate } from "@/lib/date-utils";
import { Appointment } from "@/types";
import {
  addDays,
  addWeeks,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const WEEK_WORK_DAYS = 6;

export function getWeekStartMonday(reference: Date = new Date()): Date {
  return startOfWeek(reference, { weekStartsOn: 1 });
}

export function getWeekDaysMonToSat(weekStart: Date): Date[] {
  return Array.from({ length: WEEK_WORK_DAYS }, (_, index) =>
    addDays(weekStart, index)
  );
}

function capitalizeLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const monday = weekStart;
  const saturday = addDays(weekStart, WEEK_WORK_DAYS - 1);
  const startLabel = capitalizeLabel(
    format(monday, "EEEE d MMM", { locale: es })
  );
  const endLabel = capitalizeLabel(
    format(saturday, "EEEE d MMM", { locale: es })
  );
  return `${startLabel} - ${endLabel}`;
}

export function formatDayColumnHeader(date: Date): {
  weekday: string;
  dateLabel: string;
  appDate: string;
  isToday: boolean;
} {
  const appDate = toAppDate(date);
  const today = toAppDate(new Date());

  return {
    weekday: capitalizeLabel(format(date, "EEE", { locale: es })),
    dateLabel: format(date, "d MMM", { locale: es }),
    appDate,
    isToday: appDate === today,
  };
}

export function isDateInWorkWeek(
  appDateStr: string,
  weekStart: Date
): boolean {
  const parsed = parseAppDate(appDateStr);
  if (!parsed) return false;

  const intervalStart = startOfDay(weekStart);
  const intervalEnd = endOfDay(addDays(weekStart, WEEK_WORK_DAYS - 1));

  return isWithinInterval(parsed, { start: intervalStart, end: intervalEnd });
}

export function isSameWorkWeek(weekStart: Date, reference: Date = new Date()): boolean {
  return (
    toAppDate(weekStart) === toAppDate(getWeekStartMonday(reference))
  );
}

export function shiftWeek(weekStart: Date, direction: -1 | 1): Date {
  return addWeeks(weekStart, direction);
}

export function sortAppointmentsByTime(
  appointments: Appointment[]
): Appointment[] {
  return [...appointments].sort((a, b) => a.time.localeCompare(b.time));
}

export function filterAgendaAppointments(
  appointments: Appointment[],
  options: {
    statusFilter: Appointment["status"] | "todos";
    professionalFilter: string;
  }
): Appointment[] {
  return appointments.filter((appointment) => {
    if (
      options.statusFilter !== "todos" &&
      appointment.status !== options.statusFilter
    ) {
      return false;
    }

    if (
      options.professionalFilter !== "todos" &&
      appointment.professionalId !== options.professionalFilter
    ) {
      return false;
    }

    return true;
  });
}

export function groupAppointmentsByAppDate(
  appointments: Appointment[],
  weekDays: Date[]
): Record<string, Appointment[]> {
  const grouped: Record<string, Appointment[]> = {};

  weekDays.forEach((day) => {
    grouped[toAppDate(day)] = [];
  });

  appointments.forEach((appointment) => {
    const parsed = parseAppDate(appointment.date);
    if (!parsed) return;

    const key = toAppDate(parsed);
    if (grouped[key]) {
      grouped[key].push(appointment);
    }
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortAppointmentsByTime(grouped[key]);
  });

  return grouped;
}

export function getWeekHourBounds(
  appointments: Appointment[],
  defaultStartHour = 8,
  defaultEndHour = 19
): { startHour: number; endHour: number } {
  if (appointments.length === 0) {
    return { startHour: defaultStartHour, endHour: defaultEndHour };
  }

  let minMinutes = defaultStartHour * 60;
  let maxMinutes = defaultEndHour * 60;

  appointments.forEach((appointment) => {
    const start = timeToMinutes(appointment.time);
    const end = start + appointment.duration;
    minMinutes = Math.min(minMinutes, start);
    maxMinutes = Math.max(maxMinutes, end);
  });

  const startHour = Math.max(7, Math.floor(minMinutes / 60) - 1);
  const endHour = Math.min(21, Math.ceil(maxMinutes / 60) + 1);

  return {
    startHour,
    endHour: Math.max(endHour, startHour + 4),
  };
}

export function getHourSlots(startHour: number, endHour: number): number[] {
  return Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index
  );
}

export function getAppointmentTopOffset(
  time: string,
  startHour: number,
  hourHeight: number
): number {
  const minutesFromStart = timeToMinutes(time) - startHour * 60;
  return (minutesFromStart / 60) * hourHeight;
}

export function getAppointmentHeight(
  duration: number,
  hourHeight: number,
  minHeight = 52
): number {
  return Math.max(minHeight, (duration / 60) * hourHeight - 4);
}

function appointmentsOverlap(a: Appointment, b: Appointment): boolean {
  const aStart = timeToMinutes(a.time);
  const aEnd = aStart + a.duration;
  const bStart = timeToMinutes(b.time);
  const bEnd = bStart + b.duration;
  return aStart < bEnd && bStart < aEnd;
}

export type PositionedWeekAppointment = {
  appointment: Appointment;
  column: number;
  columnCount: number;
};

/**
 * Asigna columnas a turnos del mismo día que se solapan (estilo Google Calendar),
 * para que ninguno quede oculto detrás de otro.
 */
export function layoutDayAppointments(
  appointments: Appointment[]
): PositionedWeekAppointment[] {
  if (appointments.length === 0) return [];

  const sorted = sortAppointmentsByTime(appointments);
  const n = sorted.length;
  const parent = Array.from({ length: n }, (_, index) => index);

  const find = (index: number): number => {
    let current = index;
    while (parent[current] !== current) {
      parent[current] = parent[parent[current]];
      current = parent[current];
    }
    return current;
  };

  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (appointmentsOverlap(sorted[i], sorted[j])) {
        union(i, j);
      }
    }
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const group = clusters.get(root) ?? [];
    group.push(i);
    clusters.set(root, group);
  }

  const positioned: PositionedWeekAppointment[] = [];

  for (const indices of clusters.values()) {
    const cluster = indices.map((index) => sorted[index]);
    const columnEndMinutes: number[] = [];
    const columns: number[] = [];

    for (const appointment of cluster) {
      const start = timeToMinutes(appointment.time);
      const end = start + appointment.duration;
      let placed = false;

      for (let column = 0; column < columnEndMinutes.length; column++) {
        if (columnEndMinutes[column] <= start) {
          columnEndMinutes[column] = end;
          columns.push(column);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push(columnEndMinutes.length);
        columnEndMinutes.push(end);
      }
    }

    const columnCount = Math.max(1, columnEndMinutes.length);
    cluster.forEach((appointment, index) => {
      positioned.push({
        appointment,
        column: columns[index] ?? 0,
        columnCount,
      });
    });
  }

  return positioned;
}
