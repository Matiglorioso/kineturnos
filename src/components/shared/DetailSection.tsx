import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DetailSectionProps {
  title: string;
  /** Acción chica a la derecha del título (por ejemplo, "Nueva autorización"). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sin relleno interno: para listas que llegan al borde (turnos). */
  flush?: boolean;
}

/** Bloque de una ficha con su título: separa bien cada sección sin ocupar espacio de más. */
export function DetailSection({ title, action, children, className, flush }: DetailSectionProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-slate-200/80 bg-white", className)}>
      <div className="flex min-h-9 items-center justify-between gap-2 border-b border-slate-100 bg-muted/40 px-4 py-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-800">{title}</h3>
        {action}
      </div>
      <div className={flush ? undefined : "px-4 py-3"}>{children}</div>
    </section>
  );
}

/** Fila etiqueta / valor dentro de una sección. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-slate-900">{children}</dd>
    </>
  );
}

export const detailRowsClassName = "grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[6.5rem_1fr]";
