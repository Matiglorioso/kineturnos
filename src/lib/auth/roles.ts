import type { RolUsuario } from "@prisma/client";

const ROLE_LABELS: Record<RolUsuario, string> = {
  superadmin: "Superadmin",
  admin: "Administración",
  profesional: "Profesional",
};

export function getRoleLabel(role: RolUsuario): string {
  return ROLE_LABELS[role];
}

/** Al revés: "Administración" → "admin". Algunos registros guardan la etiqueta y no el código. */
export function roleFromLabel(label: string): RolUsuario | null {
  const entry = (Object.entries(ROLE_LABELS) as [RolUsuario, string][]).find(([, value]) => value === label);
  return entry ? entry[0] : null;
}
