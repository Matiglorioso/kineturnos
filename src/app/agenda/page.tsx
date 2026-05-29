"use client";

import { AgendaListView } from "@/components/agenda/AgendaListView";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { areSameAppDay, getTodayAppDate } from "@/lib/date-utils";
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
import {
  APPOINTMENT_STATUS_FILTERS,
} from "@/lib/appointment-status";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import type { EmptyStatePreset } from "@/lib/empty-states";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type AgendaViewMode = "list" | "week";

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
  } = useAppointments();
  const [viewMode, setViewMode] = useState<AgendaViewMode>("list");
  const [weekStart, setWeekStart] = useState(() => getWeekStartMonday(new Date()));
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "todos">(
    "todos"
  );
  const [professionalFilter, setProfessionalFilter] = useState("todos");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(
    null
  );
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const today = getTodayAppDate();
  const todayDateLabel = formatAppDateLong(today);

  const filteredByCommon = useMemo(
    () =>
      filterAgendaAppointments(appointments, {
        statusFilter,
        professionalFilter,
      }),
    [appointments, statusFilter, professionalFilter]
  );

  const listAppointments = useMemo(
    () =>
      sortAppointmentsByTime(
        filteredByCommon.filter((appointment) =>
          areSameAppDay(appointment.date, today)
        )
      ),
    [filteredByCommon, today]
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

  const pageDescription =
    viewMode === "list"
      ? `Turnos de hoy — ${todayDateLabel}`
      : `Vista semanal — ${formatWeekRangeLabel(weekStart)}`;

  const hasActiveFilters =
    statusFilter !== "todos" || professionalFilter !== "todos";

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
    setStatusFilter("todos");
    setProfessionalFilter("todos");
  };

  const openCreateDialog = () => {
    setEditingAppointment(null);
    setFormDialogOpen(true);
  };

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

  const renderActions = (appointment: Appointment, variant: "table" | "card") => (
    <AppointmentActions
      appointment={appointment}
      variant={variant}
      onView={openDetailDialog}
      onEdit={openEditDialog}
      onStatusChange={handleStatusChange}
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
        actionLabel={emptyStateActions.scheduleAppointment}
        actionIcon={Plus}
        onAction={openCreateDialog}
      />

      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-3.5",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-3.5",
                viewMode === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Semana
            </button>
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={professionalFilter}
              onValueChange={setProfessionalFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los profesionales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los profesionales</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {!p.active ? " (inactivo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {APPOINTMENT_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-medium transition-all sm:px-3.5 sm:text-sm",
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "list" ? (
        <AgendaListView
          appointments={listAppointments}
          dateLabel={todayDateLabel}
          renderActions={renderActions}
          onCreateAppointment={openCreateDialog}
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
          onCreateAppointment={openCreateDialog}
          emptyPreset={agendaEmptyPreset}
          showClearFilters={hasActiveFilters && appointments.length > 0}
          onClearFilters={clearAgendaFilters}
        />
      )}

      <NewAppointmentDialog
        open={formDialogOpen}
        onOpenChange={handleFormDialogChange}
        onSubmit={handleFormSubmit}
        patients={patients}
        professionals={professionals}
        existingAppointments={appointments}
        defaultDate={today}
        editingAppointment={editingAppointment}
      />

      <AppointmentDetailDialog
        appointment={viewingAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEditDialog}
      />
    </div>
  );
}
