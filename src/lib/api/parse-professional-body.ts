import {
  validateProfessionalForm,
  type ProfessionalFormValues,
} from "@/lib/professional-form";
import { WEEK_DAYS } from "@/lib/professional-utils";
import { isValidTime } from "@/lib/time-utils";
import { firstFieldError, type ParseResult } from "@/lib/api/parse-result";
import type { ProfessionalWriteInput } from "@/lib/db/professional-write";
import type { WeekDay } from "@/types";

/** Formato de campos que el formulario no puede producir mal, pero la API sí recibe. */
function formatError(
  values: ProfessionalFormValues
): { error: string; field: string } | undefined {
  const invalidDay = values.days.find(
    (day) => !(WEEK_DAYS as string[]).includes(day)
  );
  if (invalidDay !== undefined) {
    return { error: `Día de atención inválido: ${String(invalidDay)}`, field: "days" };
  }

  if (values.scheduleStart && !isValidTime(values.scheduleStart)) {
    return { error: "Hora de inicio inválida (usá HH:mm)", field: "scheduleStart" };
  }

  if (values.scheduleEnd && !isValidTime(values.scheduleEnd)) {
    return { error: "Hora de fin inválida (usá HH:mm)", field: "scheduleEnd" };
  }

  const duration = Number(values.defaultDuration);
  if (values.defaultDuration && (!Number.isInteger(duration) || duration <= 0)) {
    return {
      error: "La duración debe ser un número entero de minutos",
      field: "defaultDuration",
    };
  }

  return undefined;
}

export function parseProfessionalWriteInput(
  body: unknown
): ParseResult<ProfessionalWriteInput> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;

  const values: ProfessionalFormValues = {
    firstName: String(payload.firstName ?? ""),
    lastName: String(payload.lastName ?? ""),
    license: String(payload.license ?? ""),
    email: String(payload.email ?? ""),
    phone: String(payload.phone ?? ""),
    specialty: String(payload.specialty ?? ""),
    days: Array.isArray(payload.days) ? (payload.days as WeekDay[]) : [],
    scheduleStart: String(payload.scheduleStart ?? ""),
    scheduleEnd: String(payload.scheduleEnd ?? ""),
    defaultDuration: String(payload.defaultDuration ?? "45"),
    active: payload.active !== false,
    notes: String(payload.notes ?? ""),
  };

  const invalid =
    formatError(values) ?? firstFieldError(validateProfessionalForm(values));
  if (invalid) return invalid;

  const input: ProfessionalWriteInput = {
    id: typeof payload.id === "string" ? payload.id : undefined,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    license: values.license.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    specialty: values.specialty,
    days: values.days,
    scheduleStart: values.scheduleStart,
    scheduleEnd: values.scheduleEnd,
    defaultDuration: Number(values.defaultDuration),
    active: values.active,
    avatarColor:
      typeof payload.avatarColor === "string" ? payload.avatarColor : "brand",
    notes: values.notes.trim() || undefined,
  };

  return { input };
}
