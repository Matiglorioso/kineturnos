import {
  APPOINTMENT_SLOT_DURATION_MINUTES,
  SESSION_TYPES,
} from "@/lib/appointment-constants";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/appointment-status";
import {
  validateAppointmentForm,
  type AppointmentFormInput,
  type ValidateAppointmentFormOptions,
} from "@/lib/appointment-validation";
import { firstFieldError, type ParseResult } from "@/lib/api/parse-result";
import { isValidTime } from "@/lib/time-utils";
import type { AppointmentWriteInput } from "@/lib/db/appointment-write";
import type { AppointmentStatus, SessionType } from "@/types";

/** Al editar, excludeId + previousDate evitan validar el turno como alta. */
export type ParseAppointmentWriteOptions = ValidateAppointmentFormOptions & {
  excludeId?: string;
};

/** Formato de campos que el formulario no puede producir mal, pero la API sí recibe. */
function formatError(
  values: AppointmentFormInput
): { error: string; field: string } | undefined {
  if (!(values.status in APPOINTMENT_STATUS_LABELS)) {
    return { error: "Estado de turno inválido", field: "status" };
  }

  if (
    values.sessionType &&
    !(SESSION_TYPES as string[]).includes(values.sessionType)
  ) {
    return { error: "Tipo de sesión inválido", field: "sessionType" };
  }

  if (values.time && !isValidTime(values.time)) {
    return { error: "Horario inválido (usá HH:mm)", field: "time" };
  }

  return undefined;
}

export function parseAppointmentWriteInput(
  body: unknown,
  options?: ParseAppointmentWriteOptions
): ParseResult<AppointmentWriteInput> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;

  const values: AppointmentFormInput = {
    patientId: String(payload.patientId ?? ""),
    professionalId: String(payload.professionalId ?? ""),
    date: String(payload.date ?? ""),
    time: String(payload.time ?? "").trim(),
    duration: String(payload.duration ?? APPOINTMENT_SLOT_DURATION_MINUTES),
    sessionType: String(payload.sessionType ?? ""),
    status: String(payload.status ?? "pendiente"),
  };

  const formatInvalid = formatError(values);
  if (formatInvalid) return formatInvalid;

  const { excludeId, ...validationOptions } = options ?? {};
  const validationErrors = validateAppointmentForm(
    values,
    [],
    [],
    excludeId,
    validationOptions
  );
  // Solapamiento y agenda del profesional se validan en la capa de DB, con datos reales.
  const { overlap, schedule, ...basicErrors } = validationErrors;
  void overlap;
  void schedule;

  const invalid = firstFieldError(basicErrors);
  if (invalid) return invalid;

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
