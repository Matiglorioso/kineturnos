"use client";

import { ClinicalAccessLog } from "@/components/clinical/ClinicalAccessLog";
import { ClinicalEntryCard } from "@/components/clinical/ClinicalEntryCard";
import { ClinicalEntryForm } from "@/components/clinical/ClinicalEntryForm";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createClinicalEntryRequest,
  fetchClinicalHistory,
  updateClinicalEntryRequest,
  type ClinicalEntryRequest,
} from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import { formatAppDate } from "@/lib/date-utils";
import { showSuccessToast } from "@/lib/toast";
import type { ClinicalEntry, ClinicalHistory } from "@/types";
import { ArrowLeft, FileHeart, Lock } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

export default function HistoriaClinicaPage() {
  return (
    <Suspense fallback={<PageLoadingState title="Historia clínica" />}>
      <HistoriaClinicaContent />
    </Suspense>
  );
}

function SummaryItem({ label, value }: { label: string; value: { text: string; date: string } | null }) {
  return (
    <div className="rounded-xl bg-brand-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-800">{label}</p>
      {value ? (
        <>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value.text}</p>
          <p className="mt-2 text-xs text-muted-foreground">Desde el {formatAppDate(value.date)}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Todavía no se cargó.</p>
      )}
    </div>
  );
}

function HistoriaClinicaContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const defaultAppointmentId = searchParams.get("turno");
  const { can } = usePermissions();

  const [history, setHistory] = useState<ClinicalHistory | null>(null);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);
  const [formKey, setFormKey] = useState(0);

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

  const handleCreate = async (body: ClinicalEntryRequest) => {
    await createClinicalEntryRequest(id, body);
    showSuccessToast("Sesión registrada", "La evolución quedó en la historia clínica.");
    setFormKey((key) => key + 1);
    await load();
  };

  const handleUpdate = async (entry: ClinicalEntry, body: ClinicalEntryRequest) => {
    await updateClinicalEntryRequest(id, entry.id, body);
    showSuccessToast("Registro corregido");
    await load();
  };

  const backLink = (
    <Button asChild variant="outline" className="w-full sm:w-auto">
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

  const { patient, entries, summary, sessionOptions } = history;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Historia clínica · ${patient.name}`}
        description={`DNI ${patient.dni} · ${patient.insurance}`}
      >
        {backLink}
      </PageHeader>

      <section aria-labelledby="vigente" className="grid gap-3 sm:grid-cols-2">
        <h2 id="vigente" className="sr-only">
          Diagnóstico y plan vigentes
        </h2>
        <SummaryItem label="Diagnóstico vigente" value={summary.diagnosis} />
        <SummaryItem label="Plan de tratamiento vigente" value={summary.treatment} />
      </section>

      {can("clinical:write") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Registrar sesión</h2>
          <ClinicalEntryForm
            key={formKey}
            idPrefix="nuevo"
            sessionOptions={sessionOptions}
            defaultAppointmentId={defaultAppointmentId}
            submitLabel="Guardar en la historia"
            onSubmit={handleCreate}
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">
          Evolución ({entries.length} {entries.length === 1 ? "registro" : "registros"})
        </h2>
        {entries.length === 0 ? (
          <EmptyState
            icon={FileHeart}
            title="Sin registros todavía"
            description="Cuando se registre la primera sesión, la evolución va a aparecer acá."
          />
        ) : (
          entries.map((entry) => (
            <ClinicalEntryCard key={entry.id} entry={entry} onUpdate={handleUpdate} />
          ))
        )}
      </section>

      {can("clinical:audit") && <ClinicalAccessLog patientId={patient.id} />}
    </div>
  );
}
