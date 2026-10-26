import { fetchJson } from "@/lib/api/fetch-json";
import type { UserFormValues } from "@/lib/user-form";
import type { AppUser } from "@/types";

export interface UserWithTemporaryPassword {
  user: AppUser;
  temporaryPassword: string;
}

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export async function fetchUsers(): Promise<AppUser[]> {
  return fetchJson<AppUser[]>("/api/users");
}

export async function createUserRequest(values: UserFormValues): Promise<UserWithTemporaryPassword> {
  return fetchJson<UserWithTemporaryPassword>("/api/users", jsonInit("POST", values));
}

export async function updateUserRequest(
  id: string,
  values: UserFormValues & { active?: boolean }
): Promise<AppUser> {
  return fetchJson<AppUser>(`/api/users/${encodeURIComponent(id)}`, jsonInit("PATCH", values));
}

export async function resetUserPasswordRequest(id: string): Promise<UserWithTemporaryPassword> {
  return fetchJson<UserWithTemporaryPassword>(`/api/users/${encodeURIComponent(id)}/password`, jsonInit("POST"));
}

export async function changeOwnPasswordRequest(currentPassword: string, newPassword: string): Promise<void> {
  await fetchJson<{ ok: true }>("/api/account/password", jsonInit("POST", { currentPassword, newPassword }));
}
