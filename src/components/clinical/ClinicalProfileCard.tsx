"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/fetch-json";
import { CLINICAL_TEXT_MAX_LENGTH } from "@/lib/clinical-history";
import type { ClinicalProfile } from "@/types";
import { ClipboardList, Pencil } from "lucide-react";
import { useState } from "react";
import { formatClinicalTimestamp } from "./ClinicalEntryCard";

interface ClinicalProfileCardProps {
  profile: ClinicalProfile | null;
  canEdit: boolean;
  onSave: (body: { alerts: string; background: string }) => Promise<void>;
}

/** Alertas clínicas (una por renglón) y antecedentes del paciente. */
export function ClinicalProfileCard({ profile, canEdit, onSave }: ClinicalProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [alerts, setAlerts] = useState(profile?.alerts ?? "");
  const [background, setBackground] = useState(profile?.background ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setAlerts(profile?.alerts ?? "");
    setBackground(profile?.background ?? "");
    setError(null);
    setEditing(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ alerts, background });
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="ficha-titulo"
      className="rounded-2xl border border-slate-200 bg-white p-4 print:break-inside-avoid"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="ficha-titulo" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          Alertas y antecedentes
        </h2>
        {canEdit && !editing && (
          <Button type="button" variant="ghost" size="sm" className="print:hidden" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-3 space-y-3">
          <FormField id="ficha-alerts" label="Alertas clínicas (una por renglón)">
            <Textarea
              id="ficha-alerts"
              value={alerts}
              onChange={(event) => setAlerts(event.target.value)}
              placeholder={"Alergia al ibuprofeno\nMarcapasos: sin electroterapia"}
              maxLength={CLINICAL_TEXT_MAX_LENGTH}
              rows={3}
            />
          </FormField>
          <FormField id="ficha-background" label="Antecedentes">
            <Textarea
              id="ficha-background"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              placeholder="Cirugías, enfermedades, medicación habitual..."
              maxLength={CLINICAL_TEXT_MAX_LENGTH}
              rows={3}
            />
          </FormField>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Antecedentes</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800">
              {profile?.background || <span className="text-muted-foreground">Sin antecedentes cargados.</span>}
            </p>
          </div>
          {profile && (
            <p className="text-xs text-muted-foreground">
              Actualizado por {profile.updatedByName} el {formatClinicalTimestamp(profile.updatedAt)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
