import { fetchJson } from "@/lib/api/fetch-json";
import type {
  ClinicalEntry,
  ClinicalHistory,
} from "@/types";

/** Alta: fecha, profesional y evolución (o el turno de la agenda). Corrección: solo la evolución. */
export type ClinicalEntryRequest = {
  appointmentId?: string | null;
  /** dd-MM-yyyy; sin turno, la de la sesión (hoy por defecto). */
  date?: string | null;
  evolution: string;
  /** Solo si quien carga no es profesional y la sesión no tiene turno. */
  professionalId?: string | null;
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
