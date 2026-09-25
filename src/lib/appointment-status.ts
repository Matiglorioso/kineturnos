import { AppointmentStatus } from "@/types";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
  ausente: "Ausente",
};

/** Turnos que aún comprometen la agenda; bloquean eliminar profesional. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pendiente",
  "confirmado",
];

/** Turnos históricos; pueden eliminarse en cascada al borrar el profesional. */
export const FINAL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "atendido",
  "cancelado",
  "ausente",
];

export function isActiveAppointmentStatus(status: AppointmentStatus): boolean {
  return ACTIVE_APPOINTMENT_STATUSES.includes(status);
}

export function isFinalAppointmentStatus(status: AppointmentStatus): boolean {
  return FINAL_APPOINTMENT_STATUSES.includes(status);
}

export const APPOINTMENT_STATUS_FILTERS: {
  value: AppointmentStatus | "todos";
  label: string;
}[] = [
  { value: "todos", label: "Todos" },
  ...(
    Object.entries(APPOINTMENT_STATUS_LABELS) as [AppointmentStatus, string][]
  ).map(([value, label]) => ({ value, label })),
];

export const APPOINTMENT_STATUS_FORM_OPTIONS = (
  Object.entries(APPOINTMENT_STATUS_LABELS) as [AppointmentStatus, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Máquina de estados del turno (diagrama de estados de la tesis): un turno
 * activo se confirma, se cancela o registra asistencia; los estados finales
 * (cancelado, atendido, ausente) no cambian más, solo se eliminan.
 */
const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pendiente: ["confirmado", "cancelado", "atendido", "ausente"],
  confirmado: ["cancelado", "atendido", "ausente"],
  atendido: [],
  cancelado: [],
  ausente: [],
};

/** Estados a los que puede pasar un turno. */
export function getNextAppointmentStatuses(
  status: AppointmentStatus
): AppointmentStatus[] {
  return [...APPOINTMENT_TRANSITIONS[status]];
}

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return from === to || getNextAppointmentStatuses(from).includes(to);
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}
