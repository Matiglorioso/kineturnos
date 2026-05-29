import { fetchJson } from "@/lib/api/fetch-json";
import { professionalToWriteInput } from "@/lib/db/professional-write";
import type { Professional } from "@/types";

function toRequestBody(professional: Professional) {
  const input = professionalToWriteInput(professional);

  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    license: input.license,
    email: input.email ?? "",
    phone: input.phone ?? "",
    specialty: input.specialty,
    days: input.days,
    scheduleStart: input.scheduleStart,
    scheduleEnd: input.scheduleEnd,
    defaultDuration: String(input.defaultDuration),
    active: input.active,
    avatarColor: input.avatarColor,
    notes: input.notes ?? "",
  };
}

export async function fetchProfessionals(): Promise<Professional[]> {
  return fetchJson<Professional[]>("/api/professionals");
}

export async function createProfessionalRequest(
  professional: Professional
): Promise<Professional> {
  return fetchJson<Professional>("/api/professionals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(professional)),
  });
}

export async function updateProfessionalRequest(
  professional: Professional
): Promise<Professional> {
  return fetchJson<Professional>(`/api/professionals/${professional.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(professional)),
  });
}

export async function deleteProfessionalRequest(id: string): Promise<void> {
  await fetchJson<{ id: string }>(`/api/professionals/${id}`, {
    method: "DELETE",
  });
}
