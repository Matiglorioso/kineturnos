import { APPOINTMENT_SLOT_DURATION_MINUTES } from "@/lib/appointment-constants";
import {
  validateAppointmentForm,
  type AppointmentFormInput,
  type ValidateAppointmentFormOptions,
} from "@/lib/appointment-validation";
import type { AppointmentWriteInput } from "@/lib/db/appointment-write";
import type { AppointmentStatus, SessionType } from "@/types";

/** Al editar, excludeId + previousDate evitan validar el turno como alta. */
export type ParseAppointmentWriteOptions = ValidateAppointmentFormOptions & {
  excludeId?: string;
};

export function parseAppointmentWriteInput(
  body: unknown,
  options?: ParseAppointmentWriteOptions
): {
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
    duration: String(payload.duration ?? APPOINTMENT_SLOT_DURATION_MINUTES),
    sessionType: String(payload.sessionType ?? ""),
    status: String(payload.status ?? "pendiente"),
  };

  const validationErrors = validateAppointmentForm(
    values,
    [],
    [],
    options?.excludeId,
    { previousDate: options?.previousDate }
  );
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
    duration: APPOINTMENT_SLOT_DURATION_MINUTES,
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
