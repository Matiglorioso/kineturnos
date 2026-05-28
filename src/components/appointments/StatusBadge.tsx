import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Ban, CheckCircle2, Clock, UserX } from "lucide-react";

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string;
    variant: "warning" | "success" | "info" | "danger" | "neutral";
    icon: typeof Clock;
  }
> = {
  pendiente: { label: "Pendiente", variant: "warning", icon: Clock },
  confirmado: { label: "Confirmado", variant: "success", icon: CheckCircle2 },
  atendido: { label: "Atendido", variant: "info", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", variant: "danger", icon: Ban },
  ausente: { label: "Ausente", variant: "neutral", icon: UserX },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 py-1", className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function PatientStatusBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant={active ? "success" : "neutral"}
      className={cn("gap-1.5 py-1", className)}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400"
        )}
      />
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}

export { statusConfig };
