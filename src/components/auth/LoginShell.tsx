import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site-config";
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
];

interface LoginShellProps {
  children: React.ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-brand-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
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
          <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Gestión de turnos para tu consultorio kinesiológico
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-50/90">
            {siteConfig.description}
          </p>
        </div>

        <ul className="relative space-y-4">
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

      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
