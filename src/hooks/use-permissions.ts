"use client";

import {
  canManagePatients,
  canManageProfessionals,
  canScheduleAppointments,
  hasPermission,
  isScopedToOwnProfessional,
  type Permission,
} from "@/lib/auth/permissions";
import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const professionalId = session?.user?.professionalId ?? null;

  const can = (permission: Permission) =>
    role ? hasPermission(role, permission) : false;

  return {
    role,
    professionalId,
    isReady: Boolean(role),
    can,
    canSchedule: role ? canScheduleAppointments(role) : false,
    canManagePatients: role ? canManagePatients(role) : false,
    canManageProfessionals: role ? canManageProfessionals(role) : false,
    isScopedProfessional: role ? isScopedToOwnProfessional(role) : false,
  };
}
