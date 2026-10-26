"use client";

import { AgendaDayStrip } from "@/components/agenda/AgendaDayStrip";
import {
  AgendaFilters,
  EMPTY_AGENDA_FILTERS,
  type AgendaFilterValues,
} from "@/components/agenda/AgendaFilters";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { AgendaProfessionalsView } from "@/components/agenda/AgendaProfessionalsView";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  areSameAppDay,
  getTodayAppDate,
  isValidAppDate,
  normalizeAppDate,
} from "@/lib/date-utils";
import { formatAppDateLong } from "@/lib/datetime-format";
import { useAppointments } from "@/hooks/use-appointments";
import { useProfessionals } from "@/hooks/use-professionals";
import { usePatients } from "@/hooks/use-patients";
import {
  filterAgendaAppointments,
  formatWeekRangeLabel,
  getWeekStartMonday,
  isDateInWorkWeek,
  shiftWeek,
  sortAppointmentsByTime,
} from "@/lib/week-calendar";
import { countAppointmentsByDay } from "@/lib/agenda-calendar";
import { buildProfessionalDayGrid } from "@/lib/agenda-professionals";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import type { EmptyStatePreset } from "@/lib/empty-states";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { Columns3, LayoutGrid, List, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AgendaViewMode = "list" | "week" | "professionals";

const VIEW_OPTIONS: { value: AgendaViewMode; label: string; icon: typeof List }[] = [
  { value: "list", label: "Día", icon: List },
  { value: "week", label: "Semana", icon: LayoutGrid },
  { value: "professionals", label: "Profesionales", icon: Columns3 },
];

export default function AgendaPage() {
  const { patients, isLoading: patientsLoading, error: patientsError, refresh: refreshPatients } = usePatients();
  const { professionals, isLoading: professionalsLoading, error: professionalsError, refresh: refreshProfessionals } = useProfessionals();
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointments();
  const {
    canSchedule,
    isScopedProfessional,
    professionalId: sessionProfessionalId,
  } = usePermissions();
  const [viewMode, setViewMode] = useState<AgendaViewMode>("list");
  const [weekStart, setWeekStart] = useState(() => getWeekStartMonday(new Date()));
  const [listDate, setListDate] = useState(() => getTodayAppDate());
  const [filters, setFilters] = useState<AgendaFilterValues>(EMPTY_AGENDA_FILTERS);

  useEffect(() => {
    if (isScopedProfessional && sessionProfessionalId) {
      setFilters((current) => ({ ...current, professionalId: sessionProfessionalId }));
    }
  }, [isScopedProfessional, sessionProfessionalId]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(
    null
  );
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [slotPreset, setSlotPreset] = useState<{ professionalId: string; time: string } | null>(null);
  const today = getTodayAppDate();
  const selectedListDate = isValidAppDate(listDate)
    ? normalizeAppDate(listDate)
    : today;
  const selectedListDateLabel = formatAppDateLong(selectedListDate);

  const filteredByCommon = useMemo(
    () =>
      filterAgendaAppointments(appointments, {
        statusFilter: filters.status,
        professionalFilter: filters.professionalId,
        patientFilter: filters.patientId,
      }),
    [appointments, filters]
  );

  const dayCounts = useMemo(
    () => countAppointmentsByDay(filteredByCommon),
    [filteredByCommon]
  );

  const listAppointments = useMemo(
    () =>
      sortAppointmentsByTime(
        filteredByCommon.filter((appointment) =>
          areSameAppDay(appointment.date, selectedListDate)
        )
      ),
    [filteredByCommon, selectedListDate]
  );

  const weekAppointments = useMemo(
    () =>
      sortAppointmentsByTime(
        filteredByCommon.filter((appointment) =>
          isDateInWorkWeek(appointment.date, weekStart)
        )
      ),
    [filteredByCommon, weekStart]
  );

  const professionalGrid = useMemo(
    () =>
      buildProfessionalDayGrid({
        date: selectedListDate,
        professionals,
        visibleAppointments: filteredByCommon,
        allAppointments: appointments,
        professionalFilter: filters.professionalId,
        showCancelled: filters.status === "cancelado",
      }),
    [selectedListDate, professionals, filteredByCommon, appointments, filters]
  );

  // Un día elegido (Día y Profesionales) o la semana.
  const showsDay = viewMode !== "week";

  const pageDescription =
    viewMode === "list"
      ? `Turnos del ${selectedListDateLabel}`
      : viewMode === "professionals"
        ? `Por profesional — ${selectedListDateLabel}`
        : `Vista semanal — ${formatWeekRangeLabel(weekStart)}`;

  const hasActiveFilters =
    filters.status !== "todos" ||
    filters.patientId !== "todos" ||
    (!isScopedProfessional && filters.professionalId !== "todos");

  const agendaEmptyPreset = useMemo((): EmptyStatePreset => {
    if (appointments.length === 0) {
      return emptyStates.agenda.none;
    }
    if (hasActiveFilters) {
      return emptyStates.agenda.noFilterResults;
    }
    return viewMode === "list"
      ? emptyStates.agenda.noToday
      : emptyStates.agenda.noWeek;
  }, [appointments.length, hasActiveFilters, viewMode]);

  const clearAgendaFilters = () => {
    setFilters((current) => ({
      ...EMPTY_AGENDA_FILTERS,
      professionalId: isScopedProfessional ? current.professionalId : "todos",
    }));
  };

  const openCreateDialog = () => {
    setEditingAppointment(null);
    setSlotPreset(null);
    setFormDialogOpen(true);
  };

  const openCreateForSlot = (professionalId: string, time: string) => {
    setEditingAppointment(null);
    setSlotPreset({ professionalId, time });
    setFormDialogOpen(true);
  };

  // Desde el panel ("Agendar turno"): abre el alta y limpia el parámetro de la URL.
  useEffect(() => {
    if (!canSchedule || new URLSearchParams(window.location.search).get("nuevo") !== "1") return;
    setEditingAppointment(null);
    setFormDialogOpen(true);
    window.history.replaceState(null, "", "/agenda");
  }, [canSchedule]);

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormDialogOpen(true);
  };

  const openDetailDialog = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setDetailOpen(true);
  };

  const handleFormDialogChange = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingAppointment(null);
      setSlotPreset(null);
    }
  };

  const handleFormSubmit = async (appointment: Appointment) => {
    if (editingAppointment) {
      await updateAppointment(appointment);
    } else {
      await createAppointment(appointment);
    }
  };

  const handleStatusChange = async (
    appointment: Appointment,
    status: AppointmentStatus
  ) => {
    await updateAppointmentStatus(appointment, status);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    await deleteAppointment(appointment);
    if (viewingAppointment?.id === appointment.id) {
      setDetailOpen(false);
      setViewingAppointment(null);
    }
  };

  const renderActions = (appointment: Appointment, variant: "table" | "card") => (
    <AppointmentActions
      appointment={appointment}
      variant={variant}
      onView={openDetailDialog}
      onEdit={openEditDialog}
      onStatusChange={handleStatusChange}
      onDelete={handleDeleteAppointment}
      canEdit={canSchedule}
      canDelete={canSchedule}
    />
  );

  const isLoading =
    patientsLoading || professionalsLoading || appointmentsLoading;

  const loadError =
    appointmentsError ?? patientsError ?? professionalsError ?? null;

  const handleRetry = () => {
    void refreshAppointments();
    void refreshPatients();
    void refreshProfessionals();
  };

  if (isLoading) {
    return <PageLoadingState title="Agenda" />;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agenda" description="Error al cargar" />
        <DataLoadError message={loadError} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description={pageDescription}
        actionLabel={
          canSchedule ? emptyStateActions.scheduleAppointment : undefined
        }
        actionIcon={canSchedule ? Plus : undefined}
        onAction={canSchedule ? openCreateDialog : undefined}
      />

      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Vista de la agenda"
            className="inline-flex w-full shrink-0 rounded-xl bg-muted p-1 sm:w-auto"
          >
            {VIEW_OPTIONS.filter(
              // El Profesional ve solo su agenda: la vista por profesional no le aporta.
              (option) => option.value !== "professionals" || !isScopedProfessional
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={viewMode === value}
                onClick={() => setViewMode(value)}
                className={cn(
                  "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-[13px] font-medium transition-all sm:flex-none sm:px-3.5 sm:text-sm",
                  viewMode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <AgendaFilters
            value={filters}
            onChange={setFilters}
            patients={patients}
            professionals={professionals}
            showProfessional={!isScopedProfessional}
          />
        </div>

        {showsDay && (
          <div className="border-t border-slate-100 pt-4">
            <AgendaDayStrip
              value={selectedListDate}
              today={today}
              counts={dayCounts}
              onChange={setListDate}
            />
          </div>
        )}
      </div>

      {viewMode === "professionals" ? (
        <AgendaProfessionalsView
          grid={professionalGrid}
          dateLabel={selectedListDateLabel}
          onAppointmentClick={openDetailDialog}
          onFreeSlotClick={canSchedule ? openCreateForSlot : undefined}
        />
      ) : viewMode === "list" ? (
        <AgendaListView
          appointments={listAppointments}
          dateLabel={selectedListDateLabel}
          isToday={selectedListDate === today}
          renderActions={renderActions}
          onCreateAppointment={canSchedule ? openCreateDialog : undefined}
          emptyPreset={agendaEmptyPreset}
          showClearFilters={hasActiveFilters && appointments.length > 0}
          onClearFilters={clearAgendaFilters}
        />
      ) : (
        <AgendaWeekView
          weekStart={weekStart}
          appointments={weekAppointments}
          onPreviousWeek={() => setWeekStart((prev) => shiftWeek(prev, -1))}
          onNextWeek={() => setWeekStart((prev) => shiftWeek(prev, 1))}
          onCurrentWeek={() => setWeekStart(getWeekStartMonday(new Date()))}
          onAppointmentClick={openDetailDialog}
          renderActions={(appointment, variant = "card") =>
            renderActions(appointment, variant)
          }
          onCreateAppointment={canSchedule ? openCreateDialog : undefined}
          emptyPreset={agendaEmptyPreset}
          showClearFilters={hasActiveFilters && appointments.length > 0}
          onClearFilters={clearAgendaFilters}
        />
      )}

      {canSchedule && (
        <NewAppointmentDialog
          open={formDialogOpen}
          onOpenChange={handleFormDialogChange}
          onSubmit={handleFormSubmit}
          patients={patients}
          professionals={professionals}
          existingAppointments={appointments}
          defaultDate={showsDay ? selectedListDate : today}
          defaultProfessionalId={slotPreset?.professionalId}
          defaultTime={slotPreset?.time}
          editingAppointment={editingAppointment}
        />
      )}

      <AppointmentDetailDialog
        appointment={viewingAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={canSchedule ? openEditDialog : undefined}
      />
    </div>
  );
}
