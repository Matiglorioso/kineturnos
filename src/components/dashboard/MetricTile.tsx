import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export type MetricTone = "brand" | "emerald" | "amber" | "red" | "sky" | "violet" | "slate";

const TONES: Record<MetricTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

interface MetricTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: MetricTone;
  /** Línea de contexto debajo del número. */
  hint?: string;
  /** Variación contra el período anterior, ya formateada ("+12%", "−3 pp"). */
  change?: { text: string; good: boolean | null };
  href?: string;
}

/** Tarjeta de un número: misma altura y estructura en todo el panel. */
export function MetricTile({ label, value, icon: Icon, tone = "brand", hint, change, href }: MetricTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", TONES[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        {change && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-xs font-semibold",
              change.good === null
                ? "bg-slate-100 text-slate-600"
                : change.good
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
            )}
          >
            {change.text}
          </span>
        )}
      </div>
      <div className="mt-3 min-w-0">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-0.5 h-4 truncate text-xs text-muted-foreground">{hint ?? ""}</p>
      </div>
    </>
  );

  const className =
    "flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-shadow";

  return href ? (
    <Link href={href} className={cn(className, "hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
