"use client";

import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemporaryPasswordDialog } from "@/components/users/TemporaryPasswordDialog";
import { UserDialog } from "@/components/users/UserDialog";
import { UserList } from "@/components/users/UserList";
import { useProfessionals } from "@/hooks/use-professionals";
import { useUsers } from "@/hooks/use-users";
import {
  createUserRequest,
  resetUserPasswordRequest,
  updateUserRequest,
  type UserWithTemporaryPassword,
} from "@/lib/api/users-client";
import { getRoleLabel } from "@/lib/auth/roles";
import { pluralize } from "@/lib/pluralize";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { buildUserFormValues, canManageUser, USER_ROLES, type UserFormValues } from "@/lib/user-form";
import { ALL_ROLES, DEFAULT_USER_LIST_OPTIONS, filterUsers, type UserListOptions } from "@/lib/user-list";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import { Search, UserCog, UserPlus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { ListPagination } from "@/components/ui/ListPagination";
import { usePagination } from "@/hooks/use-pagination";

const STATUS_OPTIONS: { value: UserListOptions["status"]; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Desactivados" },
];

export default function UsuariosPage() {
  const { data: session } = useSession();
  const actor = session?.user;
  const { users, isLoading, error, refresh, upsertUser } = useUsers();
  const { professionals } = useProfessionals();
  const [options, setOptions] = useState<UserListOptions>(DEFAULT_USER_LIST_OPTIONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [presetProfessionalId, setPresetProfessionalId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<
    (UserWithTemporaryPassword & { reason: "alta" | "restablecida" }) | null
  >(null);
  const [toReset, setToReset] = useState<AppUser | null>(null);
  const [toDeactivate, setToDeactivate] = useState<AppUser | null>(null);

  // Atajos: /usuarios?nuevo=1 abre el alta; ?profesional=<id> abre el acceso de ese profesional
  // (su usuario si ya tiene, o el alta con el profesional elegido).
  useEffect(() => {
    if (isLoading) return;
    const params = new URLSearchParams(window.location.search);
    const professionalId = params.get("profesional");
    if (params.get("nuevo") !== "1" && !professionalId) return;

    const existing = professionalId ? users.find((user) => user.professionalId === professionalId) : undefined;
    setEditingUser(existing ?? null);
    setPresetProfessionalId(existing ? null : professionalId);
    setDialogOpen(true);
    window.history.replaceState(null, "", "/usuarios");
  }, [isLoading, users]);

  const filtered = useMemo(() => filterUsers(users, options), [users, options]);
  const pagination = usePagination(filtered, { storageKey: "usuarios", resetKey: JSON.stringify(options) });
  const activeCount = users.filter((user) => user.active).length;
  const isFiltering = options.search.trim() !== "" || options.role !== ALL_ROLES || options.status !== "todos";

  if (isLoading || !actor) {
    return <PageLoadingState title="Usuarios" description="Cargando usuarios..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Usuarios" description="Error al cargar" />
        <DataLoadError message={error} onRetry={() => void refresh()} />
      </div>
    );
  }

  const openCreate = () => {
    setEditingUser(null);
    setPresetProfessionalId(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      const updated = await updateUserRequest(editingUser.id, values);
      upsertUser(updated);
      showSuccessToast("Usuario actualizado", updated.name);
      return;
    }
    const created = await createUserRequest(values);
    upsertUser(created.user);
    setCredentials({ ...created, reason: "alta" });
  };

  const resetPassword = async (user: AppUser) => {
    try {
      const result = await resetUserPasswordRequest(user.id);
      upsertUser(result.user);
      setCredentials({ ...result, reason: "restablecida" });
    } catch (resetError) {
      showErrorToast("No se pudo restablecer", resetError instanceof Error ? resetError.message : undefined);
    }
  };

  const setActive = async (user: AppUser, active: boolean) => {
    try {
      const updated = await updateUserRequest(user.id, { ...buildUserFormValues(user), active });
      upsertUser(updated);
      showSuccessToast(active ? "Usuario activado" : "Usuario desactivado", updated.name);
    } catch (toggleError) {
      showErrorToast("No se pudo guardar", toggleError instanceof Error ? toggleError.message : undefined);
    }
  };

  const segment = (active: boolean) =>
    cn(
      "h-9 min-w-0 flex-1 gap-1.5 rounded-lg border-0 px-3 text-sm font-medium shadow-none focus:ring-2 sm:w-48 sm:flex-none",
      active ? "bg-background text-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description={`${pluralize(users.length, "usuario")} · ${pluralize(activeCount, "activo")}`}
        actionLabel="Nuevo usuario"
        actionIcon={UserPlus}
        onAction={openCreate}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, email o profesional…"
            aria-label="Buscar usuarios"
            value={options.search}
            onChange={(event) => setOptions((current) => ({ ...current, search: event.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div
            role="group"
            aria-label="Filtros de usuarios"
            className="flex w-full items-center gap-1 rounded-xl bg-muted p-1 sm:w-auto"
          >
            <Select
              value={options.role}
              onValueChange={(role) => setOptions((current) => ({ ...current, role: role as UserListOptions["role"] }))}
            >
              <SelectTrigger aria-label="Perfil" className={segment(options.role !== ALL_ROLES)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES}>Todos los perfiles</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={options.status}
              onValueChange={(status) =>
                setOptions((current) => ({ ...current, status: status as UserListOptions["status"] }))
              }
            >
              <SelectTrigger aria-label="Estado" className={segment(options.status !== "todos")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFiltering && (
              <button
                type="button"
                aria-label="Limpiar filtros"
                title="Limpiar filtros"
                onClick={() => setOptions(DEFAULT_USER_LIST_OPTIONS)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
            {pluralize(filtered.length, "resultado")}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={isFiltering ? "Sin resultados" : "Todavía no hay usuarios"}
          description={
            isFiltering ? "Probá con otra búsqueda o quitá los filtros." : "Creá el acceso de cada persona del consultorio."
          }
          actionLabel={isFiltering ? undefined : "Nuevo usuario"}
          onAction={isFiltering ? undefined : openCreate}
          secondaryActionLabel={isFiltering ? "Limpiar filtros" : undefined}
          onSecondaryAction={isFiltering ? () => setOptions(DEFAULT_USER_LIST_OPTIONS) : undefined}
        />
      ) : (
        <div className="space-y-4">
          <UserList
            users={pagination.items}
            currentUserId={actor.id}
            canManage={(user) => canManageUser(actor.role, user)}
            onEdit={(user) => {
              setEditingUser(user);
              setPresetProfessionalId(null);
              setDialogOpen(true);
            }}
            onResetPassword={setToReset}
            onToggleActive={(user) => (user.active ? setToDeactivate(user) : void setActive(user, true))}
          />
          <ListPagination pagination={pagination} itemLabel="usuarios" />
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        presetProfessionalId={presetProfessionalId}
        professionals={professionals}
        users={users}
        actorRole={actor.role}
        isSelf={editingUser?.id === actor.id}
        onSubmit={handleSubmit}
      />

      <TemporaryPasswordDialog result={credentials} onClose={() => setCredentials(null)} />

      <ConfirmAlertDialog
        open={Boolean(toReset)}
        onOpenChange={(open) => !open && setToReset(null)}
        title="¿Restablecer la contraseña?"
        description={`${toReset?.name ?? ""} no va a poder ingresar con su contraseña actual. Se genera una temporal para entregarle, y al ingresar va a tener que elegir una nueva.`}
        confirmLabel="Restablecer"
        onConfirm={() => {
          if (toReset) void resetPassword(toReset);
          setToReset(null);
        }}
      />

      <ConfirmAlertDialog
        open={Boolean(toDeactivate)}
        onOpenChange={(open) => !open && setToDeactivate(null)}
        title="¿Desactivar el usuario?"
        description={`${toDeactivate?.name ?? ""} pierde el acceso en el momento, aunque tenga la sesión abierta. Sus registros (turnos, historia clínica) se conservan y podés volver a activarlo cuando quieras.`}
        confirmLabel="Desactivar"
        destructive
        onConfirm={() => {
          if (toDeactivate) void setActive(toDeactivate, false);
          setToDeactivate(null);
        }}
      />
    </div>
  );
}
