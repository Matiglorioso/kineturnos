import { fetchJson } from "@/lib/api/fetch-json";
import { patientToWriteInput } from "@/lib/db/patient-write";
import type { Patient } from "@/types";

function toRequestBody(patient: Patient) {
  const input = patientToWriteInput(patient);

  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    dni: input.dni,
    phone: input.phone,
    email: input.email ?? "",
    insurance: input.insurance === "Particular" ? "" : input.insurance,
    status: input.status,
    notes: input.notes ?? "",
    lastAppointment: input.lastAppointment,
    createdAt: input.createdAt,
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  return fetchJson<Patient[]>("/api/patients");
}

export async function createPatientRequest(patient: Patient): Promise<Patient> {
  return fetchJson<Patient>("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(patient)),
  });
}

export async function updatePatientRequest(patient: Patient): Promise<Patient> {
  return fetchJson<Patient>(`/api/patients/${patient.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(patient)),
  });
}

export async function deletePatientRequest(id: string): Promise<void> {
  await fetchJson<{ id: string }>(`/api/patients/${id}`, {
    method: "DELETE",
  });
}
