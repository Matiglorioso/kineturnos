import { fetchJson } from "@/lib/api/fetch-json";
import type {
  ClinicalAccessLogItem,
  ClinicalEntry,
  ClinicalHistory,
  ClinicalProfile,
  TreatmentGoal,
} from "@/types";

export type ClinicalEntryRequest = {
  appointmentId?: string | null;
  diagnosis: string;
  treatment: string;
  evolution: string;
};

const base = (patientId: string) => `/api/patients/${encodeURIComponent(patientId)}/historia`;

export function fetchClinicalHistory(patientId: string): Promise<ClinicalHistory> {
  return fetchJson<ClinicalHistory>(base(patientId));
}

export function createClinicalEntryRequest(
  patientId: string,
  body: ClinicalEntryRequest
): Promise<ClinicalEntry> {
  return fetchJson<ClinicalEntry>(base(patientId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateClinicalEntryRequest(
  patientId: string,
  entryId: string,
  body: ClinicalEntryRequest
): Promise<ClinicalEntry> {
  return fetchJson<ClinicalEntry>(`${base(patientId)}/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchClinicalAccessLog(patientId: string): Promise<ClinicalAccessLogItem[]> {
  return fetchJson<ClinicalAccessLogItem[]>(`${base(patientId)}/accesos`);
}

export function saveClinicalProfileRequest(
  patientId: string,
  body: { alerts: string; background: string }
): Promise<ClinicalProfile> {
  return fetchJson<ClinicalProfile>(`${base(patientId)}/ficha`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function createTreatmentGoalRequest(
  patientId: string,
  description: string
): Promise<TreatmentGoal> {
  return fetchJson<TreatmentGoal>(`${base(patientId)}/objetivos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
}

export function updateTreatmentGoalRequest(
  patientId: string,
  goalId: string,
  achieved: boolean
): Promise<TreatmentGoal> {
  return fetchJson<TreatmentGoal>(`${base(patientId)}/objetivos/${encodeURIComponent(goalId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ achieved }),
  });
}

export async function deleteTreatmentGoalRequest(patientId: string, goalId: string): Promise<void> {
  await fetchJson<{ id: string }>(`${base(patientId)}/objetivos/${encodeURIComponent(goalId)}`, {
    method: "DELETE",
  });
}
