import { AppointmentStatus } from "@/types";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
  ausente: "Ausente",
};

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

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status];
}
