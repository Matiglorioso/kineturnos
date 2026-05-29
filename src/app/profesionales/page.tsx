"use client";

import { NewProfessionalDialog } from "@/components/professionals/NewProfessionalDialog";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { ProfessionalDetailDialog } from "@/components/professionals/ProfessionalDetailDialog";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { useAppointments } from "@/hooks/use-appointments";
import { useProfessionals } from "@/hooks/use-professionals";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { getTodayAppDate } from "@/lib/date-utils";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import {
  countProfessionalAppointments,
  getProfessionalTodayCount,
} from "@/lib/professional-utils";
import { showSuccessToast } from "@/lib/toast";
import { Professional } from "@/types";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

export default function ProfesionalesPage() {
  const {
    professionals,
    isLoading,
    error,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  } = useProfessionals();
  const { appointments } = useAppointments();
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

  const handleSubmit = async (professional: Professional) => {
    if (editingProfessional) {
      await updateProfessional(professional);
    } else {
      await createProfessional(professional);
    }
  };

  const handleToggleActive = async (professional: Professional) => {
    if (!professional.active) {
      await updateProfessional({ ...professional, active: true });
      return;
    }

    runAfterDetailClose(() => setProfessionalToDeactivate(professional));
  };

  const handleDeleteRequest = (professional: Professional) => {
    runAfterDetailClose(() => setProfessionalToDelete(professional));
  };

  const confirmDeactivateProfessional = async () => {
    if (!professionalToDeactivate) return;

    await updateProfessional({
      ...professionalToDeactivate,
      active: false,
    });
    setProfessionalToDeactivate(null);
  };

  const confirmDeleteProfessional = async () => {
    if (!professionalToDelete) return;

    const deletedName = professionalToDelete.name;

    await deleteProfessional(professionalToDelete.id);
    setProfessionalToDelete(null);
    showSuccessToast(
      "Profesional eliminado",
      `${deletedName} se elimino correctamente.`
    );
  };

  const deleteDescription = professionalToDelete
    ? buildPermanentDeleteDescription(
        professionalToDelete.name,
        deleteAppointmentCount
      )
    : "";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profesionales"
          description="Cargando profesionales..."
        />
        <p className="text-sm text-muted-foreground">
          Conectando con la base de datos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profesionales" description="Error al cargar" />
        <EmptyStateFromPreset
          preset={emptyStates.professionals.none}
          actionLabel="Reintentar"
          onAction={() => window.location.reload()}
        />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

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
        existingProfessionals={professionals}
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
