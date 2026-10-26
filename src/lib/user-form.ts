import type { AppUser } from "@/types";
import type { RolUsuario } from "@prisma/client";
import { emailValidationError, requiredFieldError } from "@/lib/validation";

export interface UserFormValues {
  name: string;
  email: string;
  role: RolUsuario;
  /** Profesional vinculado; obligatorio para el perfil Profesional. */
  professionalId: string;
}

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

export const INITIAL_USER_FORM: UserFormValues = {
  name: "",
  email: "",
  role: "profesional",
  professionalId: "",
};

export const USER_ROLES: RolUsuario[] = ["admin", "profesional", "superadmin"];

export const DUPLICATE_EMAIL_MESSAGE = "Ya existe un usuario con ese email";
export const DUPLICATE_PROFESSIONAL_MESSAGE = "Ese profesional ya tiene un usuario";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function buildUserFormValues(user: AppUser): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    professionalId: user.professionalId ?? "",
  };
}

export function validateUserForm(values: UserFormValues): UserFormErrors {
  const errors: UserFormErrors = {};

  const nameError = requiredFieldError(values.name, "El nombre es obligatorio");
  if (nameError) errors.name = nameError;

  const emailError =
    requiredFieldError(values.email, "El email es obligatorio") ?? emailValidationError(values.email);
  if (emailError) errors.email = emailError;

  if (!USER_ROLES.includes(values.role)) {
    errors.role = "Elegí un perfil";
  } else if (values.role === "profesional" && !values.professionalId) {
    errors.professionalId = "Elegí el profesional al que corresponde el acceso";
  }

  return errors;
}

/** Perfiles que puede asignar quien administra: solo un Superadmin crea o toca otro Superadmin. */
export function assignableRoles(actorRole: RolUsuario): RolUsuario[] {
  return actorRole === "superadmin" ? USER_ROLES : USER_ROLES.filter((role) => role !== "superadmin");
}

export function canManageUser(actorRole: RolUsuario, target: Pick<AppUser, "role">): boolean {
  return assignableRoles(actorRole).includes(target.role);
}

/**
 * Lo que nadie puede hacerse a sí mismo (para no quedarse sin acceso):
 * desactivarse ni cambiarse el perfil.
 */
export function selfEditError(
  actorId: string,
  target: Pick<AppUser, "id" | "role">,
  changes: { role?: RolUsuario; active?: boolean }
): string | undefined {
  if (actorId !== target.id) return undefined;
  if (changes.active === false) return "No podés desactivar tu propio usuario";
  if (changes.role && changes.role !== target.role) return "No podés cambiar tu propio perfil";
  return undefined;
}
