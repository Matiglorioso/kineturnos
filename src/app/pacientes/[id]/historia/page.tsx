"use client";

import { ClinicalAccessLog } from "@/components/clinical/ClinicalAccessLog";
import { ClinicalEntryCard } from "@/components/clinical/ClinicalEntryCard";
import { ClinicalEntryForm } from "@/components/clinical/ClinicalEntryForm";
import { ClinicalProfileCard } from "@/components/clinical/ClinicalProfileCard";
import { TreatmentGoalsCard } from "@/components/clinical/TreatmentGoalsCard";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createClinicalEntryRequest,
  createTreatmentGoalRequest,
  deleteTreatmentGoalRequest,
  fetchClinicalHistory,
  saveClinicalProfileRequest,
  updateClinicalEntryRequest,
  updateTreatmentGoalRequest,
  type ClinicalEntryRequest,
} from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import { getSessionNumbers, splitClinicalAlerts } from "@/lib/clinical-history";
import { formatAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { showSuccessToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import type { ClinicalEntry, ClinicalHistory, TreatmentGoal } from "@/types";
import {
  AlertTriangle,
  ArrowLeft,
  FileHeart,
  Lock,
  Plus,
  Printer,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const ALL_PROFESSIONALS = "todos";

export default function HistoriaClinicaPage() {
  return (
    <Suspense fallback={<PageLoadingState title="Historia clínica" />}>
      <HistoriaClinicaContent />
    </Suspense>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-slate-200/70 print:ring-slate-300">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold text-slate-900">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CurrentItem({
  label,
  value,
}: {
  label: string;
  value: { text: string; date: string } | null;
}) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 print:break-inside-avoid">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-800">{label}</h2>
      {value ? (
        <>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">{value.text}</p>
          <p className="mt-2 text-xs text-muted-foreground">Desde el {formatAppDate(value.date)}</p>
        </>
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">Todavía no se cargó.</p>
      )}
    </section>
  );
}

function HistoriaClinicaContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const requestedAppointmentId = searchParams.get("turno");
  const { can } = usePermissions();
  const canWrite = can("clinical:write");

  const [history, setHistory] = useState<ClinicalHistory | null>(null);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerAppointmentId, setComposerAppointmentId] = useState<string | null>(null);
  const [professionalFilter, setProfessionalFilter] = useState(ALL_PROFESSIONALS);
  const openedFromAppointment = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setHistory(await fetchClinicalHistory(id));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? { message: loadError.message, status: loadError.status }
          : { message: "No se pudo cargar la historia clínica.", status: 0 }
      );
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Desde la agenda (?turno=...): abre "Nueva evolución" con ese turno elegido.
  useEffect(() => {
    if (!history || openedFromAppointment.current || !requestedAppointmentId || !canWrite) return;
    openedFromAppointment.current = true;
    if (history.sessionOptions.some((option) => option.id === requestedAppointmentId)) {
      setComposerAppointmentId(requestedAppointmentId);
      setComposerOpen(true);
    }
  }, [history, requestedAppointmentId, canWrite]);

  const sessionNumbers = useMemo(
    () => getSessionNumbers(history?.entries ?? []),
    [history]
  );
  const professionals = useMemo(
    () =>
      [...new Set((history?.entries ?? []).map((entry) => entry.professionalName ?? "Sin profesional"))].sort(),
    [history]
  );
  const visibleEntries = useMemo(
    () =>
      (history?.entries ?? []).filter(
        (entry) =>
          professionalFilter === ALL_PROFESSIONALS ||
          (entry.professionalName ?? "Sin profesional") === professionalFilter
      ),
    [history, professionalFilter]
  );

  const openComposer = () => {
    setComposerAppointmentId(null);
    setComposerOpen(true);
  };

  const handleCreate = async (body: ClinicalEntryRequest) => {
    await createClinicalEntryRequest(id, body);
    showSuccessToast("Sesión registrada", "La evolución quedó en la historia clínica.");
    setComposerOpen(false);
    await load();
  };

  const handleUpdate = async (entry: ClinicalEntry, body: ClinicalEntryRequest) => {
    await updateClinicalEntryRequest(id, entry.id, body);
    showSuccessToast("Registro corregido");
    await load();
  };

  const handleProfileSave = async (body: { alerts: string; background: string }) => {
    await saveClinicalProfileRequest(id, body);
    showSuccessToast("Alertas y antecedentes guardados");
    await load();
  };

  const handleGoalAdd = async (description: string) => {
    await createTreatmentGoalRequest(id, description);
    await load();
  };
  // Optimista: el check cambia al instante; si falla, se recarga el estado real.
  const handleGoalToggle = async (goal: TreatmentGoal) => {
    const achieved = !goal.achieved;
    setHistory((current) =>
      current && {
        ...current,
        goals: current.goals.map((item) => (item.id === goal.id ? { ...item, achieved } : item)),
      }
    );
    try {
      await updateTreatmentGoalRequest(id, goal.id, achieved);
    } catch (toggleError) {
      await load();
      throw toggleError;
    }
  };
  const handleGoalRemove = async (goal: TreatmentGoal) => {
    await deleteTreatmentGoalRequest(id, goal.id);
    await load();
  };

  const backLink = (
    <Button asChild variant="outline" size="sm" className="print:hidden">
      <Link href="/pacientes">
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Link>
    </Button>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Historia clínica">{backLink}</PageHeader>
        {error.status === 403 ? (
          <EmptyState icon={Lock} title="Sin acceso a esta historia clínica" description={error.message} />
        ) : (
          <DataLoadError message={error.message} onRetry={load} />
        )}
      </div>
    );
  }

  if (!history) {
    return <PageLoadingState title="Historia clínica" description="Cargando la historia del paciente..." />;
  }

  const { patient, entries, summary, sessionOptions, profile, goals, nextAppointment } = history;
  const alerts = splitClinicalAlerts(profile?.alerts);
  const lastEntry = entries[0];
  const achievedGoals = goals.filter((goal) => goal.achieved).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 print:hidden">
        {backLink}
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <p className="hidden text-xs text-slate-500 print:block">
        {siteConfig.clinicName} · Historia clínica · impresa el{" "}
        {new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
      </p>

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:shadow-none sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white print:hidden">
            {getInitials(patient.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Historia clínica</p>
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{patient.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              DNI {patient.dni} · {patient.insurance} · {patient.phone}
            </p>
          </div>
        </div>
        {alerts.length > 0 && (
          <ul aria-label="Alertas clínicas" className="mt-4 flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <li
                key={alert}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700"
              >
                <AlertTriangle className="h-4 w-4" />
                {alert}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sesiones registradas" value={String(entries.length)} />
        <Stat
          label="Última evolución"
          value={lastEntry ? formatAppDate(lastEntry.date) : "—"}
          hint={lastEntry?.professionalName ?? undefined}
        />
        <Stat
          label="Próximo turno"
          value={nextAppointment ? `${formatAppDate(nextAppointment.date, "dd/MM")} ${nextAppointment.time}` : "Sin turnos"}
          hint={nextAppointment?.professionalName}
        />
        <Stat
          label="Objetivos cumplidos"
          value={goals.length > 0 ? `${achievedGoals} de ${goals.length}` : "—"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] print:block">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Stethoscope className="h-5 w-5 text-slate-500" />
              Evolución
            </h2>
            {professionals.length > 1 && (
              <div className="w-full sm:w-60 print:hidden">
                <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                  <SelectTrigger aria-label="Filtrar por profesional" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_PROFESSIONALS}>Todos los profesionales</SelectItem>
                    {professionals.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon={FileHeart}
              title="Empezá la historia clínica"
              description="Cada sesión que registres va a aparecer acá, de la más reciente a la más antigua."
              actionLabel={canWrite ? "Nueva evolución" : undefined}
              onAction={canWrite ? openComposer : undefined}
            />
          ) : (
            <ol className="relative ml-1.5 space-y-4 border-l-2 border-slate-200 print:ml-0 print:border-0">
              {visibleEntries.map((entry) => (
                <ClinicalEntryCard
                  key={entry.id}
                  entry={entry}
                  sessionNumber={sessionNumbers.get(entry.id) ?? 0}
                  onUpdate={handleUpdate}
                />
              ))}
            </ol>
          )}

          {can("clinical:audit") && (
            <div className="print:hidden">
              <ClinicalAccessLog patientId={patient.id} />
            </div>
          )}
        </div>

        <aside className="order-first grid content-start gap-4 sm:grid-cols-2 xl:order-none xl:sticky xl:top-20 xl:grid-cols-1 xl:self-start print:mt-6 print:block print:space-y-3">
          {canWrite && (
            <Button type="button" className="w-full sm:col-span-2 xl:col-span-1 print:hidden" onClick={openComposer}>
              <Plus className="h-4 w-4" />
              Nueva evolución
            </Button>
          )}
          <CurrentItem label="Diagnóstico vigente" value={summary.diagnosis} />
          <CurrentItem label="Plan de tratamiento vigente" value={summary.treatment} />
          <TreatmentGoalsCard
            goals={goals}
            canEdit={canWrite}
            onAdd={handleGoalAdd}
            onToggle={handleGoalToggle}
            onRemove={handleGoalRemove}
          />
          <ClinicalProfileCard profile={profile} canEdit={canWrite} onSave={handleProfileSave} />
        </aside>
      </div>

      {canWrite && (
        <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
          <SheetContent>
            <div>
              <SheetTitle>Nueva evolución</SheetTitle>
              <SheetDescription>
                {patient.name} · sesión {entries.length + 1}
              </SheetDescription>
            </div>
            {composerOpen && (
              <ClinicalEntryForm
                idPrefix="nuevo"
                sessionOptions={sessionOptions}
                defaultAppointmentId={composerAppointmentId}
                current={{
                  diagnosis: summary.diagnosis?.text ?? null,
                  treatment: summary.treatment?.text ?? null,
                }}
                submitLabel="Guardar en la historia"
                onCancel={() => setComposerOpen(false)}
                onSubmit={handleCreate}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
