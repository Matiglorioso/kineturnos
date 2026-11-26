import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        // Celular: título y acción en la misma línea (la acción nunca tapa la lista).
        "mb-4 flex items-center justify-between gap-3 sm:items-start lg:mb-8",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 hidden text-sm text-muted-foreground sm:block sm:text-base">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:gap-3">
        {children}
        {actionLabel && (
          <Button className="h-10 px-3 sm:px-4" onClick={onAction}>
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
