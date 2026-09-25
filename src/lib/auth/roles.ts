import type { RolUsuario } from "@prisma/client";

const ROLE_LABELS: Record<RolUsuario, string> = {
  superadmin: "Superadmin",
  admin: "Administración",
  profesional: "Profesional",
};

export function getRoleLabel(role: RolUsuario): string {
  return ROLE_LABELS[role];
}
