import type { RolUsuario } from "@prisma/client";

export type Permission =
  | "appointments:read"
  | "appointments:write"
  | "appointments:status"
  | "patients:read"
  | "patients:write"
  | "patients:delete"
  | "professionals:read"
  | "professionals:write"
  | "professionals:delete";

const ALL_PERMISSIONS: Permission[] = [
  "appointments:read",
  "appointments:write",
  "appointments:status",
  "patients:read",
  "patients:write",
  "patients:delete",
  "professionals:read",
  "professionals:write",
  "professionals:delete",
];

const ROLE_PERMISSIONS: Record<RolUsuario, readonly Permission[]> = {
  admin: ALL_PERMISSIONS,
  recepcion: [
    "appointments:read",
    "appointments:write",
    "appointments:status",
    "patients:read",
    "patients:write",
    "patients:delete",
    "professionals:read",
  ],
  profesional: [
    "appointments:read",
    "appointments:status",
    "patients:read",
    "professionals:read",
  ],
};

/** Rutas de página permitidas por rol (además de públicas). */
const ROLE_PAGE_PREFIXES: Record<RolUsuario, readonly string[]> = {
  admin: ["/", "/agenda", "/pacientes", "/profesionales", "/proyecto"],
  recepcion: ["/", "/agenda", "/pacientes", "/profesionales", "/proyecto"],
  profesional: ["/", "/agenda", "/pacientes", "/proyecto"],
};

export function hasPermission(
  role: RolUsuario,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessPage(role: RolUsuario, pathname: string): boolean {
  const allowed = ROLE_PAGE_PREFIXES[role];

  return allowed.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export function canScheduleAppointments(role: RolUsuario): boolean {
  return hasPermission(role, "appointments:write");
}

export function canManagePatients(role: RolUsuario): boolean {
  return hasPermission(role, "patients:write");
}

export function canManageProfessionals(role: RolUsuario): boolean {
  return hasPermission(role, "professionals:write");
}

export function isScopedToOwnProfessional(role: RolUsuario): boolean {
  return role === "profesional";
}
