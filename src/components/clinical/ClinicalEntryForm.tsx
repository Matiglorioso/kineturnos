"use client";

import { Button } from "@/components/ui/button";
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
import type { ClinicalEntryRequest } from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import { CLINICAL_TEXT_MAX_LENGTH } from "@/lib/clinical-history";
import { compareAppDates, formatAppDate, isValidAppDate, normalizeAppDate } from "@/lib/date-utils";
import { Save } from "lucide-react";
import { useState } from "react";

type Field = "date" | "professionalId" | "evolution" | "form";

/**
 * Guía de la evolución, en el orden habitual de una nota de sesión de kinesiología
 * (subjetivo, intervención, respuesta y plan). Es solo ayuda: el campo sigue siendo libre.
 */
const EVOLUTION_GUIDE = [
  "Cómo llegó: dolor (EVA 0–10), molestias desde la última sesión",
  "Qué se hizo: técnicas y ejercicios (series × repeticiones, carga)",
  "Cómo respondió: tolerancia, cambios en movilidad o fuerza",
  "Indicaciones: ejercicios para casa, próximos pasos",
].join("\n");

/**
 * Datos del alta: la fecha arranca en hoy y el profesional lo elige Administración; el
 * Profesional registra a su nombre. Si se abre desde un turno de la agenda, fecha y
 * profesional salen del turno.
 */
export interface NewClinicalEntryContext {
  today: string;
  professionalOptions?: { id: string; name: string }[];
  ownProfessionalName?: string | null;
  appointment?: { id: string; date: string; professionalName: string } | null;
}

interface ClinicalEntryFormProps {
  idPrefix: string;
  /** Alta: fecha, profesional y evolución. Sin esto, es una corrección: solo la evolución. */
  newEntry?: NewClinicalEntryContext;
  initialEvolution?: string;
  submitLabel: string;
  onSubmit: (body: ClinicalEntryRequest) => Promise<void>;
  onCancel?: () => void;
}

export function ClinicalEntryForm({
  idPrefix,
  newEntry,
  initialEvolution,
  submitLabel,
  onSubmit,
  onCancel,
}: ClinicalEntryFormProps) {
  const appointment = newEntry?.appointment ?? null;
  const [date, setDate] = useState(appointment?.date ?? newEntry?.today ?? "");
  const [professionalId, setProfessionalId] = useState("");
  const [evolution, setEvolution] = useState(initialEvolution ?? "");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saving, setSaving] = useState(false);

  const fixedProfessional = appointment?.professionalName ?? newEntry?.ownProfessionalName ?? null;
  const asksProfessional = Boolean(newEntry && !fixedProfessional);

  const clear = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));

  const validate = (): Partial<Record<Field, string>> => {
    const found: Partial<Record<Field, string>> = {};
    if (newEntry && !appointment) {
      if (!isValidAppDate(date)) found.date = "Ingresá la fecha con el formato dd-mm-aaaa.";
      else if (compareAppDates(date, newEntry.today) > 0) found.date = "La fecha no puede ser futura.";
    }
    if (asksProfessional && !professionalId) found.professionalId = "Elegí qué profesional atendió la sesión.";
    if (!evolution.trim()) found.evolution = "Escribí la evolución de la sesión.";
    return found;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(
        newEntry
          ? {
              appointmentId: appointment?.id ?? null,
              date: appointment ? null : normalizeAppDate(date),
              professionalId: asksProfessional ? professionalId : null,
              evolution,
            }
          : { evolution }
      );
    } catch (error) {
      if (error instanceof ApiError && error.field && ["date", "professionalId", "evolution"].includes(error.field)) {
        setErrors({ [error.field as Field]: error.message });
      } else {
        setErrors({ form: error instanceof ApiError ? error.message : "No se pudo guardar el registro." });
      }
    } finally {
      setSaving(false);
    }
  };

  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {newEntry && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={id("date")} label="Fecha" required error={errors.date}>
            <Input
              id={id("date")}
              value={appointment ? formatAppDate(appointment.date) : date}
              onChange={(event) => {
                setDate(event.target.value);
                clear("date");
              }}
              placeholder="dd-mm-aaaa"
              inputMode="numeric"
              disabled={Boolean(appointment)}
            />
          </FormField>

          <FormField id={id("professional")} label="Profesional" required error={errors.professionalId}>
            {fixedProfessional ? (
              <Input id={id("professional")} value={fixedProfessional} disabled />
            ) : (
              <Select
                value={professionalId}
                onValueChange={(value) => {
                  setProfessionalId(value);
                  clear("professionalId");
                }}
              >
                <SelectTrigger id={id("professional")}>
                  <SelectValue placeholder="Elegí el profesional" />
                </SelectTrigger>
                <SelectContent>
                  {(newEntry.professionalOptions ?? []).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
      )}

      {appointment && (
        <p className="-mt-2 text-xs text-muted-foreground">Fecha y profesional del turno de la agenda.</p>
      )}

      <FormField id={id("evolution")} label="Evolución" required error={errors.evolution}>
        <Textarea
          id={id("evolution")}
          value={evolution}
          onChange={(event) => {
            setEvolution(event.target.value);
            clear("evolution");
          }}
          placeholder={EVOLUTION_GUIDE}
          maxLength={CLINICAL_TEXT_MAX_LENGTH}
          rows={8}
          aria-describedby={id("evolution-hint")}
        />
        <p id={id("evolution-hint")} className="text-xs text-muted-foreground">
          Orden sugerido: cómo llegó (dolor EVA 0–10), qué se hizo, cómo respondió e indicaciones para casa.
        </p>
      </FormField>

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
