"use client";

import { ClinicalEntryCard } from "@/components/clinical/ClinicalEntryCard";
import { ClinicalEntryForm } from "@/components/clinical/ClinicalEntryForm";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
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
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  createClinicalEntryRequest,
  fetchClinicalHistory,
  updateClinicalEntryRequest,
  type ClinicalEntryRequest,
} from "@/lib/api/clinical-history-client";
import { ApiError } from "@/lib/api/fetch-json";
import { fetchProfessionals } from "@/lib/api/professionals-client";
import { getSessionNumbers } from "@/lib/clinical-history";
import { formatAge } from "@/lib/birth-date";
import { formatAppDate, getTodayAppDate } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { showSuccessToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";
import type { ClinicalEntry, ClinicalHistory } from "@/types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
/** Evoluciones por página en la línea de tiempo (al imprimir salen todas). */
/** Sesiones por página en el celular (tarjetas). */
const ENTRIES_PER_PAGE = 3;

export default function HistoriaClinicaPage() {
  return (
    <Suspense fallback={<PageLoadingState title="Historia clínica" />}>
      <HistoriaClinicaContent />
    </Suspense>
  );
}

function HistoriaClinicaContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const requestedAppointmentId = searchParams.get("turno");
  const { can, professionalId: ownProfessionalId } = usePermissions();
  const canWrite = can("clinical:write");
  // Administración elige quién atendió; el Profesional registra a su nombre (se muestra fijo).
  const [professionalOptions, setProfessionalOptions] = useState<{ id: string; name: string }[]>();
  useEffect(() => {
    if (!canWrite) return;
    fetchProfessionals()
      .then((list) =>
        setProfessionalOptions(list.filter((item) => item.active).map((item) => ({ id: item.id, name: item.name })))
      )
      .catch(() => setProfessionalOptions([]));
  }, [canWrite]);

  const [history, setHistory] = useState<ClinicalHistory | null>(null);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerAppointmentId, setComposerAppointmentId] = useState<string | null>(null);
  const [professionalFilter, setProfessionalFilter] = useState(ALL_PROFESSIONALS);
  const [page, setPage] = useState(0);
  // En la computadora entran más sesiones por pantalla (renglones compactos).
  const isDesktop = useIsDesktop();
  const entriesPerPage = isDesktop ? 8 : ENTRIES_PER_PAGE;
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
    setPage(0);
    await load();
  };

  const handleUpdate = async (entry: ClinicalEntry, body: ClinicalEntryRequest) => {
    await updateClinicalEntryRequest(id, entry.id, body);
    showSuccessToast("Registro corregido");
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

  const { patient, entries, sessionOptions } = history;
  const composerAppointment = sessionOptions.find((option) => option.id === composerAppointmentId);
  const ownProfessionalName = ownProfessionalId
    ? (professionalOptions?.find((option) => option.id === ownProfessionalId)?.name ?? null)
    : null;
  const pageCount = Math.max(1, Math.ceil(visibleEntries.length / entriesPerPage));
  const currentPage = Math.min(page, pageCount - 1);

  return (
    <div className="space-y-5 max-lg:pb-20 lg:space-y-4">
      <div className="flex items-center justify-between gap-2 lg:hidden print:hidden">{backLink}</div>
      {/* Computadora: dónde estás, sin botón de volver. */}
      <nav aria-label="Ruta" className="hidden text-sm text-muted-foreground lg:block print:hidden">
        <Link href="/pacientes" className="hover:text-slate-900 hover:underline">
          Pacientes
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="text-slate-700">{patient.name}</span>
        <span className="mx-1.5 text-slate-400">/</span>
        <span>Historia clínica</span>
      </nav>

      <p className="hidden text-xs text-slate-500 print:block">
        {siteConfig.clinicName} · Historia clínica · impresa el{" "}
        {new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
      </p>

      <section
        aria-labelledby="historia-paciente"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:shadow-none sm:p-5 lg:px-4 lg:py-3 lg:shadow-none"
      >
        <div className="flex items-center gap-3 sm:gap-4 lg:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg lg:hidden print:hidden">
            {getInitials(patient.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700 lg:hidden">Historia clínica</p>
            <h1 id="historia-paciente" className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-xl">
              {patient.name}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm lg:text-[13px] lg:text-slate-600">
              {[
                `DNI ${patient.dni}`,
                patient.birthDate && `${formatAge(patient.birthDate)} (${formatAppDate(patient.birthDate)})`,
                patient.insurance,
                patient.phone,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <CoverageBadge coverage={patient.coverage} className="mt-2 lg:mt-1.5" />
          </div>
          {/* La acción principal de la pantalla, junto al paciente. */}
          <div className="flex shrink-0 items-center gap-2 max-lg:hidden print:hidden">
            {/* Imprimir no tiene sentido en el celular. */}
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            {canWrite && (
              <Button type="button" onClick={openComposer}>
                <Plus className="h-4 w-4" />
                Nueva evolución
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-4 lg:space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 lg:text-base">
              <Stethoscope className="h-5 w-5 text-slate-500 lg:hidden" />
              Evolución
            </h2>
            {professionals.length > 1 && (
              <div className="w-full sm:w-60 print:hidden">
                <Select
                  value={professionalFilter}
                  onValueChange={(value) => {
                    setProfessionalFilter(value);
                    setPage(0);
                  }}
                >
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
            <>
              {/* Celular: tarjetas; computadora: una lista compacta, una sesión por renglón. */}
              <ol className="relative space-y-3 lg:space-y-0 lg:divide-y lg:divide-slate-100 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white print:border-0">
                {visibleEntries.map((entry, index) => (
                  <ClinicalEntryCard
                    key={entry.id}
                    entry={entry}
                    sessionNumber={sessionNumbers.get(entry.id) ?? 0}
                    onUpdate={handleUpdate}
                    // Fuera de la página actual se ocultan en pantalla, pero se imprimen.
                    className={
                      Math.floor(index / entriesPerPage) === currentPage
                        ? undefined
                        : "hidden print:block"
                    }
                  />
                ))}
              </ol>
              {pageCount > 1 && (
                <nav
                  aria-label="Páginas de la evolución"
                  className="flex items-center justify-between gap-2 print:hidden"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Más recientes
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage * entriesPerPage + 1}–
                    {Math.min((currentPage + 1) * entriesPerPage, visibleEntries.length)} de{" "}
                    {visibleEntries.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pageCount - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Más antiguas
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              )}
            </>
          )}
      </div>

      {/* Celular: "Nueva evolución" fijo abajo, sobre la barra de navegación. */}
      {canWrite && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200/80 bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
          <Button type="button" className="h-12 w-full text-[15px]" onClick={openComposer}>
            <Plus className="h-5 w-5" />
            Nueva evolución
          </Button>
        </div>
      )}

      {canWrite && (
        <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
          <SheetContent
            // El cursor arranca en la evolución, que es lo que se escribe; fecha y profesional ya vienen.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              document.getElementById("nuevo-evolution")?.focus();
            }}
          >
            <div>
              <SheetTitle>Nueva evolución</SheetTitle>
              <SheetDescription>
                {patient.name} · sesión {entries.length + 1}
              </SheetDescription>
            </div>
            {composerOpen && (
              <ClinicalEntryForm
                idPrefix="nuevo"
                newEntry={{
                  today: getTodayAppDate(),
                  professionalOptions,
                  ownProfessionalName,
                  appointment: composerAppointment
                    ? {
                        id: composerAppointment.id,
                        date: composerAppointment.date,
                        professionalName: composerAppointment.professionalName,
                      }
                    : null,
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
