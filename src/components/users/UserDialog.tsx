"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/fetch-json";
import { getRoleLabel } from "@/lib/auth/roles";
import {
  assignableRoles,
  buildUserFormValues,
  INITIAL_USER_FORM,
  validateUserForm,
  type UserFormErrors,
  type UserFormValues,
} from "@/lib/user-form";
import type { AppUser, Professional } from "@/types";
import type { RolUsuario } from "@prisma/client";
import { Pencil, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const ROLE_DESCRIPTIONS: Record<RolUsuario, string> = {
  admin: "Dueños y recepción: todo el consultorio.",
  profesional: "Su agenda, la asistencia y la historia clínica de sus pacientes.",
  superadmin: "Equipo de desarrollo: todo lo de Administración.",
};

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: AppUser | null;
  /** Profesional preseleccionado al crear (atajo desde Profesionales). */
  presetProfessionalId?: string | null;
  professionals: Professional[];
  users: AppUser[];
  actorRole: RolUsuario;
  /** El usuario que edita es el mismo: no puede cambiarse el perfil. */
  isSelf: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

export function UserDialog({
  open,
  onOpenChange,
  editingUser,
  presetProfessionalId,
  professionals,
  users,
  actorRole,
  isSelf,
  onSubmit,
}: UserDialogProps) {
  const isEditing = Boolean(editingUser);
  const [form, setForm] = useState<UserFormValues>(INITIAL_USER_FORM);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Profesionales activos sin usuario (más el vinculado al que se edita). */
  const availableProfessionals = useMemo(() => {
    const linked = new Set(
      users.filter((user) => user.id !== editingUser?.id && user.professionalId).map((user) => user.professionalId)
    );
    return professionals
      .filter((item) => !linked.has(item.id) && (item.active || item.id === editingUser?.professionalId))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [professionals, users, editingUser]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    if (editingUser) {
      setForm(buildUserFormValues(editingUser));
      return;
    }
    const preset = professionals.find((item) => item.id === presetProfessionalId);
    setForm(
      preset
        ? { name: preset.name, email: preset.email ?? "", role: "profesional", professionalId: preset.id }
        : INITIAL_USER_FORM
    );
  }, [open, editingUser, presetProfessionalId, professionals]);

  const update = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  };

  /** Al elegir el profesional en un alta, completa nombre y email si están vacíos. */
  const selectProfessional = (id: string) => {
    const professional = professionals.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      professionalId: id,
      name: !isEditing && !current.name.trim() && professional ? professional.name : current.name,
      email: !isEditing && !current.email.trim() && professional?.email ? professional.email : current.email,
    }));
    setErrors((current) => ({ ...current, professionalId: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateUserForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.field && error.field in INITIAL_USER_FORM) {
        setErrors({ [error.field]: error.message });
      } else {
        setFormError(error instanceof Error ? error.message : "No se pudo guardar el usuario.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = assignableRoles(actorRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {isEditing ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </span>
            {isEditing ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos de acceso. La contraseña se restablece desde la lista."
              : "Al crearlo se genera una contraseña temporal para entregarle a la persona."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField id="user-role" label="Perfil" required error={errors.role}>
            <Select
              value={form.role}
              onValueChange={(value) => update("role", value as RolUsuario)}
              disabled={isSelf}
            >
              <SelectTrigger id="user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isSelf ? "No podés cambiar tu propio perfil." : ROLE_DESCRIPTIONS[form.role]}
            </p>
          </FormField>

          {form.role === "profesional" && (
            <FormField id="user-professional" label="Profesional" required error={errors.professionalId}>
              <Select value={form.professionalId} onValueChange={selectProfessional}>
                <SelectTrigger id="user-professional">
                  <SelectValue placeholder="Elegí el profesional" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfessionals.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Todos los profesionales activos ya tienen usuario.
                    </div>
                  ) : (
                    availableProfessionals.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Va a ver solo la agenda de este profesional.</p>
            </FormField>
          )}

          <FormField id="user-name" label="Nombre" required error={errors.name}>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Ej: Laura Fernández"
              autoComplete="off"
            />
          </FormField>

          <FormField id="user-email" label="Email (para ingresar)" required error={errors.email}>
            <Input
              id="user-email"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="nombre@consultorio.com"
              autoComplete="off"
            />
          </FormField>

          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
