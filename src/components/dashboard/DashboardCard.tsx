import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  /** Texto chico al lado del título (cantidad, fecha…). */
  meta?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  /** Altura fija con scroll interno, para que las tarjetas de una fila queden parejas. */
  fixedHeight?: boolean;
}

/** Tarjeta del panel: mismo encabezado, bordes y alto en todas. */
export function DashboardCard({
  title,
  icon: Icon,
  meta,
  action,
  children,
  className,
  fixedHeight = false,
}: DashboardCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-card",
        fixedHeight && "lg:h-[28rem]",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-brand-700" />
          <h2 className="truncate font-semibold text-slate-900">{title}</h2>
          {meta && <span className="shrink-0 text-sm text-muted-foreground">· {meta}</span>}
        </div>
        {action && (
          <Link href={action.href} className="-my-1 inline-flex min-h-7 shrink-0 items-center rounded-md px-1 text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {action.label}
          </Link>
        )}
      </header>
      <div className={cn("flex-1 p-5", fixedHeight && "lg:min-h-0 lg:overflow-y-auto")}>{children}</div>
    </section>
  );
}

/** Mensaje vacío centrado, igual en todas las tarjetas. */
export function DashboardEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center">
      <Icon className="h-6 w-6 text-slate-300" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
