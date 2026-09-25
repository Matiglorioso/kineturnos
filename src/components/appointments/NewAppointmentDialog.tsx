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
import { SESSION_TYPES } from "@/lib/appointment-constants";
import {
  APPOINTMENT_STATUS_LABELS,
  getNextAppointmentStatuses,
  isFinalAppointmentStatus,
} from "@/lib/appointment-status";
import { listHourlySlotOptionsForForm } from "@/lib/appointment-slots";
import {
  getStatusOptionsForAppointmentDate,
  validateAppointmentForm,
  type AppointmentFormErrors,
} from "@/lib/appointment-validation";
import {
  APP_DATE_FORMAT,
  getTodayAppDate,
  isValidAppDate,
  normalizeAppDate,
} from "@/lib/date-utils";
import { normalizeTime } from "@/lib/time-utils";
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
  sessionType: SessionType | "";
  status: AppointmentStatus | "";
  notes: string;
}

type FormErrors = AppointmentFormErrors;

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (appointment: Appointment) => void | Promise<void>;
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
  // Máquina de estados: un turno final no se reprograma (solo tipo y observaciones).
  const isFinalEditing = Boolean(
    editingAppointment && isFinalAppointmentStatus(editingAppointment.status)
  );
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Estados posibles: los que admite la fecha y, al editar, las transiciones
  // permitidas desde el estado actual del turno.
  const allowedStatuses = useMemo(() => {
    const byDate = getStatusOptionsForAppointmentDate(
      form.date || getTodayAppDate()
    );
    if (!editingAppointment) return byDate;

    const reachable = [
      editingAppointment.status,
      ...getNextAppointmentStatuses(editingAppointment.status),
    ];
    return byDate.filter((status) => reachable.includes(status));
  }, [form.date, editingAppointment]);

  const statusOptions = useMemo(
    () =>
      allowedStatuses.map((value) => ({
        value,
        label: APPOINTMENT_STATUS_LABELS[value],
      })),
    [allowedStatuses]
  );

  useEffect(() => {
    if (!form.status || !form.date || allowedStatuses.length === 0) return;
    if (!allowedStatuses.includes(form.status as AppointmentStatus)) {
      setForm((prev) => ({ ...prev, status: allowedStatuses[0] }));
    }
  }, [allowedStatuses, form.date, form.status]);

  const selectedProfessional = useMemo(
    () => professionals.find((item) => item.id === form.professionalId),
    [professionals, form.professionalId]
  );

  const hourlySlotOptions = useMemo(
    () =>
      listHourlySlotOptionsForForm(
        selectedProfessional,
        form.date,
        existingAppointments,
        {
          excludeId: editingAppointment?.id,
          currentTime: editingAppointment?.time,
        }
      ),
    [
      selectedProfessional,
      form.date,
      existingAppointments,
      editingAppointment?.id,
      editingAppointment?.time,
    ]
  );

  const availableSlotOptions = hourlySlotOptions.filter(
    (slot) => slot.available
  );

  useEffect(() => {
    if (!form.time) return;
    const stillValid = hourlySlotOptions.some(
      (slot) => slot.startTime === form.time && slot.available
    );
    if (!stillValid) {
      setForm((prev) => ({ ...prev, time: "" }));
    }
  }, [hourlySlotOptions, form.time]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateAppointmentForm(
      form,
      existingAppointments,
      professionals,
      editingAppointment?.id,
      editingAppointment
        ? {
            previousDate: editingAppointment.date,
            previousTime: editingAppointment.time,
            previousProfessionalId: editingAppointment.professionalId,
            previousStatus: editingAppointment.status,
          }
        : undefined
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
      status: form.status as AppointmentStatus,
      sessionType: form.sessionType as SessionType,
      notes: form.notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(appointment);
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
                <CalendarPlus className="h-4 w-4" />
              )}
            </span>
            {isEditing ? "Editar turno" : "Agendar turno"}
          </DialogTitle>
          <DialogDescription>
            {isFinalEditing && editingAppointment
              ? `Este turno está ${APPOINTMENT_STATUS_LABELS[editingAppointment.status].toLowerCase()}: no se puede reprogramar. Podés editar el tipo de sesión y las observaciones.`
              : isEditing
                ? "Modificá los datos del turno seleccionado."
                : "Programá una sesión indicando paciente, profesional, fecha y bloque horario (turnos de 1 hora)."}
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
                disabled={isFinalEditing}
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
                disabled={isFinalEditing}
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
                disabled={isFinalEditing}
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
              label="Horario"
              required
              error={errors.time ?? errors.overlap}
            >
              <Select
                value={form.time}
                onValueChange={(value) => updateField("time", value)}
                disabled={
                  isFinalEditing ||
                  !form.professionalId ||
                  !form.date ||
                  !isValidAppDate(form.date) ||
                  availableSlotOptions.length === 0
                }
              >
                <SelectTrigger id="time">
                  <SelectValue
                    placeholder={
                      !form.professionalId || !form.date
                        ? "Elegí profesional y fecha"
                        : availableSlotOptions.length === 0
                          ? "Sin bloques disponibles"
                          : "Seleccionar horario"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {hourlySlotOptions.map((slot) => (
                    <SelectItem
                      key={slot.startTime}
                      value={slot.startTime}
                      disabled={!slot.available}
                    >
                      {slot.label}
                      {!slot.available ? " · Ocupado" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="sessionType"
              label="Tipo de sesión"
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
                  {statusOptions.map((option) => (
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
              placeholder="Indicaciones, molestias, objetivos de la sesión…"
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
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Guardar cambios" : "Confirmar turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

