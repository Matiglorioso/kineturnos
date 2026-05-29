import {
  validateProfessionalForm,
  type ProfessionalFormValues,
} from "@/lib/professional-form";
import type { ProfessionalWriteInput } from "@/lib/db/professional-write";
import type { WeekDay } from "@/types";

export function parseProfessionalWriteInput(body: unknown): {
  input?: ProfessionalWriteInput;
  error?: string;
} {
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

  const validationErrors = validateProfessionalForm(values);
  const errorMessages = Object.values(validationErrors).filter(Boolean);

  if (errorMessages.length > 0) {
    return { error: errorMessages[0] };
  }

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
