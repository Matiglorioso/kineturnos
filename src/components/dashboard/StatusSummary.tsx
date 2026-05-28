import { statusConfig } from "@/components/appointments/StatusBadge";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APPOINTMENT_STATUS_ORDER,
  getAppointmentStatusCounts,
} from "@/lib/dashboard-stats";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Appointment, AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { PieChart } from "lucide-react";

const barColors: Record<AppointmentStatus, string> = {
  pendiente: "bg-amber-500",
  confirmado: "bg-emerald-500",
  atendido: "bg-sky-500",
  cancelado: "bg-red-500",
  ausente: "bg-slate-400",
};

interface StatusSummaryProps {
  appointments: Appointment[];
  className?: string;
}

export function StatusSummary({ appointments, className }: StatusSummaryProps) {
  const counts = getAppointmentStatusCounts(appointments);
  const total = appointments.length;
  const maxCount = Math.max(...APPOINTMENT_STATUS_ORDER.map((s) => counts[s]), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-brand-600" />
          Resumen por estado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} turno${total !== 1 ? "s" : ""} en total`
            : "Distribucion de estados en la agenda"}
        </p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyStateFromPreset
            preset={emptyStates.dashboard.noAppointments}
            size="compact"
            actionLabel={emptyStateActions.scheduleAppointment}
            actionHref="/agenda"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {APPOINTMENT_STATUS_ORDER.map((status) => {
              const count = counts[status];
              const config = statusConfig[status];
              const widthPercent = (count / maxCount) * 100;

              return (
                <div
                  key={status}
                  className="rounded-xl border border-slate-200/80 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {config.label}
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      {count}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        barColors[status]
                      )}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {`${Math.round((count / total) * 100)}% del total`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
