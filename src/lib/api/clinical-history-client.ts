import { fetchJson } from "@/lib/api/fetch-json";
import type { ClinicalAccessLogItem, ClinicalEntry, ClinicalHistory } from "@/types";

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
