"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

/**
 * Piezas de la versión celular (bocetos 1 a 14): título con etiqueta, pestañas, filas de
 * dos renglones y etiquetas. Todo con las mismas medidas para que las pantallas se vean
 * iguales entre sí. Solo se usan debajo de lg.
 */

export function MobilePageTitle({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow: React.ReactNode;
  title: string;
  /** El "+" de la pantalla: etiqueta accesible y acción. */
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3 lg:hidden", className)}>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      </div>
      {action && (
        <Button
          type="button"
          size="icon"
          aria-label={action.label}
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={action.onClick}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

/** Pestañas en segmentado (como la ficha del paciente). */
export function MobileSegmented<T extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 rounded-xl bg-[#ecebe6] p-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "h-9 min-w-0 flex-1 truncate rounded-[9px] px-2 text-[13px] font-semibold transition-colors",
            value === item.value ? "bg-white text-brand-800 shadow-sm" : "text-muted-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Etiqueta de sección ("AUTORIZACIONES", "HOY"…). */
export function MobileSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mx-1 mb-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-800", className)}>
      {children}
    </p>
  );
}

/** Lista blanca con renglones separados. */
export function MobileList({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn("divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white", className)}
    >
      {children}
    </ul>
  );
}

/** Renglón de dos líneas: título arriba, detalle abajo y algo a la derecha (etiqueta, número). */
export function MobileListRow({
  title,
  detail,
  extra,
  trailing,
  onClick,
  href,
  ariaLabel,
  muted = false,
}: {
  title: React.ReactNode;
  detail?: React.ReactNode;
  /** Tercera línea opcional (avisos). */
  extra?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  muted?: boolean;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-snug text-slate-900">{title}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span>}
        {extra}
      </span>
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
    </>
  );
  const className = cn(
    "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left",
    (onClick || href) && "transition-colors active:bg-muted/60",
    muted && "opacity-70"
  );
  return (
    <li>
      {href ? (
        <Link href={href} aria-label={ariaLabel} className={className}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" aria-label={ariaLabel} onClick={onClick} className={className}>
          {body}
        </button>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

export type MobilePillTone = "green" | "amber" | "sky" | "red" | "gray";

const PILL_TONES: Record<MobilePillTone, string> = {
  green: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  sky: "bg-sky-50 text-sky-800",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
};

/** Etiqueta redonda chica, a la derecha de una fila. */
export function MobilePill({ tone, children }: { tone: MobilePillTone; children: React.ReactNode }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", PILL_TONES[tone])}>
      {children}
    </span>
  );
}

/** Renglón de enlace con "›" (Ficha del paciente, Historia clínica…). */
export function MobileLinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-12 items-center justify-between px-1 text-sm font-semibold text-brand-800">
      {children}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

/** Acción principal fija abajo, sobre la barra de navegación (la página deja lugar con max-lg:pb-20). */
export function MobileStickyAction({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200/80 bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
      {children}
    </div>
  );
}

/** Fila de chips que se desliza hacia el costado. */
export function mobileChipClass(active: boolean) {
  return cn(
    "inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors",
    active ? "border-brand-800 bg-brand-800 text-white" : "border-slate-200 bg-white text-slate-700"
  );
}
