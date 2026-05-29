import { CalendarCheck, Clock, Users } from "lucide-react";

/** Vista previa decorativa del panel — compacta para caber sin scroll en login desktop. */
export function AuthPanelPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[260px] xl:max-w-[280px]">
      <div className="absolute -right-2 top-4 h-full w-full rotate-2 rounded-xl bg-white/10 ring-1 ring-white/20" />
      <div className="relative overflow-hidden rounded-xl bg-white/95 p-3 text-slate-900 shadow-xl shadow-teal-950/25 ring-1 ring-white/40">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-600">
              Panel del día
            </p>
            <p className="text-xs font-bold text-slate-900">Resumen operativo</p>
          </div>
          <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-medium text-brand-700">
            En vivo
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <PreviewStat icon={CalendarCheck} label="Turnos" value="8" tone="brand" />
          <PreviewStat icon={Clock} label="Pend." value="2" tone="amber" />
          <PreviewStat icon={Users} label="Activos" value="7" tone="violet" />
        </div>

        <div className="mt-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
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
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-1.5">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${tones[tone]}`}
      >
        <Icon className="h-3 w-3" />
      </span>
      <p className="mt-1 text-base font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-0.5 text-[9px] text-slate-500">{label}</p>
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
    <div className="mt-1 flex items-center gap-1.5 rounded-md border border-slate-100 bg-white px-2 py-1.5">
      <span className="text-[10px] font-semibold tabular-nums text-slate-700">{time}</span>
      <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600">{patient}</span>
      <span
        className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${statusClass}`}
      >
        {status}
      </span>
    </div>
  );
}
