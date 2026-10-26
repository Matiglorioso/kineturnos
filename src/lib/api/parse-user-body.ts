import { firstFieldError, type ParseResult } from "@/lib/api/parse-result";
import type { UserWriteInput } from "@/lib/db/users";
import { USER_ROLES, validateUserForm, type UserFormValues } from "@/lib/user-form";
import type { RolUsuario } from "@prisma/client";

export function parseUserWriteInput(body: unknown): ParseResult<UserWriteInput> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }

  const payload = body as Record<string, unknown>;
  const role = String(payload.role ?? "");
  if (!USER_ROLES.includes(role as RolUsuario)) {
    return { error: "Perfil inválido", field: "role" };
  }
  if (payload.active !== undefined && typeof payload.active !== "boolean") {
    return { error: "Estado inválido", field: "active" };
  }

  const values: UserFormValues = {
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    role: role as RolUsuario,
    professionalId: typeof payload.professionalId === "string" ? payload.professionalId.trim() : "",
  };

  const invalid = firstFieldError(validateUserForm(values));
  if (invalid) return invalid;

  return {
    input: {
      id: typeof payload.id === "string" ? payload.id : undefined,
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      professionalId: values.role === "profesional" ? values.professionalId : null,
      active: payload.active as boolean | undefined,
    },
  };
}

export function parsePasswordChangeBody(
  body: unknown
): ParseResult<{ currentPassword: string; newPassword: string }> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud invalido." };
  }
  const payload = body as Record<string, unknown>;
  const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (!currentPassword) return { error: "Ingresá tu contraseña actual", field: "currentPassword" };
  if (!newPassword) return { error: "Ingresá la nueva contraseña", field: "newPassword" };
  return { input: { currentPassword, newPassword } };
}
