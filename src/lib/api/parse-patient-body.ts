import {
  validatePatientForm,
  type PatientFormValues,
} from "@/lib/patient-form";
import type { PatientWriteInput } from "@/lib/db/patient-write";
import type { PatientStatus } from "@/types";

export function parsePatientWriteInput(body: unknown): {
  input?: PatientWriteInput;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;

  const values: PatientFormValues = {
    firstName: String(payload.firstName ?? ""),
    lastName: String(payload.lastName ?? ""),
    dni: String(payload.dni ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    insurance: String(payload.insurance ?? ""),
    status: (payload.status as PatientStatus) ?? "activo",
    notes: String(payload.notes ?? ""),
  };

  const validationErrors = validatePatientForm(values);
  const errorMessages = Object.values(validationErrors).filter(Boolean);

  if (errorMessages.length > 0) {
    return { error: errorMessages[0] };
  }

  const input: PatientWriteInput = {
    id: typeof payload.id === "string" ? payload.id : undefined,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dni: values.dni.trim(),
    phone: values.phone.trim(),
    email: values.email.trim() || undefined,
    insurance: values.insurance.trim() || "Particular",
    status: values.status,
    notes: values.notes.trim() || undefined,
    lastAppointment:
      typeof payload.lastAppointment === "string"
        ? payload.lastAppointment
        : undefined,
    createdAt:
      typeof payload.createdAt === "string" ? payload.createdAt : undefined,
  };

  return { input };
}
