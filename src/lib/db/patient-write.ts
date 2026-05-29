import { toAppDate } from "@/lib/date-utils";
import { normalizeDni } from "@/lib/document-validation";
import { resolveNameParts } from "@/lib/person-name";
import type { Patient, PatientStatus } from "@/types";

export interface PatientWriteInput {
  id?: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  insurance?: string;
  email?: string;
  notes?: string;
  status?: PatientStatus;
  lastAppointment?: string;
  createdAt?: string;
}

export function patientToWriteInput(patient: Patient): PatientWriteInput {
  const { firstName, lastName } = resolveNameParts(
    patient.name,
    patient.firstName,
    patient.lastName
  );

  return {
    id: patient.id,
    firstName,
    lastName,
    dni: patient.dni,
    phone: patient.phone,
    insurance: patient.insurance,
    email: patient.email,
    notes: patient.notes,
    status: patient.status,
    lastAppointment: patient.lastAppointment,
    createdAt: patient.createdAt,
  };
}

export function toPacienteWriteData(input: PatientWriteInput) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const dni = input.dni.trim();

  return {
    nombre: `${firstName} ${lastName}`,
    nombrePila: firstName,
    apellido: lastName,
    dni,
    dniNormalizado: normalizeDni(dni),
    telefono: input.phone.trim(),
    obraSocial: input.insurance?.trim() || "Particular",
    email: input.email?.trim() || null,
    observaciones: input.notes?.trim() || null,
    estado: input.status ?? "activo",
    ultimoTurno: input.lastAppointment ?? null,
    fechaAlta: input.createdAt ?? null,
  };
}

export function resolvePatientId(input: PatientWriteInput): string {
  return input.id?.trim() || `p-${Date.now()}`;
}

export function resolveCreatedAt(input: PatientWriteInput): string {
  return input.createdAt ?? toAppDate(new Date());
}
