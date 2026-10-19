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
  | "professionals:delete"
  | "clinical:read"
  | "clinical:write"
  | "clinical:audit"
  | "insurances:read"
  | "insurances:write"
  | "users:manage";

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
  "clinical:read",
  "clinical:write",
  "clinical:audit",
  "insurances:read",
  "insurances:write",
  "users:manage",
];

/**
 * Perfiles de la tesis: Administrador (dueños y recepción) gestiona todo el
 * consultorio; Profesional ve su agenda y registra asistencia. Superadmin es
 * el acceso técnico del equipo de desarrollo: todo lo del Administrador, y a
 * futuro las tareas de mantenimiento.
 */
const ROLE_PERMISSIONS: Record<RolUsuario, readonly Permission[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  profesional: [
    "appointments:read",
    "appointments:status",
    "patients:read",
    "professionals:read",
    // Historia clínica: solo de pacientes con los que tiene turnos (canAccessClinicalHistory).
    "clinical:read",
    "clinical:write",
    // Ve la cobertura de sus pacientes; el catálogo y las autorizaciones los gestiona Administración.
    "insurances:read",
  ],
};

/** Rutas de página permitidas por rol (además de públicas). */
const ROLE_PAGE_PREFIXES: Record<RolUsuario, readonly string[]> = {
  superadmin: [
    "/",
    "/agenda",
    "/pacientes",
    "/profesionales",
    "/obras-sociales",
    "/usuarios",
    "/proyecto",
    "/cambiar-contrasena",
  ],
  admin: [
    "/",
    "/agenda",
    "/pacientes",
    "/profesionales",
    "/obras-sociales",
    "/usuarios",
    "/proyecto",
    "/cambiar-contrasena",
  ],
  profesional: ["/", "/agenda", "/pacientes", "/proyecto", "/cambiar-contrasena"],
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

/**
 * Historia clínica (tesis, RNF06): el Administrador accede a todas; el
 * Profesional, a la de los pacientes con los que tiene o tuvo un turno (no
 * cancelado), así puede cubrir a un compañero sin cambiar permisos.
 */
export function canAccessClinicalHistory(
  role: RolUsuario,
  hasAppointmentWithPatient: boolean
): boolean {
  if (!hasPermission(role, "clinical:read")) return false;
  return isScopedToOwnProfessional(role) ? hasAppointmentWithPatient : true;
}

export function isScopedToOwnProfessional(role: RolUsuario): boolean {
  return role === "profesional";
}
