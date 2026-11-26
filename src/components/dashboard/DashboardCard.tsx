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
  /** En el celular, sin el título de la tarjeta (los grupos de adentro traen el suyo). */
  hideMobileHeader?: boolean;
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
  hideMobileHeader = false,
}: DashboardCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        // En el celular no hay tarjeta: el título funciona como etiqueta de la sección.
        "flex flex-col lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-card",
        fixedHeight && "lg:h-[28rem]",
        className
      )}
    >
      <header className={cn("flex items-center justify-between gap-3 px-1 pb-2 lg:border-b lg:border-slate-100 lg:px-4 lg:py-3", hideMobileHeader && "max-lg:hidden")}>
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="hidden h-4 w-4 shrink-0 text-brand-700 lg:block" />
          <h2 className="truncate text-xs font-bold uppercase tracking-wide text-brand-800 lg:text-base lg:font-semibold lg:normal-case lg:tracking-normal lg:text-slate-900">
            {title}
          </h2>
          {meta && <span className="shrink-0 text-sm text-muted-foreground">· {meta}</span>}
        </div>
        {action && (
          <Link href={action.href} className="-my-1 inline-flex min-h-7 shrink-0 items-center rounded-md px-1 text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {action.label}
          </Link>
        )}
      </header>
      <div className={cn("flex-1 lg:p-4", fixedHeight && "lg:min-h-0 lg:overflow-y-auto")}>{children}</div>
    </section>
  );
}

/** Mensaje vacío centrado, igual en todas las tarjetas. */
export function DashboardEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white text-center lg:rounded-none lg:border-0 lg:bg-transparent">
      <Icon className="h-6 w-6 text-slate-300" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
