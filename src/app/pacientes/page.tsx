"use client";

import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientDetailDialog } from "@/components/patients/PatientDetailDialog";
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
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import { countPatientAppointments } from "@/lib/patient-appointments";
import { showSuccessToast } from "@/lib/toast";
import { Patient } from "@/types";
import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

export default function PacientesPage() {
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
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] =
    useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const deleteAppointmentCount = useMemo(() => {
    if (!patientToDelete) return 0;
    return countPatientAppointments(appointments, patientToDelete.id);
  }, [patientToDelete, appointments]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return patients;

    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.dni.includes(query) ||
        p.phone.includes(query) ||
        p.insurance.toLowerCase().includes(query) ||
        (p.email?.toLowerCase().includes(query) ?? false)
    );
  }, [patients, search]);

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
        description={`${patients.length} registrados · ${activeCount} activos`}
        actionLabel={emptyStateActions.registerPatient}
        actionIcon={UserPlus}
        onAction={openDialog}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, DNI, teléfono u obra social…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} resultado{filtered.length !== 1 && "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyStateFromPreset
          preset={
            search.trim()
              ? emptyStates.patients.noResults
              : emptyStates.patients.none
          }
          actionLabel={search.trim() ? undefined : emptyStateActions.registerPatient}
          onAction={search.trim() ? undefined : openDialog}
          secondaryActionLabel={
            search.trim() ? emptyStateActions.clearSearch : undefined
          }
          onSecondaryAction={
            search.trim() ? () => setSearch("") : undefined
          }
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
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </>
      )}

      <NewPatientDialog
        open={dialogOpen}
        onOpenChange={handlePatientDialogChange}
        onSubmit={handlePatientSubmit}
        editingPatient={editingPatient}
        existingPatients={patients}
      />

      <PatientDetailDialog
        patient={selectedPatient}
        appointments={appointments}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        onDeleteRequest={handleDeleteRequest}
        onToggleStatus={handleToggleStatus}
        onEdit={openEditFromDetail}
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
