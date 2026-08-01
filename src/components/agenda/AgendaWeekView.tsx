"use client";

import { WeekAppointmentBlock } from "@/components/agenda/WeekAppointmentBlock";
import { WeekNavigation } from "@/components/agenda/WeekNavigation";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, emptyStates, type EmptyStatePreset } from "@/lib/empty-states";
import {
  formatDayColumnHeader,
  getAppointmentHeight,
  getAppointmentTopOffset,
  getHourSlots,
  getWeekDaysMonToSat,
  getWeekHourBounds,
  groupAppointmentsByAppDate,
  isSameWorkWeek,
  layoutDayAppointments,
} from "@/lib/week-calendar";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { useMemo } from "react";

const HOUR_HEIGHT = 56;

interface AgendaWeekViewProps {
  weekStart: Date;
  appointments: Appointment[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
  renderActions: (
    appointment: Appointment,
    variant?: "table" | "card"
  ) => React.ReactNode;
  onCreateAppointment?: () => void;
  emptyPreset: EmptyStatePreset;
  showClearFilters?: boolean;
  onClearFilters?: () => void;
}

export function AgendaWeekView({
  weekStart,
  appointments,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onAppointmentClick,
  renderActions,
  onCreateAppointment,
  emptyPreset,
  showClearFilters,
  onClearFilters,
}: AgendaWeekViewProps) {
  const weekDays = useMemo(() => getWeekDaysMonToSat(weekStart), [weekStart]);
  const grouped = useMemo(
    () => groupAppointmentsByAppDate(appointments, weekDays),
    [appointments, weekDays]
  );
  const { startHour, endHour } = useMemo(
    () => getWeekHourBounds(appointments),
    [appointments]
  );
  const hourSlots = useMemo(
    () => getHourSlots(startHour, endHour),
    [startHour, endHour]
  );
  const gridHeight = (endHour - startHour) * HOUR_HEIGHT;
  const isCurrentWeek = isSameWorkWeek(weekStart);

  if (appointments.length === 0) {
    return (
      <div className="space-y-4">
        <WeekNavigation
          weekStart={weekStart}
          isCurrentWeek={isCurrentWeek}
          onPreviousWeek={onPreviousWeek}
          onNextWeek={onNextWeek}
          onCurrentWeek={onCurrentWeek}
        />
        <EmptyStateFromPreset
          preset={emptyPreset}
          actionLabel={
            onCreateAppointment ? emptyStateActions.scheduleAppointment : undefined
          }
          onAction={onCreateAppointment}
          secondaryActionLabel={
            showClearFilters ? emptyStateActions.clearFilters : undefined
          }
          onSecondaryAction={showClearFilters ? onClearFilters : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WeekNavigation
        weekStart={weekStart}
        isCurrentWeek={isCurrentWeek}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onCurrentWeek={onCurrentWeek}
      />

      {/* Desktop: grilla semanal */}
      <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-card lg:block">
        <div className="min-w-[720px]">
        <div className="grid grid-cols-[4rem_repeat(6,minmax(0,1fr))] border-b bg-muted/40">
          <div className="p-3" />
          {weekDays.map((day) => {
            const header = formatDayColumnHeader(day);
            return (
              <div
                key={header.appDate}
                className={cn(
                  "border-l p-3 text-center",
                  header.isToday && "bg-brand-50/60"
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {header.weekday}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-bold capitalize text-slate-900",
                    header.isToday && "text-brand-700"
                  )}
                >
                  {header.dateLabel}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[4rem_repeat(6,minmax(0,1fr))]">
          <div className="relative border-r bg-muted/20" style={{ height: gridHeight }}>
            {hourSlots.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-slate-100 px-2 text-right text-[10px] font-medium text-muted-foreground"
                style={{ top: (hour - startHour) * HOUR_HEIGHT }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const header = formatDayColumnHeader(day);
            const dayAppointments = grouped[header.appDate] ?? [];
            const positioned = layoutDayAppointments(dayAppointments);

            return (
              <div
                key={header.appDate}
                className={cn(
                  "relative border-l border-slate-100",
                  header.isToday && "bg-brand-50/20"
                )}
                style={{ height: gridHeight }}
              >
                {hourSlots.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-slate-100/80"
                    style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                  />
                ))}

                {positioned.map(({ appointment, column, columnCount }) => {
                  const widthPercent = 100 / columnCount;
                  const leftPercent = column * widthPercent;

                  return (
                    <WeekAppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      onClick={onAppointmentClick}
                      actions={renderActions(appointment, "table")}
                      compact
                      className="absolute z-10"
                      style={{
                        top: getAppointmentTopOffset(
                          appointment.time,
                          startHour,
                          HOUR_HEIGHT
                        ),
                        height: getAppointmentHeight(
                          appointment.duration,
                          HOUR_HEIGHT
                        ),
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Mobile: dias apilados */}
      <div className="space-y-4 lg:hidden">
        {weekDays.map((day) => {
          const header = formatDayColumnHeader(day);
          const dayAppointments = grouped[header.appDate] ?? [];

          return (
            <section
              key={header.appDate}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-card",
                header.isToday && "border-brand-200"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {header.weekday}{" "}
                    <span className="font-normal text-muted-foreground">
                      {header.dateLabel}
                    </span>
                  </h3>
                  {header.isToday && (
                    <span className="text-xs font-medium text-brand-600">Hoy</span>
                  )}
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {dayAppointments.length} turno
                  {dayAppointments.length !== 1 && "s"}
                </span>
              </div>

              {dayAppointments.length === 0 ? (
                <EmptyStateFromPreset
                  preset={emptyStates.agenda.dayInline}
                  size="inline"
                  className="border-slate-200/60 bg-muted/20"
                />
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((appointment) => (
                    <WeekAppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      onClick={onAppointmentClick}
                      actions={renderActions(appointment, "card")}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

