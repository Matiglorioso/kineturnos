import {
  APP_DATE_FORMAT,
  areSameAppDay,
  getTodayAppDate,
  isPastAppDate,
  isValidAppDate,
} from "@/lib/date-utils";
import { validateProfessionalAppointmentSlot } from "@/lib/professional-schedule";
import { timeToMinutes } from "@/lib/time-utils";
import { Appointment, AppointmentStatus, Professional } from "@/types";

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

/** Detecta solapamiento con otros turnos del mismo profesional en la misma fecha. */
export function hasProfessionalOverlap(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeId?: string
): boolean {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + durationMinutes;

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

export const APPOINTMENT_OVERLAP_ERROR =
  "El profesional ya tiene un turno en ese horario. Elegí otro horario o profesional.";

export type AppointmentFormInput = {
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: string;
  sessionType: string;
  status: string;
};

export type AppointmentFormErrors = Partial<
  Record<keyof AppointmentFormInput | "overlap" | "schedule", string>
>;

/**
 * Validación compartida de alta/edición de turnos (UI + `assertAppointmentInputValid`).
 * Invariantes críticos (cubiertos por `appointment-validation.test.ts`):
 * 1) día de atención del profesional (`schedule` / `date` vía professional-schedule)
 * 2) sin solapamiento con turnos bloqueantes del mismo profesional (`overlap`)
 */
export function validateAppointmentForm(
  values: AppointmentFormInput,
  existingAppointments: Appointment[],
  professionals: Professional[],
  excludeId?: string
): AppointmentFormErrors {
  const errors: AppointmentFormErrors = {};
  const professional = professionals.find(
    (item) => item.id === values.professionalId
  );

  if (!values.patientId) {
    errors.patientId = "Seleccioná un paciente";
  }

  if (!values.professionalId) {
    errors.professionalId = "Seleccioná un profesional";
  }

  if (!values.date) {
    errors.date = "La fecha es obligatoria";
  } else if (!isValidAppDate(values.date)) {
    errors.date = `Usá el formato ${APP_DATE_FORMAT} (ej: ${getTodayAppDate()})`;
  } else if (isPastAppDate(values.date)) {
    errors.date = "No se pueden crear turnos en fechas pasadas";
  }

  if (!values.time) {
    errors.time = "La hora de inicio es obligatoria";
  }

  if (!values.duration) {
    errors.duration = "La duración es obligatoria";
  }

  if (!values.sessionType) {
    errors.sessionType = "Seleccioná un tipo de sesión";
  }

  if (!values.status) {
    errors.status = "Seleccioná un estado";
  }

  if (
    values.professionalId &&
    values.date &&
    values.time &&
    values.duration &&
    !errors.date &&
    !errors.time &&
    !errors.duration
  ) {
    const overlaps = hasProfessionalOverlap(
      existingAppointments,
      values.professionalId,
      values.date,
      values.time,
      Number(values.duration),
      excludeId
    );

    if (overlaps) {
      errors.overlap = APPOINTMENT_OVERLAP_ERROR;
    }

    const scheduleErrors = validateProfessionalAppointmentSlot(
      professional,
      values.date,
      values.time,
      Number(values.duration)
    );

    if (scheduleErrors.day) {
      errors.date = scheduleErrors.day;
    }

    if (scheduleErrors.schedule) {
      errors.schedule = scheduleErrors.schedule;
    }
  }

  return errors;
}
