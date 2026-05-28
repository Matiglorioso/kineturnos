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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildPatientFormValues,
  INITIAL_PATIENT_FORM,
  validatePatientForm,
  type PatientFormErrors,
  type PatientFormValues,
} from "@/lib/patient-form";
import { toAppDate } from "@/lib/date-utils";
import { appToasts } from "@/lib/toast";
import { Patient, PatientStatus } from "@/types";
import { Pencil, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export type { PatientFormValues as NewPatientFormValues } from "@/lib/patient-form";

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patient: Patient) => void;
  editingPatient?: Patient | null;
}

export function NewPatientDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPatient = null,
}: NewPatientDialogProps) {
  const isEditing = Boolean(editingPatient);
  const [form, setForm] = useState<PatientFormValues>(INITIAL_PATIENT_FORM);
  const [errors, setErrors] = useState<PatientFormErrors>({});

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_PATIENT_FORM);
      setErrors({});
      return;
    }

    if (editingPatient) {
      setForm(buildPatientFormValues(editingPatient));
      setErrors({});
    }
  }, [open, editingPatient]);

  const updateField = <K extends keyof PatientFormValues>(
    key: K,
    value: PatientFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validatePatientForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      appToasts.patient.validationError();
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    const patient: Patient = {
      id: editingPatient?.id ?? `p-${Date.now()}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      dni: form.dni.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      insurance: form.insurance.trim() || "Particular",
      status: form.status,
      notes: form.notes.trim() || undefined,
      lastAppointment: editingPatient?.lastAppointment,
      createdAt: editingPatient?.createdAt ?? toAppDate(new Date()),
    };

    onSubmit(patient);
    onOpenChange(false);
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
            {isEditing ? "Editar paciente" : "Registrar paciente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del paciente seleccionado."
              : "Completá la ficha para sumar un paciente al consultorio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="firstName"
              label="Nombre"
              required
              error={errors.firstName}
            >
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Ej: Maria"
              />
            </FormField>

            <FormField
              id="lastName"
              label="Apellido"
              required
              error={errors.lastName}
            >
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Ej: Gonzalez"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="dni" label="DNI" required error={errors.dni}>
              <Input
                id="dni"
                value={form.dni}
                onChange={(e) => updateField("dni", e.target.value)}
                placeholder="Ej: 32.456.789"
              />
            </FormField>

            <FormField id="phone" label="Teléfono" required error={errors.phone}>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Ej: +54 11 4523-8891"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="email" label="Email" error={errors.email}>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Ej: paciente@email.com"
              />
            </FormField>

            <FormField id="insurance" label="Obra social / prepaga">
              <Input
                id="insurance"
                value={form.insurance}
                onChange={(e) => updateField("insurance", e.target.value)}
                placeholder="Ej: OSDE, Swiss Medical..."
              />
            </FormField>
          </div>

          <FormField id="status" label="Estado">
            <Select
              value={form.status}
              onValueChange={(value: PatientStatus) =>
                updateField("status", value)
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="notes" label="Observaciones">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Notas clinicas, preferencias de horario, etc."
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
            <Button type="submit">
              {isEditing ? "Guardar cambios" : "Registrar paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

