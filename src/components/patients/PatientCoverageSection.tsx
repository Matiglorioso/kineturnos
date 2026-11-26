"use client";

import { AuthorizationDialog } from "@/components/patients/AuthorizationDialog";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { DetailRow, DetailSection, detailRowsClassName } from "@/components/shared/DetailSection";
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
import { APP_DATE_FORMAT, formatAppDate } from "@/lib/date-utils";
import { AUTHORIZATION_STATE_LABELS } from "@/lib/insurance";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Authorization, Patient, PatientCoverage } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  className?: string;
  /** "mobile": como el boceto del celular (tarjeta de datos, autorizaciones con barra y la acción abajo). */
  variant?: "desktop" | "mobile";
}

function period(authorization: Authorization): string {
  const from = formatAppDate(authorization.validFrom, APP_DATE_FORMAT);
  return authorization.validUntil
    ? `${from} al ${formatAppDate(authorization.validUntil, APP_DATE_FORMAT)}`
    : `desde ${from}`;
}

/** Obra social, datos de afiliado y autorizaciones del paciente (RF07, RF14, RF15). */
export function PatientCoverageSection({
  patient,
  canManage,
  onChanged,
  className,
  variant = "desktop",
}: PatientCoverageSectionProps) {
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

  const dialogs = (
    <>
      {canManage && (
        <AuthorizationDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
          insuranceName={patient.insurance}
          authorization={dialog.authorization}
          onSubmit={save}
          onDelete={
            variant === "mobile" && dialog.authorization
              ? () => {
                  setToDelete(dialog.authorization);
                  setDialog((current) => ({ ...current, open: false }));
                }
              : undefined
          }
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
    </>
  );

  if (variant === "mobile") {
    return (
      <>
        <div className={cn("flex-1 overflow-y-auto px-3 pb-3", className)}>
          <dl className="rounded-2xl border border-slate-200/80 bg-white">
            <MobileRow label="Obra social">{patient.insurance}</MobileRow>
            {patient.affiliateNumber && <MobileRow label="Afiliado">{patient.affiliateNumber}</MobileRow>}
            {patient.insurancePlan && <MobileRow label="Plan">{patient.insurancePlan}</MobileRow>}
          </dl>

          {hasInsurance && (
            <p className="mx-1 mb-1.5 mt-3 text-[11px] font-bold uppercase tracking-wide text-brand-800">
              Autorizaciones
            </p>
          )}
          {!hasInsurance ? (
            <p className="mx-1 mt-2.5 text-xs text-muted-foreground">
              Paciente particular. Para cargar autorizaciones, primero elegí su obra social en “Editar paciente”.
            </p>
          ) : loadError ? (
            <p className="mx-1 text-sm text-destructive">{loadError}</p>
          ) : authorizations === null ? (
            <p className="mx-1 text-xs text-muted-foreground">Cargando autorizaciones…</p>
          ) : authorizations.length === 0 ? (
            <p className="mx-1 text-xs text-muted-foreground">Todavía no hay autorizaciones cargadas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              {authorizations.map((authorization) => {
                const percent = Math.min(
                  100,
                  Math.round((authorization.used / Math.max(1, authorization.sessions)) * 100)
                );
                const body = (
                  <>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {authorization.number ? `Nº ${authorization.number}` : "Sin número"}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          STATE_STYLES[authorization.state]
                        )}
                      >
                        {AUTHORIZATION_STATE_LABELS[authorization.state]}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {period(authorization)} · {authorization.used} de {authorization.sessions} sesiones
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          authorization.used >= authorization.sessions ? "bg-red-500" : "bg-brand-600"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </>
                );
                return (
                  <li
                    key={authorization.id}
                    aria-label={`Autorización ${authorization.number ?? "sin número"}`}
                    className={cn(!authorization.current && "opacity-60")}
                  >
                    {canManage ? (
                      <button
                        type="button"
                        className="block w-full px-3.5 py-3 text-left"
                        onClick={() => setDialog({ open: true, authorization })}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="px-3.5 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {canManage && hasInsurance && (
          <div className="border-t border-slate-200/80 bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <Button
              type="button"
              className="h-12 w-full text-[15px]"
              onClick={() => setDialog({ open: true, authorization: null })}
            >
              Nueva autorización
            </Button>
          </div>
        )}
        {dialogs}
      </>
    );
  }

  return (
    <DetailSection
      title="Obra social"
      className={className}
      action={
        canManage && hasInsurance ? (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => setDialog({ open: true, authorization: null })}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva autorización
          </Button>
        ) : undefined
      }
    >
      <dl className={detailRowsClassName}>
        <DetailRow label="Obra social">
          <span className="flex flex-wrap items-center gap-2">
            {patient.insurance}
            <CoverageBadge coverage={coverage} />
          </span>
        </DetailRow>
        {patient.affiliateNumber && <DetailRow label="Afiliado">{patient.affiliateNumber}</DetailRow>}
        {patient.insurancePlan && <DetailRow label="Plan">{patient.insurancePlan}</DetailRow>}
      </dl>

      {!hasInsurance ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Paciente particular. Para cargar autorizaciones, primero elegí su obra social en “Editar paciente”.
        </p>
      ) : loadError ? (
        <p className="mt-2 text-sm text-destructive">{loadError}</p>
      ) : authorizations === null ? (
        <p className="mt-2 text-xs text-muted-foreground">Cargando autorizaciones…</p>
      ) : authorizations.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Todavía no hay autorizaciones cargadas.</p>
      ) : (
        // Una autorización por renglón: número, estado, sesiones usadas y período.
        <ul className="mt-2 divide-y divide-slate-100 border-t border-slate-100">
          {authorizations.map((authorization) => (
            <li
              key={authorization.id}
              aria-label={`Autorización ${authorization.number ?? "sin número"}`}
              className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 py-1.5 text-sm", !authorization.current && "opacity-60")}
              title={authorization.notes ?? undefined}
            >
              <span className="min-w-0 truncate font-medium text-slate-900">
                {authorization.number ? `Nº ${authorization.number}` : "Sin número"}
              </span>
              <span
                className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium", STATE_STYLES[authorization.state])}
              >
                {AUTHORIZATION_STATE_LABELS[authorization.state]}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  authorization.used >= authorization.sessions ? "font-semibold text-red-600" : "text-slate-600"
                )}
              >
                {authorization.used}/{authorization.sessions} ses.
              </span>
              <span className="order-last basis-full text-xs text-muted-foreground">{period(authorization)}</span>
              {canManage && (
                <span className="ml-auto flex shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Editar autorización"
                    onClick={() => setDialog({ open: true, authorization })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar autorización"
                    onClick={() => setToDelete(authorization)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialogs}
    </DetailSection>
  );
}

/** Renglón de la tarjeta del celular: etiqueta a la izquierda, valor a la derecha. */
export function MobileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-slate-100 px-3.5 py-3 text-sm first:border-t-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-slate-900">{children}</dd>
    </div>
  );
}
