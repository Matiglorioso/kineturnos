import type { RolUsuario } from "@prisma/client";

/**
 * Perfiles del consultorio: Administrador y Profesional. El Superadmin no es un
 * perfil: es el acceso técnico del equipo de desarrollo.
 */
const ROLE_LABELS: Record<RolUsuario, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  profesional: "Profesional",
};

/** Etiquetas que se guardaron en registros anteriores (auditoría, accesos a historias) y siguen siendo válidas. */
const LEGACY_ROLE_LABELS: Record<string, RolUsuario> = {
  Administración: "admin",
};

export function getRoleLabel(role: RolUsuario): string {
  return ROLE_LABELS[role];
}

/** Al revés: "Administrador" → "admin". Algunos registros guardan la etiqueta y no el código. */
export function roleFromLabel(label: string): RolUsuario | null {
  const entry = (Object.entries(ROLE_LABELS) as [RolUsuario, string][]).find(([, value]) => value === label);
  return entry ? entry[0] : (LEGACY_ROLE_LABELS[label] ?? null);
}
