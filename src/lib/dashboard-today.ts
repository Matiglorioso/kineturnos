import { isActiveAppointmentStatus } from "@/lib/appointment-status";
import { compareAppDates, parseAppDate, toAppDate } from "@/lib/date-utils";
import { normalizeTime, timeToMinutes } from "@/lib/time-utils";
import type { Appointment } from "@/types";
import { addDays } from "date-fns";

/** Cuántos días hacia atrás se buscan asistencias sin registrar. */
export const PENDING_ATTENDANCE_LOOKBACK_DAYS = 30;

function byDateAndTime(a: Appointment, b: Appointment): number {
  return compareAppDates(a.date, b.date) || timeToMinutes(a.time) - timeToMinutes(b.time);
}

/** Turnos del día, por horario (sin los cancelados). */
export function getDaySchedule(appointments: Appointment[], date: string): Appointment[] {
  return appointments
    .filter((appointment) => appointment.date === date && appointment.status !== "cancelado")
    .sort(byDateAndTime);
}

/**
 * Turnos que ya terminaron (día pasado, u hoy con la hora de fin cumplida) y
 * siguen pendientes o confirmados: falta registrar si el paciente vino.
 * Los más recientes primero, hasta 30 días atrás.
 */
export function getPendingAttendance(
  appointments: Appointment[],
  today: string,
  nowMinutes: number
): Appointment[] {
  const oldest = toAppDate(addDays(parseAppDate(today)!, -PENDING_ATTENDANCE_LOOKBACK_DAYS));
  return appointments
    .filter((appointment) => {
      if (!isActiveAppointmentStatus(appointment.status)) return false;
      const day = compareAppDates(appointment.date, today);
      if (day > 0 || compareAppDates(appointment.date, oldest) < 0) return false;
      // Hoy: recién cuando termina el turno (dura 1 hora).
      return day < 0 || timeToMinutes(normalizeTime(appointment.time)) + 60 <= nowMinutes;
    })
    .sort((a, b) => byDateAndTime(b, a));
}

/** Próximo día de atención (el consultorio no atiende los domingos). */
export function getNextWorkday(today: string): string {
  let date = addDays(parseAppDate(today)!, 1);
  if (date.getDay() === 0) date = addDays(date, 1);
  return toAppDate(date);
}

/** Turnos pendientes (sin confirmar) de un día, por horario. */
export function getUnconfirmed(appointments: Appointment[], date: string): Appointment[] {
  return appointments
    .filter((appointment) => appointment.date === date && appointment.status === "pendiente")
    .sort(byDateAndTime);
}

export type TodaySummary = {
  total: number;
  attended: number;
  /** Turnos de hoy que todavía no empezaron. */
  upcoming: number;
};

export function summarizeDay(schedule: Appointment[], nowMinutes: number): TodaySummary {
  return {
    total: schedule.length,
    attended: schedule.filter((appointment) => appointment.status === "atendido").length,
    upcoming: schedule.filter(
      (appointment) =>
        isActiveAppointmentStatus(appointment.status) &&
        timeToMinutes(normalizeTime(appointment.time)) > nowMinutes
    ).length,
  };
}

/** Saludo según la hora del consultorio. */
export function greetingFor(nowMinutes: number): string {
  if (nowMinutes < 12 * 60) return "Buen día";
  if (nowMinutes < 20 * 60) return "Buenas tardes";
  return "Buenas noches";
}

/** Teléfono para un link `tel:` (solo dígitos y +). */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
