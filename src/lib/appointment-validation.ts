import { APPOINTMENT_SLOT_DURATION_MINUTES } from "@/lib/appointment-constants";
import {
  isValidHourlySlotStart,
} from "@/lib/appointment-slots";
import {
  APP_DATE_FORMAT,
  areSameAppDay,
  getNowAppMinutes,
  getTodayAppDate,
  isFutureAppDate,
  isPastAppDate,
  isTodayAppDate,
  isValidAppDate,
} from "@/lib/date-utils";
import { validateProfessionalAppointmentSlot } from "@/lib/professional-schedule";
import { normalizeTime } from "@/lib/time-utils";
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

function hasBlockingOverlap(
  appointments: Appointment[],
  isSameOwner: (appointment: Appointment) => boolean,
  date: string,
  startTime: string,
  excludeId?: string
): boolean {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + APPOINTMENT_SLOT_DURATION_MINUTES;

  return appointments.some((appointment) => {
    if (appointment.id === excludeId) return false;
    if (!isSameOwner(appointment)) return false;
    if (!areSameAppDay(appointment.date, date)) return false;
    if (!BLOCKING_STATUSES.has(appointment.status)) return false;

    const existingStart = timeToMinutes(appointment.time);
    const existingEnd = existingStart + APPOINTMENT_SLOT_DURATION_MINUTES;

    return intervalsOverlap(newStart, newEnd, existingStart, existingEnd);
  });
}

/** Detecta solapamiento con otros turnos del mismo profesional en la misma fecha. */
export function hasProfessionalOverlap(
  appointments: Appointment[],
  professionalId: string,
  date: string,
  startTime: string,
  excludeId?: string
): boolean {
  return hasBlockingOverlap(
    appointments,
    (appointment) => appointment.professionalId === professionalId,
    date,
    startTime,
    excludeId
  );
}

/** Detecta si el paciente ya tiene otro turno (con cualquier profesional) en ese horario. */
export function hasPatientOverlap(
  appointments: Appointment[],
  patientId: string,
  date: string,
  startTime: string,
  excludeId?: string
): boolean {
  return hasBlockingOverlap(
    appointments,
    (appointment) => appointment.patientId === patientId,
    date,
    startTime,
    excludeId
  );
}

export const APPOINTMENT_OVERLAP_ERROR =
  "El profesional ya tiene un turno en ese horario. Elegí otro horario o profesional.";

export const APPOINTMENT_PATIENT_OVERLAP_ERROR =
  "El paciente ya tiene otro turno en ese horario.";

export const APPOINTMENT_FUTURE_STATUS_ERROR =
  "Un turno futuro no puede marcarse como atendido o ausente.";

export const APPOINTMENT_PAST_TIME_ERROR =
  "Ese horario ya pasó. Elegí un horario posterior a la hora actual.";

export type AppointmentFormInput = {
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  sessionType: string;
  status: string;
};

export type AppointmentFormErrors = Partial<
  Record<keyof AppointmentFormInput | "overlap" | "schedule", string>
>;

export type ValidateAppointmentFormOptions = {
  previousDate?: string;
  previousTime?: string;
  previousProfessionalId?: string;
  /** Momento de referencia para "hoy" (inyectable en tests). */
  now?: Date;
};

/** Estados permitidos según si la fecha es futura, hoy o pasada. */
export function getStatusOptionsForAppointmentDate(
  dateStr: string,
  now: Date = new Date()
): AppointmentStatus[] {
  if (!isValidAppDate(dateStr) || isFutureAppDate(dateStr, now)) {
    return ["pendiente", "confirmado", "cancelado"];
  }

  return ["pendiente", "confirmado", "atendido", "cancelado", "ausente"];
}

/**
 * Reglas de un cambio de solo estado (sin tocar fecha, hora ni profesional).
 * No revalida la agenda del profesional: el turno ya existe aunque su día u
 * horario hayan cambiado después. Solo al reactivar un cancelado/ausente se
 * vuelve a ocupar el horario, y ahí sí se chequea solapamiento.
 */
export function validateAppointmentStatusChange(
  existing: Appointment,
  status: AppointmentStatus,
  appointments: Appointment[],
  now: Date = new Date()
): AppointmentFormErrors {
  const errors: AppointmentFormErrors = {};

  if (
    (status === "atendido" || status === "ausente") &&
    isFutureAppDate(existing.date, now)
  ) {
    errors.status = APPOINTMENT_FUTURE_STATUS_ERROR;
    return errors;
  }

  const reactivates =
    !BLOCKING_STATUSES.has(existing.status) && BLOCKING_STATUSES.has(status);
  if (!reactivates) return errors;

  const time = normalizeTime(existing.time);

  if (
    hasProfessionalOverlap(
      appointments,
      existing.professionalId,
      existing.date,
      time,
      existing.id
    )
  ) {
    errors.overlap = APPOINTMENT_OVERLAP_ERROR;
  } else if (
    hasPatientOverlap(
      appointments,
      existing.patientId,
      existing.date,
      time,
      existing.id
    )
  ) {
    errors.overlap = APPOINTMENT_PATIENT_OVERLAP_ERROR;
  }

  return errors;
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
  const now = options?.now ?? new Date();
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
    errors.date = `Usá el formato ${APP_DATE_FORMAT} (ej: ${getTodayAppDate(now)})`;
  } else if (isPastAppDate(values.date, now)) {
    if (!isEditing) {
      errors.date = "No se pueden crear turnos en fechas pasadas";
    } else if (dateChanged) {
      errors.date = "No se puede mover un turno a una fecha pasada";
    }
  }

  // Editar sin mover el turno (mismo profesional, día y hora) no lo revalida
  // contra la agenda actual: el profesional pudo cambiar días u horario después.
  const keepsExistingSlot =
    isEditing &&
    options?.previousProfessionalId === values.professionalId &&
    previousDate !== undefined &&
    options?.previousTime !== undefined &&
    values.time !== "" &&
    areSameAppDay(values.date, previousDate) &&
    normalizeTime(values.time) === normalizeTime(options.previousTime);

  if (!values.time) {
    errors.time = "Elegí un horario";
  } else if (
    !keepsExistingSlot &&
    professional &&
    values.date &&
    isValidAppDate(values.date) &&
    !errors.date &&
    !isValidHourlySlotStart(values.time)
  ) {
    errors.time =
      "Elegí un bloque horario válido (cada turno dura 1 hora).";
  }

  // Al editar sin mover el turno (misma fecha y hora) se permite aunque ya haya empezado.
  const timeChanged =
    isEditing &&
    options?.previousTime !== undefined &&
    values.time !== "" &&
    normalizeTime(values.time) !== normalizeTime(options.previousTime);
  const slotChanged = !isEditing || Boolean(dateChanged) || timeChanged;

  if (
    slotChanged &&
    values.time &&
    !errors.date &&
    !errors.time &&
    isTodayAppDate(values.date, now) &&
    timeToMinutes(values.time) < getNowAppMinutes(now)
  ) {
    errors.time = APPOINTMENT_PAST_TIME_ERROR;
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
    isFutureAppDate(values.date, now) &&
    (values.status === "atendido" || values.status === "ausente")
  ) {
    errors.status = APPOINTMENT_FUTURE_STATUS_ERROR;
  }

  if (
    values.professionalId &&
    values.date &&
    values.time &&
    !errors.date &&
    !errors.time
  ) {
    const overlaps = hasProfessionalOverlap(
      existingAppointments,
      values.professionalId,
      values.date,
      normalizeTime(values.time),
      excludeId
    );

    if (overlaps) {
      errors.overlap = APPOINTMENT_OVERLAP_ERROR;
    } else if (
      values.patientId &&
      hasPatientOverlap(
        existingAppointments,
        values.patientId,
        values.date,
        normalizeTime(values.time),
        excludeId
      )
    ) {
      errors.overlap = APPOINTMENT_PATIENT_OVERLAP_ERROR;
    }

    const scheduleErrors = keepsExistingSlot
      ? {}
      : validateProfessionalAppointmentSlot(
          professional,
          values.date,
          normalizeTime(values.time)
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
