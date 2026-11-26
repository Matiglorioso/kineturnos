"use client";

import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, describeUserAgent, type AuditLogAction } from "@/lib/audit";
import { getRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { AuditLogItem } from "@/types";
import type { RolUsuario } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { MobilePill, MobileSectionLabel, type MobilePillTone } from "@/components/mobile/MobileUi";
import { formatAppDate, getTodayAppDate } from "@/lib/date-utils";

const ACTION_STYLES: Record<AuditLogAction, string> = {
  consulta: "bg-slate-50 text-slate-600 ring-slate-200",
  alta: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  modificacion: "bg-sky-50 text-sky-700 ring-sky-200",
  cambio_estado: "bg-sky-50 text-sky-700 ring-sky-200",
  baja: "bg-red-50 text-red-700 ring-red-200",
  ingreso: "bg-slate-50 text-slate-600 ring-slate-200",
  ingreso_fallido: "bg-amber-50 text-amber-700 ring-amber-200",
  cambio_password: "bg-violet-50 text-violet-700 ring-violet-200",
  restablecimiento_password: "bg-violet-50 text-violet-700 ring-violet-200",
};

const APP_ROLES = ["superadmin", "admin", "profesional"];

function roleLabel(role: string): string {
  if (APP_ROLES.includes(role)) return getRoleLabel(role as RolUsuario);
  if (role === "paciente") return "Paciente, desde el correo";
  return "Sin usuario";
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(/\//g, "-");
}

function Value({ value }: { value: string | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return <span className="whitespace-pre-wrap break-words">{value}</span>;
}

function AuditRow({ item }: { item: AuditLogItem }) {
  const [open, setOpen] = useState(false);
  const single = item.changes.length === 1 && item.action === "cambio_estado" ? item.changes[0] : null;

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset lg:rounded lg:px-1.5 lg:py-px lg:font-semibold lg:ring-0",
                ACTION_STYLES[item.action]
              )}
            >
              {AUDIT_ACTION_LABELS[item.action]}
            </span>
            <span className="text-sm text-muted-foreground">{AUDIT_ENTITY_LABELS[item.entity]}</span>
          </div>
          <p className="break-words text-sm font-medium text-slate-900">
            {item.label}
            {single && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {single.before ?? "—"} → {single.after ?? "—"}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.userName} ({roleLabel(item.userRole)}) · {formatTimestamp(item.at)}
          </p>
        </div>
        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 text-sm">
          {item.changes.length > 0 && (
            <dl className="space-y-2">
              <div className="hidden text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[10rem_1fr_1fr] sm:gap-3">
                <span>Campo</span>
                <span>Antes</span>
                <span>Después</span>
              </div>
              {item.changes.map((change) => (
                <div key={change.field} className="grid gap-1 sm:grid-cols-[10rem_1fr_1fr] sm:gap-3">
                  <dt className="font-medium text-slate-700">{change.label}</dt>
                  <dd className="text-slate-600">
                    <span className="mr-1 text-xs text-muted-foreground sm:hidden">Antes:</span>
                    <Value value={change.before} />
                  </dd>
                  <dd className="text-slate-900">
                    <span className="mr-1 text-xs text-muted-foreground sm:hidden">Después:</span>
                    <Value value={change.after} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="break-words text-xs text-muted-foreground" title={item.userAgent ?? undefined}>
            IP {item.ip ?? "desconocida"}
            {describeUserAgent(item.userAgent) && <> · {describeUserAgent(item.userAgent)}</>}
          </p>
        </div>
      )}
    </li>
  );
}

/** Registro de auditoría: cada movimiento se despliega para ver el antes y el después. */
export function AuditLogList({ items }: { items: AuditLogItem[] }) {
  return (
    <>
      <section className="rounded-2xl border border-slate-200/80 bg-white px-4 shadow-card max-lg:hidden sm:px-5">
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <AuditRow key={item.id} item={item} />
          ))}
        </ul>
      </section>
      <AuditLogMobile items={items} />
    </>
  );
}

/* ---------- Celular (boceto 12): agrupado por día, cada movimiento se despliega ---------- */

const MOBILE_ACTION: Record<AuditLogAction, { label: string; tone: MobilePillTone }> = {
  consulta: { label: "Consultó", tone: "gray" },
  alta: { label: "Alta", tone: "green" },
  modificacion: { label: "Modificación", tone: "amber" },
  cambio_estado: { label: "Estado", tone: "sky" },
  baja: { label: "Baja", tone: "red" },
  ingreso: { label: "Ingresó", tone: "gray" },
  ingreso_fallido: { label: "Ingreso fallido", tone: "red" },
  cambio_password: { label: "Contraseña", tone: "gray" },
  restablecimiento_password: { label: "Contraseña", tone: "gray" },
};

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "Hoy", "Ayer" o "mié 23-11". */
function dayLabel(day: string, now = new Date()): string {
  if (day === getTodayAppDate(now)) return "Hoy";
  if (day === getTodayAppDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "Ayer";
  return formatAppDate(day, "EEE dd-MM").replace(".", "");
}

function AuditLogMobile({ items }: { items: AuditLogItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const days: { day: string; items: AuditLogItem[] }[] = [];
  for (const item of items) {
    const day = getTodayAppDate(new Date(item.at));
    const last = days[days.length - 1];
    if (last && last.day === day) last.items.push(item);
    else days.push({ day, items: [item] });
  }

  return (
    <div className="space-y-3 lg:hidden">
      {days.map((group) => (
        <section key={group.day} aria-label={dayLabel(group.day)}>
          <MobileSectionLabel>{dayLabel(group.day)}</MobileSectionLabel>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            {group.items.map((item) => {
              const open = openId === item.id;
              const single = item.changes.length === 1 && item.action === "cambio_estado" ? item.changes[0] : null;
              const action = MOBILE_ACTION[item.action];
              const browser = describeUserAgent(item.userAgent);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[15px] font-semibold leading-snug text-slate-900">
                        {item.label}
                      </span>
                      {single && (
                        <span className="mt-0.5 block text-xs text-slate-600">
                          {single.before ?? "—"} → {single.after ?? "—"}
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.userName} · {timeFormatter.format(new Date(item.at))}
                      </span>
                    </span>
                    <span className="mt-0.5 shrink-0">
                      <MobilePill tone={action.tone}>{action.label}</MobilePill>
                    </span>
                  </button>
                  {open && (
                    <div className="mx-3 mb-3 space-y-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                      {item.changes.length > 0 && (
                        <dl className="space-y-1.5">
                          <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-2 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                            <span>Campo</span>
                            <span>Antes</span>
                            <span>Después</span>
                          </div>
                          {item.changes.map((change) => (
                            <div key={change.field} className="grid grid-cols-[5.5rem_1fr_1fr] gap-2">
                              <dt className="font-medium text-slate-700">{change.label}</dt>
                              <dd className="min-w-0 break-words text-slate-500">
                                <Value value={change.before} />
                              </dd>
                              <dd className="min-w-0 break-words font-semibold text-slate-900">
                                <Value value={change.after} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <p className="break-words text-muted-foreground">
                        {[AUDIT_ENTITY_LABELS[item.entity], roleLabel(item.userRole), `IP ${item.ip ?? "desconocida"}`, browser]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
