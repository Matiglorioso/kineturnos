import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CalendarDays, ShieldCheck, Users } from "lucide-react";

const highlights = [
  {
    icon: CalendarDays,
    text: "Agenda diaria y semanal con estados de turno",
  },
  {
    icon: Users,
    text: "Pacientes y profesionales en un solo lugar",
  },
  {
    icon: ShieldCheck,
    text: "Acceso seguro para el equipo del consultorio",
  },
] as const;

interface AuthBrandPanelProps {
  className?: string;
}

export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-full flex-col justify-between overflow-hidden border-r border-brand-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 px-8 py-10 text-white lg:flex xl:px-10 xl:py-12",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11" />
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              {siteConfig.name}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-brand-100">
              {siteConfig.tagline}
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm font-medium uppercase tracking-widest text-brand-100">
          {siteConfig.clinicName}
        </p>
        <h2 className="mt-3 max-w-md text-2xl font-bold leading-tight tracking-tight xl:text-3xl">
          Gestión de turnos para tu consultorio kinesiológico
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-50/90">
          {siteConfig.description}
        </p>
      </div>

      <ul className="relative space-y-4 xl:mt-10">
        {highlights.map((item) => (
          <li key={item.text} className="flex items-start gap-3 text-sm text-brand-50">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <item.icon className="h-4 w-4" />
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
