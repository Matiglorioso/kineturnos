import type { RolUsuario } from "@prisma/client";

const ROLE_LABELS: Record<RolUsuario, string> = {
  admin: "Administración",
  recepcion: "Recepción",
  profesional: "Profesional",
};

export function getRoleLabel(role: RolUsuario): string {
  return ROLE_LABELS[role];
}
