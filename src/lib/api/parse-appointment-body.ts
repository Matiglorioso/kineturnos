import {
  validateAppointmentForm,
  type AppointmentFormInput,
} from "@/lib/appointment-validation";
import type { AppointmentWriteInput } from "@/lib/db/appointment-write";
import type { AppointmentStatus, SessionType } from "@/types";

export function parseAppointmentWriteInput(body: unknown): {
  input?: AppointmentWriteInput;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;

  const values: AppointmentFormInput = {
    patientId: String(payload.patientId ?? ""),
    professionalId: String(payload.professionalId ?? ""),
    date: String(payload.date ?? ""),
    time: String(payload.time ?? ""),
    duration: String(payload.duration ?? ""),
    sessionType: String(payload.sessionType ?? ""),
    status: String(payload.status ?? "pendiente"),
  };

  const validationErrors = validateAppointmentForm(values, [], [], undefined);
  const basicErrors = Object.fromEntries(
    Object.entries(validationErrors).filter(
      ([key]) => key !== "overlap" && key !== "schedule"
    )
  );
  const errorMessages = Object.values(basicErrors).filter(Boolean);

  if (errorMessages.length > 0) {
    return { error: errorMessages[0] };
  }

  const input: AppointmentWriteInput = {
    id: typeof payload.id === "string" ? payload.id : undefined,
    patientId: values.patientId,
    professionalId: values.professionalId,
    date: values.date.trim(),
    time: values.time.trim(),
    duration: Number(values.duration),
    status: values.status as AppointmentStatus,
    sessionType: values.sessionType as SessionType,
    notes: typeof payload.notes === "string" ? payload.notes : undefined,
  };

  return { input };
}

export function parseAppointmentStatusInput(body: unknown): {
  status?: AppointmentStatus;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const status = (body as Record<string, unknown>).status;

  if (
    status !== "pendiente" &&
    status !== "confirmado" &&
    status !== "atendido" &&
    status !== "cancelado" &&
    status !== "ausente"
  ) {
    return { error: "Estado de turno invalido." };
  }

  return { status };
}
