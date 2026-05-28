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
  APPOINTMENT_DURATION_OPTIONS,
  SESSION_TYPES,
} from "@/lib/appointment-constants";
import { APPOINTMENT_STATUS_FORM_OPTIONS } from "@/lib/appointment-status";
import {
  validateAppointmentForm,
  type AppointmentFormErrors,
} from "@/lib/appointment-validation";
import {
  APP_DATE_FORMAT,
  getTodayAppDate,
  isValidAppDate,
  normalizeAppDate,
} from "@/lib/date-utils";
import { getEndTime, normalizeTime } from "@/lib/time-utils";
import { appToasts } from "@/lib/toast";
import {
  Appointment,
  AppointmentStatus,
  Patient,
  Professional,
  SessionType,
} from "@/types";
import { CalendarPlus, Pencil } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

export interface NewAppointmentFormValues {
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: string;
  sessionType: SessionType | "";
  status: AppointmentStatus | "";
  notes: string;
}

type FormErrors = AppointmentFormErrors;

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (appointment: Appointment) => void;
  patients: Patient[];
  professionals: Professional[];
  existingAppointments: Appointment[];
  defaultDate: string;
  editingAppointment?: Appointment | null;
}

function buildInitialForm(defaultDate: string): NewAppointmentFormValues {
  return {
    patientId: "",
    professionalId: "",
    date: defaultDate,
    time: "",
    duration: "45",
    sessionType: "",
    status: "pendiente",
    notes: "",
  };
}

function buildFormFromAppointment(
  appointment: Appointment
): NewAppointmentFormValues {
  return {
    patientId: appointment.patientId,
    professionalId: appointment.professionalId,
    date: appointment.date,
    time: normalizeTime(appointment.time),
    duration: String(appointment.duration),
    sessionType: appointment.sessionType,
    status: appointment.status,
    notes: appointment.notes ?? "",
  };
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  onSubmit,
  patients,
  professionals,
  existingAppointments,
  defaultDate,
  editingAppointment = null,
}: NewAppointmentDialogProps) {
  const isEditing = Boolean(editingAppointment);
  const selectableProfessionals = useMemo(() => {
    const active = professionals.filter((professional) => professional.active);

    if (!editingAppointment) return active;

    const current = professionals.find(
      (professional) => professional.id === editingAppointment.professionalId
    );

    if (current && !active.some((item) => item.id === current.id)) {
      return [current, ...active];
    }

    return active;
  }, [professionals, editingAppointment]);
  const [form, setForm] = useState<NewAppointmentFormValues>(() =>
    buildInitialForm(defaultDate)
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) {
      setForm(buildInitialForm(defaultDate));
      setErrors({});
      return;
    }

    if (editingAppointment) {
      setForm(buildFormFromAppointment(editingAppointment));
      setErrors({});
    } else {
      setForm(buildInitialForm(defaultDate));
      setErrors({});
    }
  }, [open, defaultDate, editingAppointment]);

  const endTime = useMemo(() => {
    if (!form.time || !form.duration) return "";
    return getEndTime(form.time, Number(form.duration));
  }, [form.time, form.duration]);

  const updateField = <K extends keyof NewAppointmentFormValues>(
    key: K,
    value: NewAppointmentFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = {
        ...prev,
        [key]: undefined,
        overlap: undefined,
        schedule: undefined,
      };
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateAppointmentForm(
      form,
      existingAppointments,
      professionals,
      editingAppointment?.id
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      appToasts.appointment.validationError();
      return;
    }

    const patient = patients.find((p) => p.id === form.patientId);
    const professional = professionals.find((p) => p.id === form.professionalId);

    if (!patient || !professional) {
      appToasts.appointment.saveError();
      return;
    }

    const appointment: Appointment = {
      id: editingAppointment?.id ?? `a-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      professionalId: professional.id,
      professionalName: professional.name,
      date: normalizeAppDate(form.date.trim()),
      time: normalizeTime(form.time),
      duration: Number(form.duration),
      status: form.status as AppointmentStatus,
      sessionType: form.sessionType as SessionType,
      notes: form.notes.trim() || undefined,
    };

    onSubmit(appointment);
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
                <CalendarPlus className="h-4 w-4" />
              )}
            </span>
            {isEditing ? "Editar turno" : "Agendar turno"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del turno seleccionado."
              : "Programá una sesión indicando paciente, profesional, fecha y horario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="patientId"
              label="Paciente"
              required
              error={errors.patientId}
            >
              <Select
                value={form.patientId}
                onValueChange={(value) => updateField("patientId", value)}
              >
                <SelectTrigger id="patientId">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              id="professionalId"
              label="Profesional"
              required
              error={errors.professionalId}
            >
              <Select
                value={form.professionalId}
                onValueChange={(value) => updateField("professionalId", value)}
              >
                <SelectTrigger id="professionalId">
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {selectableProfessionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.name} · {professional.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="date" label="Fecha" required error={errors.date}>
              <Input
                id="date"
                type="text"
                inputMode="numeric"
                placeholder={APP_DATE_FORMAT}
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (isValidAppDate(value)) {
                    updateField("date", normalizeAppDate(value));
                  }
                }}
              />
            </FormField>

            <FormField
              id="time"
              label="Hora de inicio"
              required
              error={errors.time}
            >
              <Input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="duration"
              label="Duracion (minutos)"
              required
              error={errors.duration}
            >
              <Select
                value={form.duration}
                onValueChange={(value) => updateField("duration", value)}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleccionar duracion" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_DURATION_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="endTime" label="Hora de fin">
              <Input
                id="endTime"
                value={endTime ? `${endTime} hs` : "—"}
                readOnly
                className="bg-muted/50"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="sessionType"
              label="Tipo de sesion"
              required
              error={errors.sessionType}
            >
              <Select
                value={form.sessionType}
                onValueChange={(value) =>
                  updateField("sessionType", value as SessionType)
                }
              >
                <SelectTrigger id="sessionType">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="status" label="Estado" required error={errors.status}>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as AppointmentStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_STATUS_FORM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField id="notes" label="Observaciones">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Indicaciones, molestias, objetivos de la sesion..."
            />
          </FormField>

          {(errors.overlap || errors.schedule) && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errors.overlap ?? errors.schedule}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Guardar cambios" : "Confirmar turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

