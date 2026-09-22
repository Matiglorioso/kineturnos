import { APPOINTMENT_SLOT_DURATION_MINUTES } from "@/lib/appointment-constants";
import { areSameAppDay } from "@/lib/date-utils";
import { formatAppointmentTimeRange } from "@/lib/datetime-format";
import { professionalWorksOnDay } from "@/lib/professional-schedule";
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
    const existingEnd = existingStart + appointment.duration;

    return intervalsOverlap(newStart, newEnd, existingStart, existingEnd);
  });
}

export type HourlySlotOption = {
  startTime: string;
  label: string;
  available: boolean;
};

/** Inicios de bloque de 1 h dentro del horario laboral del profesional. */
export function getProfessionalHourlySlotStarts(
  professional: Professional
): string[] {
  const scheduleStart = timeToMinutes(professional.scheduleStart);
  const scheduleEnd = timeToMinutes(professional.scheduleEnd);
  const slots: string[] = [];

  for (
    let start = scheduleStart;
    start + APPOINTMENT_SLOT_DURATION_MINUTES <= scheduleEnd;
    start += APPOINTMENT_SLOT_DURATION_MINUTES
  ) {
    slots.push(minutesToTime(start));
  }

  return slots;
}

export function formatHourlySlotLabel(startTime: string): string {
  return formatAppointmentTimeRange(
    startTime,
    APPOINTMENT_SLOT_DURATION_MINUTES
  );
}

/** Bloques hora a hora para un profesional en una fecha, marcando ocupados. */
export function listHourlySlotOptions(
  professional: Professional | undefined,
  date: string,
  existingAppointments: Appointment[],
  excludeId?: string
): HourlySlotOption[] {
  if (!professional || !date || !professionalWorksOnDay(professional, date)) {
    return [];
  }

  return getProfessionalHourlySlotStarts(professional).map((startTime) => {
    const occupied = slotIsOccupied(
      existingAppointments,
      professional.id,
      date,
      startTime,
      excludeId
    );

    return {
      startTime,
      label: formatHourlySlotLabel(startTime),
      available: !occupied,
    };
  });
}

/** Incluye el horario actual al editar aunque no caiga en un bloque estándar. */
export function listHourlySlotOptionsForForm(
  professional: Professional | undefined,
  date: string,
  existingAppointments: Appointment[],
  options?: {
    excludeId?: string;
    currentTime?: string;
    currentDuration?: number;
  }
): HourlySlotOption[] {
  const base = listHourlySlotOptions(
    professional,
    date,
    existingAppointments,
    options?.excludeId
  );

  const currentTime = options?.currentTime
    ? normalizeTime(options.currentTime)
    : null;

  if (!currentTime) return base;

  if (base.some((slot) => slot.startTime === currentTime)) {
    return base;
  }

  const duration = options?.currentDuration ?? APPOINTMENT_SLOT_DURATION_MINUTES;
  return [
    {
      startTime: currentTime,
      label: `${formatAppointmentTimeRange(currentTime, duration)} (actual)`,
      available: true,
    },
    ...base,
  ];
}

export function isValidHourlySlotStart(
  professional: Professional | undefined,
  startTime: string
): boolean {
  if (!professional) return false;
  const normalized = normalizeTime(startTime);
  return getProfessionalHourlySlotStarts(professional).includes(normalized);
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
