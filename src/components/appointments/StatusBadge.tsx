import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Ban, Check, CheckCircle2, Clock, UserX } from "lucide-react";

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string;
    variant: "warning" | "success" | "info" | "danger" | "neutral";
    icon: typeof Clock;
  }
> = {
  pendiente: { label: "Pendiente", variant: "warning", icon: Clock },
  confirmado: { label: "Confirmado", variant: "info", icon: Check },
  atendido: { label: "Atendido", variant: "success", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", variant: "danger", icon: Ban },
  ausente: { label: "Ausente", variant: "neutral", icon: UserX },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  showIcon?: boolean;
  className?: string;
  /** Al final de la etiqueta (la flecha cuando es un menú). */
  trailing?: React.ReactNode;
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
  trailing,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 py-1", className)}>
      {showIcon && <Icon className="h-3 w-3 lg:hidden" />}
      {config.label}
      {trailing}
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
          "h-1.5 w-1.5 rounded-full lg:hidden",
          active ? "bg-brand-500" : "bg-slate-400"
        )}
      />
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}

export { statusConfig };
