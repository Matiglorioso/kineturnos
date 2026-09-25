import {
  validatePatientForm,
  type PatientFormValues,
} from "@/lib/patient-form";
import { firstFieldError, type ParseResult } from "@/lib/api/parse-result";
import type { PatientWriteInput } from "@/lib/db/patient-write";
import type { PatientStatus } from "@/types";

const PATIENT_STATUSES: PatientStatus[] = ["activo", "inactivo"];

export function parsePatientWriteInput(
  body: unknown
): ParseResult<PatientWriteInput> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;
  const status = payload.status ?? "activo";

  if (!PATIENT_STATUSES.includes(status as PatientStatus)) {
    return { error: "Estado de paciente inválido", field: "status" };
  }

  const values: PatientFormValues = {
    firstName: String(payload.firstName ?? ""),
    lastName: String(payload.lastName ?? ""),
    dni: String(payload.dni ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    insurance: String(payload.insurance ?? ""),
    status: status as PatientStatus,
    notes: String(payload.notes ?? ""),
  };

  const invalid = firstFieldError(validatePatientForm(values));
  if (invalid) return invalid;

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
