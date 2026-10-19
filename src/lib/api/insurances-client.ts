import { fetchJson } from "@/lib/api/fetch-json";
import type {
  AttendanceReport,
  Authorization,
  AuthorizationState,
  Insurance,
  PatientCoverage,
} from "@/types";

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export type InsuranceRequest = { name: string; active: boolean; notes?: string };

export function fetchInsurances(): Promise<Insurance[]> {
  return fetchJson<Insurance[]>("/api/obras-sociales");
}

export function createInsuranceRequest(body: InsuranceRequest): Promise<Insurance> {
  return fetchJson<Insurance>("/api/obras-sociales", json("POST", body));
}

export function updateInsuranceRequest(id: string, body: InsuranceRequest): Promise<Insurance> {
  return fetchJson<Insurance>(`/api/obras-sociales/${encodeURIComponent(id)}`, json("PATCH", body));
}

export async function deleteInsuranceRequest(id: string): Promise<void> {
  await fetchJson<{ id: string }>(`/api/obras-sociales/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchAttendanceReport(insuranceId: string, month: string): Promise<AttendanceReport> {
  return fetchJson<AttendanceReport>(
    `/api/obras-sociales/${encodeURIComponent(insuranceId)}/planilla?mes=${encodeURIComponent(month)}`
  );
}

export type AuthorizationRequest = {
  number: string;
  state: AuthorizationState;
  sessions: number;
  validFrom: string;
  validUntil: string;
  notes: string;
};

const authorizationsUrl = (patientId: string) =>
  `/api/patients/${encodeURIComponent(patientId)}/autorizaciones`;

export function fetchPatientAuthorizations(
  patientId: string
): Promise<{ authorizations: Authorization[]; coverage: PatientCoverage }> {
  return fetchJson(authorizationsUrl(patientId));
}

export function createAuthorizationRequest(
  patientId: string,
  body: AuthorizationRequest
): Promise<Authorization> {
  return fetchJson<Authorization>(authorizationsUrl(patientId), json("POST", body));
}

export function updateAuthorizationRequest(
  patientId: string,
  authorizationId: string,
  body: AuthorizationRequest
): Promise<Authorization> {
  return fetchJson<Authorization>(
    `${authorizationsUrl(patientId)}/${encodeURIComponent(authorizationId)}`,
    json("PATCH", body)
  );
}

export async function deleteAuthorizationRequest(patientId: string, authorizationId: string): Promise<void> {
  await fetchJson<{ id: string }>(
    `${authorizationsUrl(patientId)}/${encodeURIComponent(authorizationId)}`,
    { method: "DELETE" }
  );
}
