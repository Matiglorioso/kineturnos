import { cn } from "@/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

export interface DashboardShortcut {
  href: string;
  icon: LucideIcon;
  title: string;
  /** El dato principal ("28 turnos"). */
  value: string;
  /** Una línea con el detalle ("13 por venir"). */
  detail?: string;
  /** Resalta el atajo cuando hay algo para resolver. */
  tone?: "default" | "alert";
}

/** Atajos del panel: cada uno lleva a su sección y muestra el dato que importa de ella. */
export function DashboardShortcuts({ shortcuts }: { shortcuts: DashboardShortcut[] }) {
  if (shortcuts.length === 0) return null;
  return (
    <nav aria-label="Atajos">
      <ul className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map(({ href, icon: Icon, title, value, detail, tone = "default" }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "group flex h-full items-center gap-4 rounded-2xl border bg-white p-4 shadow-card transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tone === "alert" ? "border-red-200" : "border-slate-200/80"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  tone === "alert" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-muted-foreground">{title}</span>
                <span className="block text-lg font-bold leading-tight text-slate-900">{value}</span>
                {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
