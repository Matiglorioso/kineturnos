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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildProfessionalFormValues,
  INITIAL_PROFESSIONAL_FORM,
  validateProfessionalForm,
  type ProfessionalFormErrors,
  type ProfessionalFormValues,
} from "@/lib/professional-form";
import {
  buildProfessionalName,
  pickAvatarColor,
  PROFESSIONAL_DURATION_OPTIONS,
  PROFESSIONAL_SPECIALTIES,
  WEEK_DAYS,
} from "@/lib/professional-utils";
import { appToasts } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Professional, WeekDay } from "@/types";
import { Pencil, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export type { ProfessionalFormValues as NewProfessionalFormValues } from "@/lib/professional-form";

interface NewProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (professional: Professional) => void | Promise<void>;
  editingProfessional?: Professional | null;
  existingCount?: number;
  existingProfessionals?: Professional[];
}

export function NewProfessionalDialog({
  open,
  onOpenChange,
  onSubmit,
  editingProfessional = null,
  existingCount = 0,
  existingProfessionals = [],
}: NewProfessionalDialogProps) {
  const isEditing = Boolean(editingProfessional);
  const [form, setForm] = useState<ProfessionalFormValues>(INITIAL_PROFESSIONAL_FORM);
  const [errors, setErrors] = useState<ProfessionalFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_PROFESSIONAL_FORM);
      setErrors({});
      return;
    }

    if (editingProfessional) {
      setForm(buildProfessionalFormValues(editingProfessional));
    } else {
      setForm(INITIAL_PROFESSIONAL_FORM);
    }
    setErrors({});
  }, [open, editingProfessional]);

  const updateField = <K extends keyof ProfessionalFormValues>(
    key: K,
    value: ProfessionalFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, days: undefined }));
  };

  const toggleDay = (day: WeekDay) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      const days = exists
        ? prev.days.filter((item) => item !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
    setErrors((prev) => ({ ...prev, days: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateProfessionalForm(form, {
      excludeProfessionalId: editingProfessional?.id,
      existingProfessionals,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      appToasts.professional.validationError();
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    const professional: Professional = {
      id: editingProfessional?.id ?? `prof-${Date.now()}`,
      name: buildProfessionalName(firstName, lastName),
      firstName,
      lastName,
      license: form.license.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      specialty: form.specialty,
      days: form.days,
      scheduleStart: form.scheduleStart.slice(0, 5),
      scheduleEnd: form.scheduleEnd.slice(0, 5),
      defaultDuration: Number(form.defaultDuration),
      active: form.active,
      avatarColor:
        editingProfessional?.avatarColor ?? pickAvatarColor(existingCount),
      notes: form.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(professional);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {isEditing ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </span>
            {isEditing ? "Editar profesional" : "Registrar profesional"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá los datos y la disponibilidad del kinesiólogo."
              : "Completá la ficha con especialidad, días y horario de atención."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="firstName" label="Nombre" required error={errors.firstName}>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
            </FormField>
            <FormField id="lastName" label="Apellido" required error={errors.lastName}>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="license" label="Matricula" required error={errors.license}>
              <Input
                id="license"
                value={form.license}
                onChange={(e) => updateField("license", e.target.value)}
                placeholder="MN 12.345"
              />
            </FormField>
            <FormField id="phone" label="Teléfono">
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </FormField>
          </div>

          <FormField id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </FormField>

          <FormField id="specialty" label="Especialidad" required error={errors.specialty}>
            <Select
              value={form.specialty}
              onValueChange={(value) => updateField("specialty", value)}
            >
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Seleccionar especialidad" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONAL_SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-2">
            <Label className="text-slate-700">
              Días de atención <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "rounded-xl border px-2.5 py-2 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm",
                      selected
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-200"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <p className="text-xs text-destructive" role="alert">
                {errors.days}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="scheduleStart"
              label="Hora de inicio"
              required
              error={errors.scheduleStart}
            >
              <Input
                id="scheduleStart"
                type="time"
                value={form.scheduleStart}
                onChange={(e) => updateField("scheduleStart", e.target.value)}
              />
            </FormField>
            <FormField
              id="scheduleEnd"
              label="Hora de fin"
              required
              error={errors.scheduleEnd}
            >
              <Input
                id="scheduleEnd"
                type="time"
                value={form.scheduleEnd}
                onChange={(e) => updateField("scheduleEnd", e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="defaultDuration"
              label="Duracion estandar del turno"
              required
              error={errors.defaultDuration}
            >
              <Select
                value={form.defaultDuration}
                onValueChange={(value) => updateField("defaultDuration", value)}
              >
                <SelectTrigger id="defaultDuration">
                  <SelectValue placeholder="Seleccionar duracion" />
                </SelectTrigger>
                <SelectContent>
                  {PROFESSIONAL_DURATION_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="active" label="Estado">
              <Select
                value={form.active ? "activo" : "inactivo"}
                onValueChange={(value) => updateField("active", value === "activo")}
              >
                <SelectTrigger id="active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField id="notes" label="Observaciones">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Notas sobre disponibilidad o preferencias..."
            />
          </FormField>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Guardar cambios" : "Registrar profesional"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

