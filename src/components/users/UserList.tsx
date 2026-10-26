"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { UserRoleBadge } from "@/components/users/UserRoleBadge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableCell, DataTableRow } from "@/components/ui/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatLastLogin } from "@/lib/user-list";
import { cn, getInitials } from "@/lib/utils";
import type { AppUser } from "@/types";
import { KeyRound, Lock, Pencil, Stethoscope, UserCheck, UserX, type LucideIcon } from "lucide-react";

export interface UserActions {
  onEdit: (user: AppUser) => void;
  onResetPassword: (user: AppUser) => void;
  onToggleActive: (user: AppUser) => void;
}

interface UserListProps extends UserActions {
  users: AppUser[];
  currentUserId: string | undefined;
  /** Un Administrador no gestiona usuarios Superadmin. */
  canManage: (user: AppUser) => boolean;
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = "default",
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* El span deja ver el tooltip aunque el botón esté deshabilitado. */}
        <span tabIndex={disabled ? 0 : -1} className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "h-9 w-9 text-slate-600",
              tone === "danger" ? "hover:bg-red-50 hover:text-red-600" : "hover:text-brand-700"
            )}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function UserActionButtons({
  user,
  isSelf,
  manageable,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UserActions & { user: AppUser; isSelf: boolean; manageable: boolean }) {
  if (!manageable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Lo gestiona un Superadmin
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <IconAction label="Editar" icon={Pencil} onClick={() => onEdit(user)} />
      <IconAction
        label={isSelf ? "Tu contraseña se cambia desde tu perfil" : "Restablecer contraseña"}
        icon={KeyRound}
        disabled={isSelf || !user.active}
        onClick={() => onResetPassword(user)}
      />
      <IconAction
        label={isSelf ? "No podés desactivar tu usuario" : user.active ? "Desactivar" : "Activar"}
        icon={user.active ? UserX : UserCheck}
        tone={user.active ? "danger" : "default"}
        disabled={isSelf}
        onClick={() => onToggleActive(user)}
      />
    </div>
  );
}

function UserIdentity({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
          user.active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
        )}
      >
        {getInitials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">
          {user.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(vos)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function LastLogin({ user }: { user: AppUser }) {
  return (
    <span className="text-slate-600">
      {formatLastLogin(user.lastLogin)}
      {user.mustChangePassword && (
        <span className="mt-0.5 block text-xs text-amber-700">Contraseña temporal pendiente</span>
      )}
    </span>
  );
}

export function UserList({ users, currentUserId, canManage, ...actions }: UserListProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="hidden lg:block">
        <DataTable headers={["Usuario", "Perfil", "Profesional vinculado", "Último ingreso", "Estado", "Acciones"]}>
          {users.map((user) => (
            <DataTableRow key={user.id}>
              <DataTableCell>
                <UserIdentity user={user} isSelf={user.id === currentUserId} />
              </DataTableCell>
              <DataTableCell>
                <UserRoleBadge role={user.role} />
              </DataTableCell>
              <DataTableCell className="text-slate-600">{user.professionalName ?? "—"}</DataTableCell>
              <DataTableCell>
                <LastLogin user={user} />
              </DataTableCell>
              <DataTableCell>
                <PatientStatusBadge active={user.active} />
              </DataTableCell>
              <DataTableCell>
                <UserActionButtons
                  user={user}
                  isSelf={user.id === currentUserId}
                  manageable={canManage(user)}
                  {...actions}
                />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="Usuarios">
        {users.map((user) => (
          <li
            key={user.id}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card",
              !user.active && "bg-slate-50/80"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <UserIdentity user={user} isSelf={user.id === currentUserId} />
              <PatientStatusBadge active={user.active} className="shrink-0" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Perfil</dt>
                <dd className="mt-1">
                  <UserRoleBadge role={user.role} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Último ingreso</dt>
                <dd className="mt-1">
                  <LastLogin user={user} />
                </dd>
              </div>
              {user.professionalName && (
                <div className="col-span-2 min-w-0">
                  <dt className="text-xs text-muted-foreground">Profesional vinculado</dt>
                  <dd className="mt-1 flex items-center gap-1.5 truncate text-slate-700">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {user.professionalName}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end border-t border-slate-100 pt-2">
              <UserActionButtons
                user={user}
                isSelf={user.id === currentUserId}
                manageable={canManage(user)}
                {...actions}
              />
            </div>
          </li>
        ))}
      </ul>
    </TooltipProvider>
  );
}
