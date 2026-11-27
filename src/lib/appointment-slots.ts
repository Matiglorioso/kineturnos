import {
  APPOINTMENT_SLOT_DURATION_MINUTES,
  CLINIC_OPENING_TIME,
  CLINIC_SCHEDULE_BLOCKS,
} from "@/lib/appointment-constants";
import { areSameAppDay, getNowAppMinutes, isTodayAppDate, isValidAppDate } from "@/lib/date-utils";
import { formatAppointmentTimeRange } from "@/lib/datetime-format";
import {
  professionalWorksOnDay,
  validateProfessionalAppointmentSlot,
} from "@/lib/professional-schedule";
import { minutesToTime, normalizeTime, timeToMinutes } from "@/lib/time-utils";
import type { Appointment, AppointmentStatus, Professional } from "@/types";

const BLOCKING_STATUSES = new Set<AppointmentStatus>([
  "pendiente",
  "confirmado",
  "atendido",
]);

function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

function slotIsOccupied(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  startTime: string,
  excludeId?: string
): boolean {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + APPOINTMENT_SLOT_DURATION_MINUTES;

  return appointments.some((appointment) => {
    if (appointment.id === excludeId) return false;
    if (appointment.professionalId !== professionalId) return false;
    if (!areSameAppDay(appointment.date, date)) return false;
    if (!BLOCKING_STATUSES.has(appointment.status)) return false;

    const existingStart = timeToMinutes(appointment.time);
    const existingEnd = existingStart + APPOINTMENT_SLOT_DURATION_MINUTES;

    return intervalsOverlap(newStart, newEnd, existingStart, existingEnd);
  });
}

export type HourlySlotOption = {
  startTime: string;
  label: string;
  available: boolean;
};

/** Inicios de bloque de 1 h dentro de cada tramo del horario del consultorio (igual para todos). */
export function getHourlySlotStarts(): string[] {
  const slots: string[] = [];

  for (const block of CLINIC_SCHEDULE_BLOCKS) {
    const blockEnd = timeToMinutes(block.end);
    for (
      let start = timeToMinutes(block.start);
      start + APPOINTMENT_SLOT_DURATION_MINUTES <= blockEnd;
      start += APPOINTMENT_SLOT_DURATION_MINUTES
    ) {
      slots.push(minutesToTime(start));
    }
  }

  return slots;
}

export function formatHourlySlotLabel(startTime: string): string {
  return formatAppointmentTimeRange(startTime);
}

/**
 * Bloques hora a hora para un profesional en una fecha, marcando ocupados y,
 * si la fecha es hoy, los que ya empezaron (salvo `keepStartTime`, el horario
 * actual de un turno que se está editando).
 */
export function listHourlySlotOptions(
  professional: Professional | undefined,
  date: string,
  existingAppointments: Appointment[],
  excludeId?: string,
  options?: { now?: Date; keepStartTime?: string }
): HourlySlotOption[] {
  if (!professional || !date || !professionalWorksOnDay(professional, date)) {
    return [];
  }

  const now = options?.now ?? new Date();
  const nowMinutes = isTodayAppDate(date, now) ? getNowAppMinutes(now) : null;

  return getHourlySlotStarts().map((startTime) => {
    const occupied = slotIsOccupied(
      existingAppointments,
      professional.id,
      date,
      startTime,
      excludeId
    );
    const alreadyStarted =
      nowMinutes !== null &&
      startTime !== options?.keepStartTime &&
      timeToMinutes(startTime) < nowMinutes;

    return {
      startTime,
      label: formatHourlySlotLabel(startTime),
      available: !occupied && !alreadyStarted,
    };
  });
}

/**
 * Por qué no hay ningún horario para elegir (null si hay alguno libre): que el profesional
 * no atiende ese día, que ya pasaron los horarios de hoy o que están todos ocupados.
 */
export function noSlotsReason(
  professional: Professional | undefined,
  date: string,
  options: HourlySlotOption[],
  now: Date = new Date()
): string | null {
  if (!professional || !isValidAppDate(date)) return null;
  if (options.some((option) => option.available)) return null;

  if (!professionalWorksOnDay(professional, date)) {
    return validateProfessionalAppointmentSlot(professional, date, CLINIC_OPENING_TIME).day ?? null;
  }

  const lastStart = getHourlySlotStarts().at(-1);
  if (isTodayAppDate(date, now) && lastStart && timeToMinutes(lastStart) < getNowAppMinutes(now)) {
    return "Ya pasaron todos los horarios de hoy. Elegí otra fecha.";
  }

  return `${professional.name} ya tiene ocupados todos los horarios de ese día. Elegí otra fecha u otro profesional.`;
}

/** Incluye el horario actual al editar aunque no caiga en un bloque estándar. */
export function listHourlySlotOptionsForForm(
  professional: Professional | undefined,
  date: string,
  existingAppointments: Appointment[],
  options?: {
    excludeId?: string;
    currentTime?: string;
    now?: Date;
  }
): HourlySlotOption[] {
  const currentTime = options?.currentTime
    ? normalizeTime(options.currentTime)
    : null;

  const base = listHourlySlotOptions(
    professional,
    date,
    existingAppointments,
    options?.excludeId,
    { now: options?.now, keepStartTime: currentTime ?? undefined }
  );

  if (!currentTime) return base;

  if (base.some((slot) => slot.startTime === currentTime)) {
    return base;
  }

  return [
    {
      startTime: currentTime,
      label: `${formatHourlySlotLabel(currentTime)} (actual)`,
      available: true,
    },
    ...base,
  ];
}

export function isValidHourlySlotStart(startTime: string): boolean {
  return getHourlySlotStarts().includes(normalizeTime(startTime));
}

/** True si el turno existente usa otro día que el seleccionado (para reset de horario). */
export function shouldResetSlotOnDateChange(
  previousDate: string | undefined,
  nextDate: string
): boolean {
  if (!previousDate) return false;
  return !areSameAppDay(previousDate, nextDate);
}

export { APPOINTMENT_SLOT_DURATION_MINUTES } from "@/lib/appointment-constants";
