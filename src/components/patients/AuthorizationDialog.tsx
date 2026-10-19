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
import type { AuthorizationRequest } from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { getTodayAppDate } from "@/lib/date-utils";
import {
  AUTHORIZATION_STATE_LABELS,
  MAX_AUTHORIZED_SESSIONS,
  parseAuthorizationInput,
} from "@/lib/insurance";
import type { Authorization, AuthorizationState } from "@/types";
import { useEffect, useState } from "react";

interface AuthorizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insuranceName: string;
  /** null = alta. */
  authorization: Authorization | null;
  onSubmit: (body: AuthorizationRequest) => Promise<void>;
}

type Values = Omit<AuthorizationRequest, "sessions"> & { sessions: string };

function initialValues(authorization: Authorization | null): Values {
  return {
    number: authorization?.number ?? "",
    state: authorization?.state ?? "aprobada",
    sessions: authorization ? String(authorization.sessions) : "",
    validFrom: authorization?.validFrom ?? getTodayAppDate(),
    validUntil: authorization?.validUntil ?? "",
    notes: authorization?.notes ?? "",
  };
}

export function AuthorizationDialog({
  open,
  onOpenChange,
  insuranceName,
  authorization,
  onSubmit,
}: AuthorizationDialogProps) {
  const [values, setValues] = useState<Values>(() => initialValues(authorization));
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(authorization));
      setError(null);
    }
  }, [open, authorization]);

  const update = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = { ...values, sessions: Number(values.sessions) };
    const parsed = parseAuthorizationInput(body);
    if (!parsed.input) {
      setError({ message: parsed.error ?? "Revisá los datos.", field: parsed.field });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(body);
      onOpenChange(false);
    } catch (submitError) {
      setError({
        message: submitError instanceof ApiError ? submitError.message : "No se pudo guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => (error?.field === field ? error.message : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{authorization ? "Editar autorización" : "Nueva autorización"}</DialogTitle>
          <DialogDescription>
            {insuranceName}. Las sesiones se descuentan solas al marcar los turnos como atendidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="aut-number" label="Nº de autorización">
              <Input
                id="aut-number"
                value={values.number}
                onChange={(event) => update("number", event.target.value)}
                placeholder="Opcional si está en trámite"
              />
            </FormField>
            <FormField id="aut-state" label="Estado">
              <Select value={values.state} onValueChange={(next) => update("state", next as AuthorizationState)}>
                <SelectTrigger id="aut-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AUTHORIZATION_STATE_LABELS) as AuthorizationState[]).map((state) => (
                    <SelectItem key={state} value={state}>
                      {AUTHORIZATION_STATE_LABELS[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="aut-sessions" label="Sesiones" required error={fieldError("sessions")}>
              <Input
                id="aut-sessions"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_AUTHORIZED_SESSIONS}
                value={values.sessions}
                onChange={(event) => update("sessions", event.target.value)}
                placeholder="10"
              />
            </FormField>
            <FormField id="aut-from" label="Desde" required error={fieldError("validFrom")}>
              <Input
                id="aut-from"
                value={values.validFrom}
                onChange={(event) => update("validFrom", event.target.value)}
                placeholder="dd-mm-aaaa"
              />
            </FormField>
            <FormField id="aut-until" label="Vence" error={fieldError("validUntil")}>
              <Input
                id="aut-until"
                value={values.validUntil}
                onChange={(event) => update("validUntil", event.target.value)}
                placeholder="dd-mm-aaaa"
              />
            </FormField>
          </div>

          <FormField id="aut-notes" label="Observaciones">
            <Textarea
              id="aut-notes"
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={2}
              placeholder="Prestación, código, médico que la indicó…"
            />
          </FormField>

          {error && !error.field && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}
          {error?.field && !["sessions", "validFrom", "validUntil"].includes(error.field) && (
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : authorization ? "Guardar cambios" : "Guardar autorización"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
