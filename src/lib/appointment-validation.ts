import {
  APPOINTMENT_DURATION_OPTIONS,
} from "@/lib/appointment-constants";
import {
  APP_DATE_FORMAT,
  areSameAppDay,
  getTodayAppDate,
  isFutureAppDate,
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

const VALID_DURATIONS = new Set<number>(APPOINTMENT_DURATION_OPTIONS);

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

export const APPOINTMENT_DURATION_INVALID_ERROR =
  "Elegí una duración válida: 30, 45, 60 o 90 minutos.";

export const APPOINTMENT_FUTURE_STATUS_ERROR =
  "Un turno futuro no puede marcarse como atendido o ausente.";

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

export type ValidateAppointmentFormOptions = {
  previousDate?: string;
};

export function isAllowedAppointmentDuration(duration: number): boolean {
  return (
    Number.isInteger(duration) &&
    duration > 0 &&
    VALID_DURATIONS.has(duration)
  );
}

/** Estados permitidos según si la fecha es futura, hoy o pasada. */
export function getStatusOptionsForAppointmentDate(
  dateStr: string
): AppointmentStatus[] {
  if (!isValidAppDate(dateStr) || isFutureAppDate(dateStr)) {
    return ["pendiente", "confirmado", "cancelado"];
  }

  return ["pendiente", "confirmado", "atendido", "cancelado", "ausente"];
}

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
  excludeId?: string,
  options?: ValidateAppointmentFormOptions
): AppointmentFormErrors {
  const errors: AppointmentFormErrors = {};
  const professional = professionals.find(
    (item) => item.id === values.professionalId
  );
  const isEditing = Boolean(excludeId);
  const previousDate = options?.previousDate;
  const dateChanged =
    isEditing &&
    previousDate !== undefined &&
    values.date &&
    !areSameAppDay(values.date, previousDate);

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
    if (!isEditing) {
      errors.date = "No se pueden crear turnos en fechas pasadas";
    } else if (dateChanged) {
      errors.date = "No se puede mover un turno a una fecha pasada";
    }
  }

  if (!values.time) {
    errors.time = "La hora de inicio es obligatoria";
  }

  const durationNum = Number(values.duration);
  if (!values.duration) {
    errors.duration = "La duración es obligatoria";
  } else if (!isAllowedAppointmentDuration(durationNum)) {
    errors.duration = APPOINTMENT_DURATION_INVALID_ERROR;
  }

  if (!values.sessionType) {
    errors.sessionType = "Seleccioná un tipo de sesión";
  }

  if (!values.status) {
    errors.status = "Seleccioná un estado";
  } else if (
    values.date &&
    isValidAppDate(values.date) &&
    !errors.date &&
    isFutureAppDate(values.date) &&
    (values.status === "atendido" || values.status === "ausente")
  ) {
    errors.status = APPOINTMENT_FUTURE_STATUS_ERROR;
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
      durationNum,
      excludeId
    );

    if (overlaps) {
      errors.overlap = APPOINTMENT_OVERLAP_ERROR;
    }

    const scheduleErrors = validateProfessionalAppointmentSlot(
      professional,
      values.date,
      values.time,
      durationNum
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
