"use client";

import { PatientStatusBadge } from "@/components/appointments/StatusBadge";
import { UserRoleBadge } from "@/components/users/UserRoleBadge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableCell, DataTableRow } from "@/components/ui/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatLastLogin } from "@/lib/user-list";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import { KeyRound, Lock, Pencil, UserCheck, UserX, type LucideIcon } from "lucide-react";
import { MobileList, MobileListRow, MobilePill } from "@/components/mobile/MobileUi";
import { BottomSheetContent, Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getRoleLabel } from "@/lib/auth/roles";
import { useState } from "react";

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
              tone === "danger" ? "hover:bg-red-50 hover:text-red-600" : "hover:text-brand-800"
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

/** "Hoy 08:52" → "hoy 08:52"; sin ingresos, "nunca ingresó". */
function lastLoginShort(iso: string | null): string {
  if (!iso) return "nunca ingresó";
  // Fechas de este año sin el año ("23-11"), como en el resto del celular.
  const year = String(new Date().getFullYear());
  const label = formatLastLogin(iso).replace(new RegExp(`^(\\d{2}-\\d{2})-${year}$`), "$1");
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** Acciones de un usuario en el celular: suben desde abajo, a lo ancho. */
function UserActionSheet({
  user,
  isSelf,
  manageable,
  close,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UserActions & { user: AppUser; isSelf: boolean; manageable: boolean; close: () => void }) {
  const run = (action: () => void) => {
    close();
    action();
  };
  return (
    <BottomSheetContent
      className="lg:hidden"
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.currentTarget as HTMLElement | null)?.focus();
      }}
    >
      <div className="space-y-1 px-1">
        <SheetTitle className="pr-0 text-lg">{user.name}</SheetTitle>
        <SheetDescription className="truncate">
          {user.email} · {getRoleLabel(user.role)}
          {user.professionalName && user.professionalName !== user.name ? ` · ${user.professionalName}` : ""}
        </SheetDescription>
      </div>
      {manageable ? (
        <div className="grid gap-2">
          <Button type="button" variant="outline" className="h-12 text-sm" onClick={() => run(() => onEdit(user))}>
            Editar usuario
          </Button>
          {!isSelf && user.active && (
            <Button
              type="button"
              variant="outline"
              className="h-12 text-sm"
              onClick={() => run(() => onResetPassword(user))}
            >
              Restablecer contraseña
            </Button>
          )}
          {!isSelf && (
            <Button
              type="button"
              variant="outline"
              className={cn("h-12 text-sm", user.active && "text-red-600 hover:text-red-700")}
              onClick={() => run(() => onToggleActive(user))}
            >
              {user.active ? "Desactivar" : "Activar"}
            </Button>
          )}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 px-1 pb-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Lo gestiona un Superadmin
        </p>
      )}
    </BottomSheetContent>
  );
}

export function UserList({ users, currentUserId, canManage, ...actions }: UserListProps) {
  const [selected, setSelected] = useState<AppUser | null>(null);
  return (
    <TooltipProvider delayDuration={200}>
      <div className="hidden lg:block">
        <DataTable headers={["Usuario", "Perfil", "Último ingreso", "Estado", "Acciones"]}>
          {users.map((user) => (
            <DataTableRow key={user.id}>
              <DataTableCell>
                <UserIdentity user={user} isSelf={user.id === currentUserId} />
              </DataTableCell>
              <DataTableCell>
                <UserRoleBadge role={user.role} />
              </DataTableCell>
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

      {/* Celular (boceto 11): una fila por usuario; al tocarlo, sus acciones desde abajo. */}
      <MobileList label="Usuarios" className="lg:hidden">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <MobileListRow
              key={user.id}
              ariaLabel={`Usuario ${user.name}`}
              title={
                <>
                  {user.name}
                  {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(vos)</span>}
                </>
              }
              detail={`${getRoleLabel(user.role)} · ${lastLoginShort(user.lastLogin)}`}
              trailing={
                !user.active ? (
                  <MobilePill tone="gray">Inactivo</MobilePill>
                ) : user.mustChangePassword ? (
                  <MobilePill tone="amber">Contraseña temporal</MobilePill>
                ) : undefined
              }
              onClick={() => setSelected(user)}
            />
          );
        })}
      </MobileList>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <UserActionSheet
            user={selected}
            isSelf={selected.id === currentUserId}
            manageable={canManage(selected)}
            close={() => setSelected(null)}
            {...actions}
          />
        )}
      </Sheet>
    </TooltipProvider>
  );
}
