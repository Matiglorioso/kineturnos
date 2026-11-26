"use client";

import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { CoverageBadge } from "@/components/patients/CoverageBadge";
import { PatientDetailDialog } from "@/components/patients/PatientDetailDialog";
import { PatientListControls } from "@/components/patients/PatientListControls";
import { PatientTable } from "@/components/patients/PatientTable";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/ui/ListPagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppointments } from "@/hooks/use-appointments";
import { useInsurances } from "@/hooks/use-insurances";
import { usePagination } from "@/hooks/use-pagination";
import { usePatients } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import { countPatientAppointments } from "@/lib/patient-appointments";
import {
  ALL_INSURANCES,
  ALL_STATUSES,
  DEFAULT_PATIENT_LIST_OPTIONS,
  filterAndSortPatients,
  getInsuranceOptions,
  type PatientSort,
  type PatientStatusFilter,
} from "@/lib/patient-list";
import { showSuccessToast } from "@/lib/toast";
import { Patient } from "@/types";
import { cn } from "@/lib/utils";
import { Plus, Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

export default function PacientesPage() {
  return (
    <Suspense
      fallback={
        <PageLoadingState
          title="Pacientes"
          description="Cargando listado de pacientes..."
        />
      }
    >
      <PacientesPageContent />
    </Suspense>
  );
}

function PacientesPageContent() {
  const searchParams = useSearchParams();
  const {
    patients,
    isLoading,
    error,
    refresh,
    createPatient,
    updatePatient,
    deletePatient,
  } = usePatients();
  const { appointments } = useAppointments();
  const { canManagePatients } = usePermissions();
  const { insurances, setInsurances } = useInsurances({ enabled: canManagePatients });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PatientSort>(DEFAULT_PATIENT_LIST_OPTIONS.sort);
  const [insurance, setInsurance] = useState(ALL_INSURANCES);
  const [status, setStatus] = useState<PatientStatusFilter>(ALL_STATUSES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] =
    useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query != null) {
      setSearch(query);
    }
  }, [searchParams]);

  // ?paciente=<id> (desde las acciones de un turno): abre esa ficha y limpia la URL.
  const requestedPatientId = searchParams.get("paciente");
  useEffect(() => {
    if (!requestedPatientId) return;
    const patient = patients.find((item) => item.id === requestedPatientId);
    if (!patient) return;
    setSelectedPatient(patient);
    setDetailOpen(true);
    window.history.replaceState(null, "", "/pacientes");
  }, [requestedPatientId, patients]);

  // Desde el panel ("Nuevo paciente"): abre el alta y limpia el parámetro de la URL.
  useEffect(() => {
    if (searchParams.get("nuevo") !== "1" || !canManagePatients) return;
    setEditingPatient(null);
    setDialogOpen(true);
    window.history.replaceState(null, "", "/pacientes");
  }, [searchParams, canManagePatients]);

  const deleteAppointmentCount = useMemo(() => {
    if (!patientToDelete) return 0;
    return countPatientAppointments(appointments, patientToDelete.id);
  }, [patientToDelete, appointments]);

  const filtered = useMemo(
    () => filterAndSortPatients(patients, { search, insurance, status, sort }),
    [patients, search, insurance, status, sort]
  );
  const pagination = usePagination(filtered, {
    storageKey: "pacientes",
    resetKey: `${search}|${insurance}|${status}|${sort}`,
  });
  const insuranceOptions = useMemo(() => getInsuranceOptions(patients), [patients]);
  const isFiltering =
    search.trim() !== "" || insurance !== ALL_INSURANCES || status !== ALL_STATUSES;
  const clearFilters = () => {
    setSearch("");
    setInsurance(ALL_INSURANCES);
    setStatus(ALL_STATUSES);
  };

  const openDialog = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setDialogOpen(true);
  };

  const handlePatientDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPatient(null);
    }
  };

  const handlePatientSubmit = async (patient: Patient) => {
    setIsSaving(true);

    try {
      if (editingPatient) {
        await updatePatient(patient);
      } else {
        await createPatient(patient);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openPatientDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailOpen(true);
  };

  const runAfterDetailClose = (action: () => void) => {
    closeDetailBeforeAction(
      () => setDetailOpen(false),
      () => setSelectedPatient(null),
      action
    );
  };

  const openEditFromDetail = (patient: Patient) => {
    runAfterDetailClose(() => openEditDialog(patient));
  };

  const handleToggleStatus = async (patient: Patient) => {
    if (patient.status === "inactivo") {
      setIsSaving(true);
      try {
        await updatePatient({ ...patient, status: "activo" });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    runAfterDetailClose(() => setPatientToDeactivate(patient));
  };

  const confirmDeactivatePatient = async () => {
    if (!patientToDeactivate) return;

    setIsSaving(true);
    try {
      await updatePatient({ ...patientToDeactivate, status: "inactivo" });
      setPatientToDeactivate(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (patient: Patient) => {
    runAfterDetailClose(() => setPatientToDelete(patient));
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    const deletedName = patientToDelete.name;

    setIsSaving(true);
    try {
      await deletePatient(patientToDelete.id);
      setPatientToDelete(null);
      showSuccessToast(
        "Paciente eliminado",
        `${deletedName} se elimino correctamente.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  useSyncSelectedEntity({
    items: patients,
    selected: selectedPatient,
    detailOpen,
    setSelected: setSelectedPatient,
    setDetailOpen,
  });

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedPatient(null);
    }
  };

  const deleteDescription = patientToDelete
    ? buildPermanentDeleteDescription(
        patientToDelete.name,
        deleteAppointmentCount
      )
    : "";

  if (isLoading) {
    return <PageLoadingState title="Pacientes" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pacientes" description="Error al cargar" />
        <DataLoadError message={error} onRetry={() => void refresh()} />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Celular: título y "+" (como el boceto). */}
      <div className="flex items-end justify-between gap-3 lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {patients.length} {patients.length === 1 ? "paciente" : "pacientes"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pacientes</h1>
        </div>
        {canManagePatients && (
          <Button type="button" size="icon" aria-label="Nuevo paciente" className="h-10 w-10 rounded-xl" onClick={openDialog}>
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      <PageHeader
        className="max-lg:hidden"
        title="Pacientes"
        description="Datos, cobertura, turnos e historia clínica de cada paciente."
        actionLabel={
          canManagePatients ? emptyStateActions.registerPatient : undefined
        }
        actionIcon={canManagePatients ? UserPlus : undefined}
        onAction={canManagePatients ? openDialog : undefined}
      />

      {/* Con tres filtros, el buscador va en su propia fila salvo en pantallas muy anchas. */}
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex gap-2 2xl:max-w-md 2xl:flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-10 lg:h-10"
              aria-label="Buscar pacientes"
              placeholder="Nombre, DNI u obra social…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isSaving}
            />
          </div>
          {/* Celular: orden y filtros detrás de un botón, para que la lista arranque arriba. */}
          <Button
            type="button"
            variant="outline"
            aria-expanded={filtersOpen}
            className="h-11 shrink-0 lg:hidden"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
        </div>
        <div
          className={cn(
            "flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:flex",
            filtersOpen ? "flex" : "hidden"
          )}
        >
          <PatientListControls
            sort={sort}
            onSortChange={setSort}
            insurance={insurance}
            onInsuranceChange={setInsurance}
            insuranceOptions={insuranceOptions}
            status={status}
            onStatusChange={setStatus}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyStateFromPreset
          preset={
            isFiltering
              ? emptyStates.patients.noResults
              : emptyStates.patients.none
          }
          actionLabel={
            isFiltering || !canManagePatients
              ? undefined
              : emptyStateActions.registerPatient
          }
          onAction={
            isFiltering || !canManagePatients ? undefined : openDialog
          }
          secondaryActionLabel={
            !isFiltering
              ? undefined
              : insurance !== ALL_INSURANCES
                ? "Limpiar filtros"
                : emptyStateActions.clearSearch
          }
          onSecondaryAction={isFiltering ? clearFilters : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="hidden lg:block">
            <PatientTable
              patients={pagination.items}
              onViewDetail={openPatientDetail}
            />
          </div>
          {/* Celular: un paciente por fila (nombre; DNI y obra social; aviso de cobertura si hay). */}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:hidden">
            {pagination.items.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  aria-label={`Ver detalle de ${patient.name}`}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted/60"
                  onClick={() => openPatientDetail(patient)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">
                      {patient.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      DNI {patient.dni} · {patient.insurance}
                      {patient.status === "inactivo" ? " · Inactivo" : ""}
                    </span>
                  </span>
                  <CoverageBadge coverage={patient.coverage} size="xs" short onlyIssues />
                </button>
              </li>
            ))}
          </ul>
          <ListPagination pagination={pagination} itemLabel="pacientes" itemLabelSingular="paciente" />
        </div>
      )}


      {canManagePatients && (
        <NewPatientDialog
          open={dialogOpen}
          onOpenChange={handlePatientDialogChange}
          onSubmit={handlePatientSubmit}
          editingPatient={editingPatient}
          existingPatients={patients}
          insurances={insurances}
          onInsuranceCreated={(created) =>
            setInsurances((current) =>
              [...current, created].sort((a, b) => a.name.localeCompare(b.name, "es"))
            )
          }
        />
      )}

      <PatientDetailDialog
        patient={selectedPatient}
        appointments={appointments}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        onDeleteRequest={
          canManagePatients ? handleDeleteRequest : undefined
        }
        onToggleStatus={
          canManagePatients ? handleToggleStatus : undefined
        }
        onEdit={canManagePatients ? openEditFromDetail : undefined}
        onCoverageChange={() => void refresh({ silent: true })}
      />

      <ConfirmAlertDialog
        open={Boolean(patientToDeactivate)}
        onOpenChange={(open) => {
          if (!open) setPatientToDeactivate(null);
        }}
        title="Desactivar paciente"
        description={
          patientToDeactivate
            ? `${patientToDeactivate.name} quedará inactivo y no se le podrán agendar turnos nuevos. Si tiene turnos pendientes o confirmados, primero hay que cancelarlos o registrar la asistencia.`
            : ""
        }
        confirmLabel="Sí, desactivar"
        destructive
        onConfirm={confirmDeactivatePatient}
      />

      <ConfirmAlertDialog
        open={Boolean(patientToDelete)}
        onOpenChange={(open) => {
          if (!open) setPatientToDelete(null);
        }}
        title="Eliminar paciente"
        description={deleteDescription}
        confirmLabel="Sí, eliminar paciente"
        destructive
        onConfirm={confirmDeletePatient}
      />
    </div>
  );
}
