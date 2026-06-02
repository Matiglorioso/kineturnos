import { CalendarCheck, Clock, Users } from "lucide-react";

/** Vista previa decorativa del panel — equilibrada con la columna de marca en login desktop. */
export function AuthPanelPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-[220px] lg:max-w-[220px] xl:max-w-[320px]"
    >
      <div className="absolute -right-2 top-6 h-full w-full rotate-6 rounded-2xl bg-white/[0.08] xl:top-8" />
      <div className="absolute -right-3 top-4 h-full w-full rotate-3 rounded-2xl bg-white/15 ring-1 ring-white/25 xl:top-6" />
      <div className="relative overflow-hidden rounded-2xl bg-white/95 p-3 text-slate-900 shadow-2xl shadow-teal-950/40 ring-1 ring-white/40 xl:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
              Panel del día
            </p>
            <p className="text-sm font-bold text-slate-900">Resumen operativo</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            En vivo
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 tabular-nums xl:mt-4 xl:gap-2">
          <PreviewStat icon={CalendarCheck} label="Turnos" value="8" tone="brand" />
          <PreviewStat icon={Clock} label="Pend." value="2" tone="amber" />
          <PreviewStat icon={Users} label="Activos" value="7" tone="violet" />
        </div>

        <div className="mt-3 xl:mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Próximo turno
          </p>
          <PreviewAppointment
            time="09:00"
            patient="María G."
            status="Confirmado"
            statusClass="bg-emerald-50 text-emerald-700"
          />
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  tone: "brand" | "amber" | "violet";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2 xl:p-2.5">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${tones[tone]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-1.5 text-base font-bold leading-none text-slate-900 xl:mt-2 xl:text-lg">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function PreviewAppointment({
  time,
  patient,
  status,
  statusClass,
}: {
  time: string;
  patient: string;
  status: string;
  statusClass: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
      <span className="text-xs font-semibold tabular-nums text-slate-700">{time}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{patient}</span>
      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${statusClass}`}
      >
        {status}
      </span>
    </div>
  );
}
