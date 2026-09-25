import { isActiveAppointmentStatus } from "@/lib/appointment-status";
import { areSameAppDay } from "@/lib/date-utils";
import { normalizeTime } from "@/lib/time-utils";
import type { AppointmentStatus } from "@/types";

export type AppointmentNotificationType =
  | "creacion"
  | "confirmacion"
  | "reprogramacion"
  | "cancelacion"
  | "recordatorio";

/** Lo mínimo del turno que hace falta para decidir qué correo mandar. */
export type NotifiableAppointment = {
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
};

export type AppointmentNotificationEvent = {
  type: AppointmentNotificationType;
  /** A qué versión del turno (y a qué paciente) corresponde el correo. */
  target: "previous" | "next";
};

function slotChanged(previous: NotifiableAppointment, next: NotifiableAppointment) {
  return (
    previous.professionalId !== next.professionalId ||
    !areSameAppDay(previous.date, next.date) ||
    normalizeTime(previous.time) !== normalizeTime(next.time)
  );
}

/**
 * Correos que dispara una escritura de turno (RF05). `previous` es null en el alta.
 * - Alta de un turno activo: creación (con los datos del turno y su estado).
 * - Pasa a cancelado: cancelación.
 * - Cambia fecha, hora o profesional: reprogramación (si además se confirma,
 *   el mismo correo muestra el estado nuevo).
 * - Pendiente → confirmado sin moverlo: confirmación.
 * - Cambia el paciente: cancelación al anterior y creación al nuevo.
 * Atendido, ausente y los cambios de tipo de sesión u observaciones no avisan.
 */
export function getAppointmentNotificationEvents(
  previous: NotifiableAppointment | null,
  next: NotifiableAppointment
): AppointmentNotificationEvent[] {
  if (!previous) {
    return isActiveAppointmentStatus(next.status)
      ? [{ type: "creacion", target: "next" }]
      : [];
  }

  if (!isActiveAppointmentStatus(previous.status)) return [];

  if (next.status === "cancelado") {
    return [{ type: "cancelacion", target: "previous" }];
  }

  if (!isActiveAppointmentStatus(next.status)) return [];

  if (previous.patientId !== next.patientId) {
    return [
      { type: "cancelacion", target: "previous" },
      { type: "creacion", target: "next" },
    ];
  }

  if (slotChanged(previous, next)) {
    return [{ type: "reprogramacion", target: "next" }];
  }

  if (previous.status !== "confirmado" && next.status === "confirmado") {
    return [{ type: "confirmacion", target: "next" }];
  }

  return [];
}

/** Recordatorio: turnos activos que empiezan dentro de esta ventana. */
export const REMINDER_HOURS_BEFORE = 24;
/** Si faltan menos horas que esto, no tiene sentido recordar (el turno es inminente). */
export const REMINDER_MIN_HOURS_BEFORE = 2;

export function getReminderWindow(now: Date): { from: Date; to: Date } {
  const hour = 60 * 60 * 1000;
  return {
    from: new Date(now.getTime() + REMINDER_MIN_HOURS_BEFORE * hour),
    to: new Date(now.getTime() + REMINDER_HOURS_BEFORE * hour),
  };
}

/** Un solo recordatorio por turno y horario: si se reprograma, corresponde otro. */
export function getReminderKey(appointmentId: string, date: string, time: string) {
  return `recordatorio:${appointmentId}:${date}:${normalizeTime(time)}`;
}
