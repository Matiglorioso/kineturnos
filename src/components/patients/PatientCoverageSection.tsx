"use client";

import { AuthorizationDialog } from "@/components/patients/AuthorizationDialog";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import {
  createAuthorizationRequest,
  deleteAuthorizationRequest,
  fetchPatientAuthorizations,
  updateAuthorizationRequest,
  type AuthorizationRequest,
} from "@/lib/api/insurances-client";
import { ApiError } from "@/lib/api/fetch-json";
import { formatAppDate } from "@/lib/date-utils";
import { AUTHORIZATION_STATE_LABELS } from "@/lib/insurance";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Authorization, Patient, PatientCoverage } from "@/types";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STATE_STYLES: Record<Authorization["state"], string> = {
  aprobada: "bg-emerald-50 text-emerald-800",
  pendiente: "bg-amber-50 text-amber-800",
  rechazada: "bg-slate-100 text-slate-600",
};

interface PatientCoverageSectionProps {
  patient: Patient;
  canManage: boolean;
  /** Avisa que cambió la cobertura (para refrescar la lista de pacientes). */
  onChanged?: () => void;
}

function period(authorization: Authorization): string {
  const from = formatAppDate(authorization.validFrom, "dd/MM/yyyy");
  return authorization.validUntil
    ? `${from} al ${formatAppDate(authorization.validUntil, "dd/MM/yyyy")}`
    : `Desde ${from}, sin vencimiento`;
}

/** Obra social, datos de afiliado y autorizaciones del paciente (RF07, RF14, RF15). */
export function PatientCoverageSection({ patient, canManage, onChanged }: PatientCoverageSectionProps) {
  const [authorizations, setAuthorizations] = useState<Authorization[] | null>(null);
  const [coverage, setCoverage] = useState<PatientCoverage | undefined>(patient.coverage);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; authorization: Authorization | null }>({
    open: false,
    authorization: null,
  });
  const [toDelete, setToDelete] = useState<Authorization | null>(null);
  const hasInsurance = Boolean(patient.insuranceId);

  const load = useCallback(async () => {
    try {
      const data = await fetchPatientAuthorizations(patient.id);
      setAuthorizations(data.authorizations);
      setCoverage(data.coverage);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No se pudieron cargar las autorizaciones.");
    }
  }, [patient.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (body: AuthorizationRequest) => {
    if (dialog.authorization) {
      await updateAuthorizationRequest(patient.id, dialog.authorization.id, body);
      showSuccessToast("Autorización actualizada");
    } else {
      await createAuthorizationRequest(patient.id, body);
      showSuccessToast("Autorización guardada");
    }
    await load();
    onChanged?.();
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteAuthorizationRequest(patient.id, toDelete.id);
      showSuccessToast("Autorización eliminada");
      await load();
      onChanged?.();
    } catch (error) {
      showErrorToast("No se pudo eliminar", error instanceof ApiError ? error.message : undefined);
    } finally {
      setToDelete(null);
    }
  };

  return (
    <section aria-labelledby="cobertura-titulo" className="space-y-3 border-t border-slate-100 pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 id="cobertura-titulo" className="flex items-center gap-2 font-semibold text-slate-900">
          <Shield className="h-4 w-4 text-slate-500" />
          Cobertura
        </h3>
        {canManage && hasInsurance && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialog({ open: true, authorization: null })}
          >
            <Plus className="h-4 w-4" />
            Nueva autorización
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
        <span className="font-medium">{patient.insurance}</span>
        {patient.affiliateNumber && <span>Afiliado Nº {patient.affiliateNumber}</span>}
        {patient.insurancePlan && <span>Plan {patient.insurancePlan}</span>}
        <CoverageBadge coverage={coverage} />
      </div>

      {!hasInsurance ? (
        <p className="text-sm text-muted-foreground">
          Paciente particular. Para cargar autorizaciones, primero elegí su obra social en “Editar paciente”.
        </p>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : authorizations === null ? (
        <p className="text-sm text-muted-foreground">Cargando autorizaciones…</p>
      ) : authorizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay autorizaciones cargadas.</p>
      ) : (
        <ul className="space-y-2">
          {authorizations.map((authorization) => {
            const percent = Math.min(100, Math.round((authorization.used / authorization.sessions) * 100));
            return (
              <li
                key={authorization.id}
                aria-label={`Autorización ${authorization.number ?? "sin número"}`}
                className={cn(
                  "rounded-xl border border-slate-200 p-3",
                  !authorization.current && "opacity-60"
                )}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                      {authorization.number ? `Nº ${authorization.number}` : "Sin número"}
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-medium",
                          STATE_STYLES[authorization.state]
                        )}
                      >
                        {AUTHORIZATION_STATE_LABELS[authorization.state]}
                      </span>
                      {!authorization.current && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({authorization.insuranceName})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{period(authorization)}</p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Editar autorización"
                        onClick={() => setDialog({ open: true, authorization })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar autorización"
                        onClick={() => setToDelete(authorization)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Sesiones usadas"
                    aria-valuemin={0}
                    aria-valuemax={authorization.sessions}
                    aria-valuenow={authorization.used}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        authorization.used >= authorization.sessions ? "bg-red-400" : "bg-brand-500"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-700">
                    {authorization.used} de {authorization.sessions} sesiones
                  </span>
                </div>
                {authorization.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{authorization.notes}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <AuthorizationDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
          insuranceName={patient.insurance}
          authorization={dialog.authorization}
          onSubmit={save}
        />
      )}

      <ConfirmAlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Eliminar la autorización?"
        description="Las sesiones que había consumido quedan sin autorización (o pasan a otra vigente, si hay)."
        confirmLabel="Eliminar"
        onConfirm={() => void remove()}
        destructive
      />
    </section>
  );
}
