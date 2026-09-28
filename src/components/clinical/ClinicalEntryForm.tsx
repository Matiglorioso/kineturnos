"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicalEntryRequest } from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import { getAppointmentStatusLabel } from "@/lib/appointment-status";
import { CLINICAL_TEXT_MAX_LENGTH } from "@/lib/clinical-history";
import { formatAppDate } from "@/lib/date-utils";
import type { ClinicalSessionOption } from "@/types";
import { Save } from "lucide-react";
import { useState } from "react";

const NO_SESSION = "sin-turno";

type Values = { appointmentId: string; diagnosis: string; treatment: string; evolution: string };

interface ClinicalEntryFormProps {
  idPrefix: string;
  /** Solo en el alta: turnos que se pueden asociar al registro. */
  sessionOptions?: ClinicalSessionOption[];
  defaultAppointmentId?: string | null;
  initial?: Partial<Values>;
  submitLabel: string;
  onSubmit: (body: ClinicalEntryRequest) => Promise<void>;
  onCancel?: () => void;
}

export function ClinicalEntryForm({
  idPrefix,
  sessionOptions,
  defaultAppointmentId,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: ClinicalEntryFormProps) {
  const initialSession =
    defaultAppointmentId && sessionOptions?.some((option) => option.id === defaultAppointmentId)
      ? defaultAppointmentId
      : NO_SESSION;
  const [values, setValues] = useState<Values>({
    appointmentId: initialSession,
    diagnosis: initial?.diagnosis ?? "",
    treatment: initial?.treatment ?? "",
    evolution: initial?.evolution ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Values | "form", string>>>({});
  const [saving, setSaving] = useState(false);

  const update = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.evolution.trim()) {
      setErrors({ evolution: "Escribí la evolución de la sesión." });
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        appointmentId: values.appointmentId === NO_SESSION ? null : values.appointmentId,
        diagnosis: values.diagnosis,
        treatment: values.treatment,
        evolution: values.evolution,
      });
    } catch (error) {
      setErrors({
        form: error instanceof ApiError ? error.message : "No se pudo guardar el registro.",
      });
    } finally {
      setSaving(false);
    }
  };

  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {sessionOptions && (
        <FormField id={id("session")} label="Sesión">
          <Select value={values.appointmentId} onValueChange={(value) => update("appointmentId", value)}>
            <SelectTrigger id={id("session")}>
              <SelectValue placeholder="Elegí el turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SESSION}>Sin turno asociado (fecha de hoy)</SelectItem>
              {sessionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {formatAppDate(option.date)} {option.time} · {option.professionalName} ·{" "}
                  {getAppointmentStatusLabel(option.status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField id={id("evolution")} label="Evolución de la sesión" required error={errors.evolution}>
        <Textarea
          id={id("evolution")}
          value={values.evolution}
          onChange={(event) => update("evolution", event.target.value)}
          placeholder="Qué se trabajó, cómo respondió el paciente, indicaciones..."
          maxLength={CLINICAL_TEXT_MAX_LENGTH}
          rows={4}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id("diagnosis")} label="Diagnóstico (si se carga o cambia)">
          <Textarea
            id={id("diagnosis")}
            value={values.diagnosis}
            onChange={(event) => update("diagnosis", event.target.value)}
            maxLength={CLINICAL_TEXT_MAX_LENGTH}
            rows={3}
          />
        </FormField>
        <FormField id={id("treatment")} label="Plan de tratamiento (si se carga o cambia)">
          <Textarea
            id={id("treatment")}
            value={values.treatment}
            onChange={(event) => update("treatment", event.target.value)}
            maxLength={CLINICAL_TEXT_MAX_LENGTH}
            rows={3}
          />
        </FormField>
      </div>

      {errors.form && (
        <p className="text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
