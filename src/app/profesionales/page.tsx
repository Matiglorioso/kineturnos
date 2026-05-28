"use client";

import { NewProfessionalDialog } from "@/components/professionals/NewProfessionalDialog";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { ProfessionalDetailDialog } from "@/components/professionals/ProfessionalDetailDialog";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { mockAppointments } from "@/data/mockAppointments";
import { mockProfessionals } from "@/data/mockProfessionals";
import {
  usePersistedAppointments,
  usePersistedProfessionals,
} from "@/hooks/use-persisted-data";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { getTodayAppDate } from "@/lib/date-utils";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import {
  countProfessionalAppointments,
  getProfessionalTodayCount,
  removeProfessionalAppointments,
} from "@/lib/professional-utils";
import { appToasts } from "@/lib/toast";
import { Professional } from "@/types";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

export default function ProfesionalesPage() {
  const { data: professionals, setData: setProfessionals } =
    usePersistedProfessionals(mockProfessionals);
  const { data: appointments, setData: setAppointments } =
    usePersistedAppointments(mockAppointments);
  const [today] = useState(() => getTodayAppDate());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [professionalToDeactivate, setProfessionalToDeactivate] =
    useState<Professional | null>(null);
  const [professionalToDelete, setProfessionalToDelete] =
    useState<Professional | null>(null);
  const deleteAppointmentCount = useMemo(() => {
    if (!professionalToDelete) return 0;
    return countProfessionalAppointments(
      appointments,
      professionalToDelete.id
    );
  }, [professionalToDelete, appointments]);

  useSyncSelectedEntity({
    items: professionals,
    selected: selectedProfessional,
    detailOpen,
    setSelected: setSelectedProfessional,
    setDetailOpen,
  });

  const runAfterDetailClose = (action: () => void) => {
    closeDetailBeforeAction(
      () => setDetailOpen(false),
      () => setSelectedProfessional(null),
      action
    );
  };

  const activeCount = professionals.filter((p) => p.active).length;
  const totalToday = useMemo(
    () =>
      professionals.reduce(
        (sum, professional) =>
          sum +
          getProfessionalTodayCount(appointments, professional.id, today),
        0
      ),
    [professionals, appointments, today]
  );

  const openCreateDialog = () => {
    setEditingProfessional(null);
    setDialogOpen(true);
  };

  const openEditDialog = (professional: Professional) => {
    setEditingProfessional(professional);
    setDialogOpen(true);
  };

  const openDetailDialog = (professional: Professional) => {
    setSelectedProfessional(professional);
    setDetailOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProfessional(null);
    }
  };

  const handleSubmit = (professional: Professional) => {
    if (editingProfessional) {
      setProfessionals((prev) =>
        prev.map((item) =>
          item.id === professional.id ? professional : item
        )
      );
      appToasts.professional.updated(professional.name);
    } else {
      setProfessionals((prev) => [professional, ...prev]);
      appToasts.professional.created(professional.name);
    }
  };

  const setProfessionalActive = (professional: Professional, active: boolean) => {
    setProfessionals((prev) =>
      prev.map((item) =>
        item.id === professional.id ? { ...item, active } : item
      )
    );

    if (!active) {
      appToasts.professional.deactivated(professional.name);
    }
  };

  const handleToggleActive = (professional: Professional) => {
    if (!professional.active) {
      setProfessionalActive(professional, true);
      return;
    }

    runAfterDetailClose(() => setProfessionalToDeactivate(professional));
  };

  const handleDeleteRequest = (professional: Professional) => {
    runAfterDetailClose(() => setProfessionalToDelete(professional));
  };

  const confirmDeactivateProfessional = () => {
    if (!professionalToDeactivate) return;

    setProfessionalActive(professionalToDeactivate, false);
    setProfessionalToDeactivate(null);
  };

  const confirmDeleteProfessional = () => {
    if (!professionalToDelete) return;

    const deletedName = professionalToDelete.name;
    const deletedAppointments = countProfessionalAppointments(
      appointments,
      professionalToDelete.id
    );

    setProfessionals((prev) =>
      prev.filter((item) => item.id !== professionalToDelete.id)
    );
    setAppointments((prev) =>
      removeProfessionalAppointments(prev, professionalToDelete.id)
    );

    setProfessionalToDelete(null);
  };

  const deleteDescription = professionalToDelete
    ? buildPermanentDeleteDescription(
        professionalToDelete.name,
        deleteAppointmentCount
      )
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesionales"
        description={`${professionals.length} kinesiólogos · ${activeCount} activos · ${totalToday} turnos hoy`}
        actionLabel={emptyStateActions.registerProfessional}
        actionIcon={UserPlus}
        onAction={openCreateDialog}
      />

      {professionals.length === 0 ? (
        <EmptyStateFromPreset
          preset={emptyStates.professionals.none}
          actionLabel={emptyStateActions.registerProfessional}
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              todayAppointments={getProfessionalTodayCount(
                appointments,
                professional.id,
                today
              )}
              onViewDetail={openDetailDialog}
              onEdit={openEditDialog}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <NewProfessionalDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSubmit={handleSubmit}
        editingProfessional={editingProfessional}
        existingCount={professionals.length}
      />

      <ProfessionalDetailDialog
        professional={selectedProfessional}
        appointments={appointments}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedProfessional(null);
        }}
        onDeleteRequest={handleDeleteRequest}
      />

      <ConfirmAlertDialog
        open={Boolean(professionalToDeactivate)}
        onOpenChange={(open) => {
          if (!open) setProfessionalToDeactivate(null);
        }}
        title="Desactivar profesional"
        description={
          professionalToDeactivate
            ? `${professionalToDeactivate.name} dejara de aparecer al crear turnos nuevos. Los turnos existentes no se modifican.`
            : ""
        }
        confirmLabel="Sí, desactivar"
        destructive
        onConfirm={confirmDeactivateProfessional}
      />

      <ConfirmAlertDialog
        open={Boolean(professionalToDelete)}
        onOpenChange={(open) => {
          if (!open) setProfessionalToDelete(null);
        }}
        title="Eliminar profesional"
        description={deleteDescription}
        confirmLabel="Sí, eliminar profesional"
        destructive
        onConfirm={confirmDeleteProfessional}
      />
    </div>
  );
}
