"use client";

import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientDetailDialog } from "@/components/patients/PatientDetailDialog";
import { PatientListControls } from "@/components/patients/PatientListControls";
import { PatientTable } from "@/components/patients/PatientTable";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import { countPatientAppointments } from "@/lib/patient-appointments";
import { pluralize } from "@/lib/pluralize";
import {
  ALL_INSURANCES,
  DEFAULT_PATIENT_LIST_OPTIONS,
  filterAndSortPatients,
  getInsuranceOptions,
  type PatientSort,
} from "@/lib/patient-list";
import { showSuccessToast } from "@/lib/toast";
import { Patient } from "@/types";
import { Search, UserPlus } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PatientSort>(DEFAULT_PATIENT_LIST_OPTIONS.sort);
  const [insurance, setInsurance] = useState(ALL_INSURANCES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] =
    useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query != null) {
      setSearch(query);
    }
  }, [searchParams]);

  const deleteAppointmentCount = useMemo(() => {
    if (!patientToDelete) return 0;
    return countPatientAppointments(appointments, patientToDelete.id);
  }, [patientToDelete, appointments]);

  const filtered = useMemo(
    () => filterAndSortPatients(patients, { search, insurance, sort }),
    [patients, search, insurance, sort]
  );
  const insuranceOptions = useMemo(() => getInsuranceOptions(patients), [patients]);
  const isFiltering = search.trim() !== "" || insurance !== ALL_INSURANCES;
  const clearFilters = () => {
    setSearch("");
    setInsurance(ALL_INSURANCES);
  };

  const activeCount = patients.filter((p) => p.status === "activo").length;

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
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description={`${pluralize(patients.length, "registrado")} · ${pluralize(activeCount, "activo")}`}
        actionLabel={
          canManagePatients ? emptyStateActions.registerPatient : undefined
        }
        actionIcon={canManagePatients ? UserPlus : undefined}
        onAction={canManagePatients ? openDialog : undefined}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, DNI, teléfono u obra social…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <PatientListControls
            sort={sort}
            onSortChange={setSort}
            insurance={insurance}
            onInsuranceChange={setInsurance}
            insuranceOptions={insuranceOptions}
          />
          <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
            {pluralize(filtered.length, "resultado")}
          </p>
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
        <>
          <div className="hidden lg:block">
            <PatientTable
              patients={filtered}
              onViewDetail={openPatientDetail}
            />
          </div>
          <div className="grid gap-4 lg:hidden">
            {filtered.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onViewDetail={openPatientDetail}
                onToggleStatus={
                  canManagePatients ? handleToggleStatus : undefined
                }
              />
            ))}
          </div>
        </>
      )}

      {canManagePatients && (
        <NewPatientDialog
          open={dialogOpen}
          onOpenChange={handlePatientDialogChange}
          onSubmit={handlePatientSubmit}
          editingPatient={editingPatient}
          existingPatients={patients}
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
      />

      <ConfirmAlertDialog
        open={Boolean(patientToDeactivate)}
        onOpenChange={(open) => {
          if (!open) setPatientToDeactivate(null);
        }}
        title="Desactivar paciente"
        description={
          patientToDeactivate
            ? `${patientToDeactivate.name} quedara marcado como inactivo. Sus turnos existentes no se modifican.`
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
