"use client";

import { AgendaDayStrip } from "@/components/agenda/AgendaDayStrip";
import {
  AgendaFilters,
  EMPTY_AGENDA_FILTERS,
  type AgendaFilterValues,
} from "@/components/agenda/AgendaFilters";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { AgendaProfessionalsView } from "@/components/agenda/AgendaProfessionalsView";
import {
  AppointmentActions,
  type AppointmentActionsVariant,
} from "@/components/appointments/AppointmentActions";
import { AppointmentActionSheet } from "@/components/appointments/AppointmentActionSheet";
import { AppointmentStatusMenu } from "@/components/appointments/AppointmentStatusMenu";
import { AppointmentDetailDialog } from "@/components/appointments/AppointmentDetailDialog";
import { NewAppointmentDialog } from "@/components/appointments/NewAppointmentDialog";
import { DataLoadError } from "@/components/shared/DataLoadError";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
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
import { filterAgendaAppointments, sortAppointmentsByTime } from "@/lib/agenda-list";
import { countAppointmentsByDay, formatCalendarMonth, getCalendarMonth } from "@/lib/agenda-calendar";
import { buildProfessionalDayGrid } from "@/lib/agenda-professionals";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import type { EmptyStatePreset } from "@/lib/empty-states";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { agendaUrlForDate } from "@/lib/agenda-url";
import { ChevronDown, Columns3, List, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AgendaViewMode = "list" | "professionals";

const VIEW_OPTIONS: { value: AgendaViewMode; label: string; icon: typeof List }[] = [
  { value: "list", label: "Día", icon: List },
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
    can,
    canSchedule,
    isScopedProfessional,
    professionalId: sessionProfessionalId,
    isReady: permissionsReady,
  } = usePermissions();
  const [viewMode, setViewMode] = useState<AgendaViewMode>("list");
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
  /** Celular: turno elegido en la lista, con sus acciones abiertas desde abajo. */
  const [sheetAppointment, setSheetAppointment] = useState<Appointment | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [slotPreset, setSlotPreset] = useState<{ professionalId: string; time: string } | null>(null);
  const [presetPatientId, setPresetPatientId] = useState<string | undefined>();
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
        patientQuery: filters.patientQuery,
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

  // El Profesional ve solo su agenda: la vista por profesional no le aporta.
  const viewOptions = VIEW_OPTIONS.filter(
    (option) => option.value !== "professionals" || !isScopedProfessional
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

  const hasActiveFilters =
    filters.status !== "todos" ||
    filters.patientQuery.trim() !== "" ||
    (!isScopedProfessional && filters.professionalId !== "todos");

  const agendaEmptyPreset = useMemo((): EmptyStatePreset => {
    if (appointments.length === 0) {
      return emptyStates.agenda.none;
    }
    if (hasActiveFilters) {
      return emptyStates.agenda.noFilterResults;
    }
    return emptyStates.agenda.noToday;
  }, [appointments.length, hasActiveFilters]);

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

  // Enlaces desde otras pantallas: ?fecha=dd-MM-yyyy abre ese día (panel, "Ver en la
  // agenda"); ?nuevo=1 abre el alta, con ?paciente= ya elegido (ficha del paciente).
  // Se leen cuando ya se conoce el perfil (para saber si puede agendar); después la URL
  // solo conserva la fecha elegida (ver el efecto de abajo).
  const [urlRead, setUrlRead] = useState(false);
  useEffect(() => {
    if (!permissionsReady || urlRead) return;
    const params = new URLSearchParams(window.location.search);
    const date = params.get("fecha");
    if (date && isValidAppDate(date)) {
      setListDate(normalizeAppDate(date));
    }
    if (canSchedule && params.get("nuevo") === "1") {
      setEditingAppointment(null);
      setPresetPatientId(params.get("paciente") ?? undefined);
      setFormDialogOpen(true);
    }
    setUrlRead(true);
  }, [permissionsReady, canSchedule, urlRead]);

  // El día elegido queda en la URL: recargar la página no vuelve a hoy.
  useEffect(() => {
    if (!urlRead) return;
    const url = agendaUrlForDate(selectedListDate, getTodayAppDate());
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [urlRead, selectedListDate]);

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
      setPresetPatientId(undefined);
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

  const renderActions = (appointment: Appointment, variant: AppointmentActionsVariant) => (
    <AppointmentActions
      appointment={appointment}
      variant={variant}
      onView={openDetailDialog}
      onEdit={openEditDialog}
      onDelete={handleDeleteAppointment}
      canEdit={canSchedule}
      canDelete={canSchedule}
    />
  );

  const renderStatus = (appointment: Appointment) => (
    <AppointmentStatusMenu appointment={appointment} onStatusChange={handleStatusChange} />
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
    <div className="space-y-4 lg:space-y-6">
      {/* Celular: el mes (abre el calendario), el título, la vista y el "+". */}
      <div className="flex items-end justify-between gap-3 lg:hidden">
        <div className="min-w-0">
          <button
            type="button"
            aria-label="Ver calendario"
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-700"
          >
            {formatCalendarMonth(getCalendarMonth(selectedListDate))}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          {viewOptions.length > 1 && (
            <div role="group" aria-label="Vista de la agenda" className="inline-flex rounded-xl bg-muted p-1">
              {viewOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={viewMode === value}
                  aria-label={label}
                  onClick={() => setViewMode(value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    viewMode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {value === "list" ? "Día" : "Profes."}
                </button>
              ))}
            </div>
          )}
          {canSchedule && (
            <Button type="button" size="icon" aria-label="Agendar turno" className="h-10 w-10 rounded-xl" onClick={openCreateDialog}>
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        className="max-lg:hidden"
        title="Agenda"
        actionLabel={
          canSchedule ? emptyStateActions.scheduleAppointment : undefined
        }
        actionIcon={canSchedule ? Plus : undefined}
        onAction={canSchedule ? openCreateDialog : undefined}
      />

      {/* En el celular los controles van sueltos (sin tarjeta) para ganar lugar. */}
      <div className="flex flex-col gap-3 lg:gap-4 lg:rounded-2xl lg:border lg:bg-card lg:p-4 lg:shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* El Profesional tiene una sola vista: no hay nada que elegir. */}
          {viewOptions.length > 1 && (
            <div
              role="group"
              aria-label="Vista de la agenda"
              className="hidden w-full shrink-0 rounded-xl bg-muted p-1 sm:w-auto lg:inline-flex"
            >
              {viewOptions.map(({ value, label, icon: Icon }) => (
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
          )}

          <AgendaFilters
            value={filters}
            onChange={setFilters}
            professionals={professionals}
            showProfessional={!isScopedProfessional}
            className="lg:flex lg:flex-col lg:items-end"
          />
        </div>

        {/* Celular: la tira de días va primero (como el boceto). */}
        <div className="max-lg:order-first lg:border-t lg:border-slate-100 lg:pt-4">
          <AgendaDayStrip
            value={selectedListDate}
            today={today}
            counts={dayCounts}
            onChange={setListDate}
            calendarOpen={calendarOpen}
            onCalendarOpenChange={setCalendarOpen}
          />
        </div>
      </div>

      {viewMode === "professionals" ? (
        <AgendaProfessionalsView
          grid={professionalGrid}
          dateLabel={selectedListDateLabel}
          onAppointmentClick={openDetailDialog}
          onFreeSlotClick={canSchedule ? openCreateForSlot : undefined}
          onMobileAppointmentClick={setSheetAppointment}
        />
      ) : (
        <AgendaListView
          appointments={listAppointments}
          dateLabel={selectedListDateLabel}
          isToday={selectedListDate === today}
          renderActions={renderActions}
          renderStatus={renderStatus}
          onSelectAppointment={setSheetAppointment}
          showProfessional={!isScopedProfessional}
          onCreateAppointment={canSchedule ? openCreateDialog : undefined}
          emptyPreset={agendaEmptyPreset}
          showClearFilters={hasActiveFilters && appointments.length > 0}
          onClearFilters={clearAgendaFilters}
        />
      )}


      <AppointmentActionSheet
        appointment={sheetAppointment}
        onOpenChange={(open) => !open && setSheetAppointment(null)}
        onStatusChange={handleStatusChange}
        onReschedule={canSchedule ? openEditDialog : undefined}
        onDelete={canSchedule ? handleDeleteAppointment : undefined}
        canSeeClinical={can("clinical:read")}
      />

      {canSchedule && (
        <NewAppointmentDialog
          open={formDialogOpen}
          onOpenChange={handleFormDialogChange}
          onSubmit={handleFormSubmit}
          patients={patients}
          professionals={professionals}
          existingAppointments={appointments}
          defaultDate={selectedListDate}
          defaultProfessionalId={slotPreset?.professionalId}
          defaultTime={slotPreset?.time}
          defaultPatientId={presetPatientId}
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
