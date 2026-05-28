"use client";

import { NewPatientDialog } from "@/components/patients/NewPatientDialog";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientDetailDialog } from "@/components/patients/PatientDetailDialog";
import { PatientTable } from "@/components/patients/PatientTable";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/PageHeader";
import { mockAppointments } from "@/data/mockAppointments";
import { mockPatients } from "@/data/mockPatients";
import {
  usePersistedAppointments,
  usePersistedPatients,
} from "@/hooks/use-persisted-data";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import {
  countPatientAppointments,
  removePatientAppointments,
} from "@/lib/patient-appointments";
import { appToasts, showSuccessToast } from "@/lib/toast";
import { Patient } from "@/types";
import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

export default function PacientesPage() {
  const { data: patients, setData: setPatients } =
    usePersistedPatients(mockPatients);
  const { data: appointments, setData: setAppointments } =
    usePersistedAppointments(mockAppointments);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] =
    useState<Patient | null>(null);

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

  const handlePatientSubmit = (patient: Patient) => {
    if (editingPatient) {
      setPatients((prev) =>
        prev.map((item) => (item.id === patient.id ? patient : item))
      );
      appToasts.patient.updated(patient.name);
    } else {
      setPatients((prev) => [patient, ...prev]);
      appToasts.patient.created(patient.name);
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

  const setPatientStatus = (patient: Patient, status: Patient["status"]) => {
    setPatients((prev) =>
      prev.map((item) =>
        item.id === patient.id ? { ...item, status } : item
      )
    );
  };

  const handleToggleStatus = (patient: Patient) => {
    if (patient.status === "inactivo") {
      setPatientStatus(patient, "activo");
      return;
    }

    runAfterDetailClose(() => setPatientToDeactivate(patient));
  };

  const confirmDeactivatePatient = () => {
    if (!patientToDeactivate) return;

    setPatientStatus(patientToDeactivate, "inactivo");
    setPatientToDeactivate(null);
  };

  const handleDeleteRequest = (patient: Patient) => {
    runAfterDetailClose(() => setPatientToDelete(patient));
  };

  const confirmDeletePatient = () => {
    if (!patientToDelete) return;

    const deletedName = patientToDelete.name;

    setPatients((prev) =>
      prev.filter((patient) => patient.id !== patientToDelete.id)
    );
    setAppointments((prev) =>
      removePatientAppointments(prev, patientToDelete.id)
    );

    setPatientToDelete(null);
    showSuccessToast("Paciente eliminado", `${deletedName} se elimino correctamente.`);
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
