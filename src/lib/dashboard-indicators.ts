import { compareAppDates, formatAppDate, parseAppDate, toAppDate } from "@/lib/date-utils";
import type { Appointment, AppointmentStatus } from "@/types";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";

export type PeriodPreset = "semana" | "mes" | "mes-anterior" | "trimestre" | "anio";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "mes-anterior", label: "Mes anterior" },
  { value: "trimestre", label: "Últimos 3 meses" },
  { value: "anio", label: "Este año" },
];

export type Granularity = "dia" | "semana" | "mes";

/** Rango de fechas inclusivo (dd-MM-yyyy). */
export type PeriodRange = { from: string; to: string; granularity: Granularity };

const WEEK = { weekStartsOn: 1 } as const;

/** Rango del período elegido, a partir de hoy (dd-MM-yyyy). */
export function getPeriodRange(preset: PeriodPreset, today: string): PeriodRange {
  const date = parseAppDate(today) ?? new Date();
  switch (preset) {
    case "semana":
      return {
        from: toAppDate(startOfWeek(date, WEEK)),
        to: toAppDate(endOfWeek(date, WEEK)),
        granularity: "dia",
      };
    case "mes":
      return { from: toAppDate(startOfMonth(date)), to: toAppDate(endOfMonth(date)), granularity: "semana" };
    case "mes-anterior": {
      const previous = subMonths(date, 1);
      return {
        from: toAppDate(startOfMonth(previous)),
        to: toAppDate(endOfMonth(previous)),
        granularity: "semana",
      };
    }
    case "trimestre":
      return {
        from: toAppDate(startOfMonth(subMonths(date, 2))),
        to: toAppDate(endOfMonth(date)),
        granularity: "mes",
      };
    case "anio":
      return { from: toAppDate(startOfYear(date)), to: toAppDate(endOfYear(date)), granularity: "mes" };
  }
}

/**
 * Período anterior de la misma duración, para comparar: mes contra mes,
 * semana contra semana, trimestre contra trimestre y año contra año.
 */
export function getPreviousRange(range: PeriodRange): PeriodRange {
  const from = parseAppDate(range.from)!;
  const to = parseAppDate(range.to)!;
  const isWholeMonths =
    from.getDate() === 1 && toAppDate(endOfMonth(to)) === range.to && range.granularity !== "dia";
  if (isWholeMonths) {
    const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
    return {
      from: toAppDate(subMonths(from, months)),
      to: toAppDate(endOfMonth(subMonths(to, months))),
      granularity: range.granularity,
    };
  }
  const days = differenceInCalendarDays(to, from) + 1;
  return {
    from: toAppDate(addDays(from, -days)),
    to: toAppDate(addDays(to, -days)),
    granularity: range.granularity,
  };
}

export function isInRange(date: string, range: PeriodRange): boolean {
  return compareAppDates(date, range.from) >= 0 && compareAppDates(date, range.to) <= 0;
}

export type PeriodIndicators = {
  total: number;
  attended: number;
  absent: number;
  cancelled: number;
  /** Pendientes y confirmados (todavía no ocurrieron o falta registrar asistencia). */
  active: number;
  /** Pacientes distintos con al menos una sesión atendida. */
  patientsAttended: number;
  /** Cancelados sobre el total de turnos (0 a 1), o null sin turnos. */
  cancellationRate: number | null;
  /** Ausentes sobre las sesiones que tenían que ocurrir (atendidos + ausentes), o null. */
  absenceRate: number | null;
};

function countByStatus(appointments: Appointment[]): Record<AppointmentStatus, number> {
  const counts: Record<AppointmentStatus, number> = {
    pendiente: 0,
    confirmado: 0,
    atendido: 0,
    cancelado: 0,
    ausente: 0,
  };
  for (const appointment of appointments) counts[appointment.status] += 1;
  return counts;
}

export function computeIndicators(appointments: Appointment[], range: PeriodRange): PeriodIndicators {
  const inRange = appointments.filter((appointment) => isInRange(appointment.date, range));
  const counts = countByStatus(inRange);
  const total = inRange.length;
  const realized = counts.atendido + counts.ausente;
  return {
    total,
    attended: counts.atendido,
    absent: counts.ausente,
    cancelled: counts.cancelado,
    active: counts.pendiente + counts.confirmado,
    patientsAttended: new Set(
      inRange.filter((appointment) => appointment.status === "atendido").map((item) => item.patientId)
    ).size,
    cancellationRate: total > 0 ? counts.cancelado / total : null,
    absenceRate: realized > 0 ? counts.ausente / realized : null,
  };
}

/** Variación porcentual contra el período anterior (null si antes no había nada). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type ProfessionalIndicators = {
  professionalId: string;
  professionalName: string;
  total: number;
  attended: number;
  absent: number;
  cancelled: number;
  active: number;
};

/** Turnos del período por profesional, de mayor a menor cantidad. */
export function indicatorsByProfessional(
  appointments: Appointment[],
  range: PeriodRange
): ProfessionalIndicators[] {
  const rows = new Map<string, ProfessionalIndicators>();
  for (const appointment of appointments) {
    if (!isInRange(appointment.date, range)) continue;
    const row = rows.get(appointment.professionalId) ?? {
      professionalId: appointment.professionalId,
      professionalName: appointment.professionalName,
      total: 0,
      attended: 0,
      absent: 0,
      cancelled: 0,
      active: 0,
    };
    row.total += 1;
    if (appointment.status === "atendido") row.attended += 1;
    else if (appointment.status === "ausente") row.absent += 1;
    else if (appointment.status === "cancelado") row.cancelled += 1;
    else row.active += 1;
    rows.set(appointment.professionalId, row);
  }
  return [...rows.values()].sort(
    (a, b) => b.total - a.total || a.professionalName.localeCompare(b.professionalName, "es")
  );
}

export type TimelineBucket = {
  /** Etiqueta corta del eje: "lun 19", "sem. 19/10", "oct". */
  label: string;
  /** Rango completo del tramo, para el texto accesible. */
  title: string;
  attended: number;
  absent: number;
  cancelled: number;
};

/** Tramos del período (días, semanas o meses) con las sesiones de cada uno. */
export function getTimeline(appointments: Appointment[], range: PeriodRange): TimelineBucket[] {
  const from = parseAppDate(range.from)!;
  const to = parseAppDate(range.to)!;
  const buckets: (TimelineBucket & { start: string; end: string })[] = [];

  let cursor = from;
  while (cursor <= to) {
    let end: Date;
    let label: string;
    let title: string;
    if (range.granularity === "dia") {
      end = cursor;
      label = formatAppDate(toAppDate(cursor), "EEE d").replace(".", "");
      title = formatAppDate(toAppDate(cursor), "EEEE d 'de' MMMM");
    } else if (range.granularity === "semana") {
      end = endOfWeek(cursor, WEEK) > to ? to : endOfWeek(cursor, WEEK);
      label = formatAppDate(toAppDate(cursor), "d/MM");
      title = `Semana del ${formatAppDate(toAppDate(cursor), "d/MM")} al ${formatAppDate(toAppDate(end), "d/MM")}`;
    } else {
      end = endOfMonth(cursor) > to ? to : endOfMonth(cursor);
      label = formatAppDate(toAppDate(cursor), "MMM").replace(".", "");
      title = formatAppDate(toAppDate(cursor), "MMMM yyyy");
    }
    buckets.push({ start: toAppDate(cursor), end: toAppDate(end), label, title, attended: 0, absent: 0, cancelled: 0 });
    cursor = range.granularity === "mes" ? startOfMonth(addMonths(cursor, 1)) : addDays(end, 1);
  }

  for (const appointment of appointments) {
    const bucket = buckets.find(
      (item) => compareAppDates(appointment.date, item.start) >= 0 && compareAppDates(appointment.date, item.end) <= 0
    );
    if (!bucket) continue;
    if (appointment.status === "atendido") bucket.attended += 1;
    else if (appointment.status === "ausente") bucket.absent += 1;
    else if (appointment.status === "cancelado") bucket.cancelled += 1;
  }

  return buckets.map(({ label, title, attended, absent, cancelled }) => ({
    label,
    title,
    attended,
    absent,
    cancelled,
  }));
}

/** Sesiones atendidas en el período por obra social del paciente (Particular incluido). */
export function sessionsByInsurance(
  appointments: Appointment[],
  range: PeriodRange,
  insuranceByPatient: Map<string, string>
): { name: string; sessions: number }[] {
  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    if (appointment.status !== "atendido" || !isInRange(appointment.date, range)) continue;
    const name = insuranceByPatient.get(appointment.patientId) ?? "Particular";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, "es"));
}

export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function formatRangeLabel(range: PeriodRange): string {
  const sameYear = range.from.slice(-4) === range.to.slice(-4);
  const from = formatAppDate(range.from, sameYear ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy");
  const to = formatAppDate(range.to, "d 'de' MMMM 'de' yyyy");
  return `Del ${from} al ${to}`;
}
