import { PatientAppointmentList } from "@/components/patients/PatientAppointmentList";
import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, type EmptyStatePreset } from "@/lib/empty-states";
import { Appointment } from "@/types";
import { LucideIcon } from "lucide-react";

interface AppointmentListSectionProps {
  title: string;
  icon: LucideIcon;
  appointments: Appointment[];
  emptyPreset: EmptyStatePreset;
}

export function AppointmentListSection({
  title,
  icon: Icon,
  appointments,
  emptyPreset,
}: AppointmentListSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <EmptyStateFromPreset
          preset={emptyPreset}
          size="compact"
          actionLabel={emptyStateActions.goToAgenda}
          actionHref="/agenda"
        />
      ) : (
        <PatientAppointmentList appointments={appointments} />
      )}
    </section>
  );
}
