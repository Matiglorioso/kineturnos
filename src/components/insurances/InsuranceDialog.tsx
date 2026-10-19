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
import { Textarea } from "@/components/ui/textarea";
import type { InsuranceRequest } from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { INSURANCE_NAME_MAX_LENGTH, parseInsuranceInput } from "@/lib/insurance";
import type { Insurance } from "@/types";
import { useEffect, useState } from "react";

interface InsuranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = alta. */
  insurance: Insurance | null;
  onSubmit: (body: InsuranceRequest) => Promise<void>;
}

export function InsuranceDialog({ open, onOpenChange, insurance, onSubmit }: InsuranceDialogProps) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(insurance?.name ?? "");
    setActive(insurance?.active ?? true);
    setNotes(insurance?.notes ?? "");
    setError(null);
  }, [open, insurance]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseInsuranceInput({ name, active, notes });
    if (!parsed.input) {
      setError(parsed.error ?? "Revisá los datos.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name, active, notes });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{insurance ? "Editar obra social" : "Nueva obra social"}</DialogTitle>
          <DialogDescription>
            {insurance
              ? "Si le cambiás el nombre, se actualiza en todos sus pacientes."
              : "Después la podés elegir en la ficha de cada paciente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField id="insurance-name" label="Nombre" required error={error ?? undefined}>
            <Input
              id="insurance-name"
              value={name}
              maxLength={INSURANCE_NAME_MAX_LENGTH}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Por ejemplo: APROSS"
            />
          </FormField>
          <FormField id="insurance-notes" label="Observaciones">
            <Textarea
              id="insurance-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Cómo se tramitan las autorizaciones, contacto, portal…"
            />
          </FormField>
          {insurance && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Activa (se puede elegir en la ficha del paciente)
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
