"use client";

import { NewProfessionalDialog } from "@/components/professionals/NewProfessionalDialog";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { ProfessionalDetailDialog } from "@/components/professionals/ProfessionalDetailDialog";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { useAppointments } from "@/hooks/use-appointments";
import { useProfessionals } from "@/hooks/use-professionals";
import { usePermissions } from "@/hooks/use-permissions";
import { useSyncSelectedEntity } from "@/hooks/use-sync-selected-entity";
import { closeDetailBeforeAction } from "@/lib/dialog-utils";
import { buildPermanentDeleteDescription } from "@/lib/entity-messages";
import { countProfessionalAppointments } from "@/lib/professional-utils";
import { showSuccessToast } from "@/lib/toast";
import { Professional } from "@/types";
import { Plus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ListPagination } from "@/components/ui/ListPagination";
import { getClinicScheduleLabel } from "@/lib/professional-utils";
import { usePagination } from "@/hooks/use-pagination";

export default function ProfesionalesPage() {
  const {
    professionals,
    isLoading,
    error,
    refresh,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  } = useProfessionals();
  const { appointments } = useAppointments();
  const { canManageProfessionals } = usePermissions();
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

  const pagination = usePagination(professionals, { storageKey: "profesionales" });

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
    return <PageLoadingState title="Profesionales" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profesionales" description="Error al cargar" />
        <DataLoadError message={error} onRetry={() => void refresh()} />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Celular: cantidad, título y "+" (como Pacientes). */}
      <div className="flex items-end justify-between gap-3 lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {professionals.length} {professionals.length === 1 ? "profesional" : "profesionales"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profesionales</h1>
        </div>
        {canManageProfessionals && (
          <Button type="button" size="icon" aria-label="Nuevo profesional" className="h-10 w-10 rounded-xl" onClick={openCreateDialog}>
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      <PageHeader
        className="max-lg:hidden"
        title="Profesionales"
        // El horario es el mismo para todos: se dice una vez acá y no en cada tarjeta.
        description={`El equipo de kinesiólogos. Horario del consultorio: ${getClinicScheduleLabel()}.`}
        actionLabel={
          canManageProfessionals
            ? emptyStateActions.registerProfessional
            : undefined
        }
        actionIcon={canManageProfessionals ? UserPlus : undefined}
        onAction={canManageProfessionals ? openCreateDialog : undefined}
      />

      {professionals.length === 0 ? (
        <EmptyStateFromPreset
          preset={emptyStates.professionals.none}
          actionLabel={
            canManageProfessionals
              ? emptyStateActions.registerProfessional
              : undefined
          }
          onAction={canManageProfessionals ? openCreateDialog : undefined}
        />
      ) : (
        <div className="space-y-4">
          {/* Celular: una fila por profesional (nombre arriba; especialidad y días abajo). */}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:hidden">
            {pagination.items.map((professional) => (
              <li key={professional.id}>
                <button
                  type="button"
                  aria-label={`Ver detalle de ${professional.name}`}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-muted/60"
                  onClick={() => openDetailDialog(professional)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{professional.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {professional.specialty} · {professional.days.map((day) => day.slice(0, 3)).join(" · ")}
                    </span>
                  </span>
                  {/* Solo se avisa lo que no es lo normal. */}
                  {!professional.active && (
                    <Badge variant="neutral" className="shrink-0 py-0.5 text-[11px]">
                      Inactivo
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden gap-6 sm:grid-cols-2 lg:grid xl:grid-cols-3">
            {pagination.items.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onViewDetail={openDetailDialog}
              />
            ))}
          </div>
          <ListPagination pagination={pagination} itemLabel="profesionales" itemLabelSingular="profesional" />
        </div>
      )}

      {canManageProfessionals && (
        <NewProfessionalDialog
          open={dialogOpen}
          onOpenChange={handleDialogChange}
          onSubmit={handleSubmit}
          editingProfessional={editingProfessional}
          existingCount={professionals.length}
          existingProfessionals={professionals}
        />
      )}

      <ProfessionalDetailDialog
        professional={selectedProfessional}
        appointments={appointments}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedProfessional(null);
        }}
        onDeleteRequest={
          canManageProfessionals ? handleDeleteRequest : undefined
        }
        onEdit={
          canManageProfessionals
            ? (professional) => runAfterDetailClose(() => openEditDialog(professional))
            : undefined
        }
        onToggleActive={canManageProfessionals ? handleToggleActive : undefined}
      />

      <ConfirmAlertDialog
        open={Boolean(professionalToDeactivate)}
        onOpenChange={(open) => {
          if (!open) setProfessionalToDeactivate(null);
        }}
        title="Desactivar profesional"
        description={
          professionalToDeactivate
            ? `${professionalToDeactivate.name} dejará de aparecer al crear turnos nuevos y su usuario no podrá ingresar. Si tiene turnos pendientes o confirmados, primero hay que cancelarlos o registrar la asistencia.`
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
