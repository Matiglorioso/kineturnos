import { AuthPanelPreview } from "@/components/auth/AuthPanelPreview";
import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Cloud,
  Lock,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

const capabilities = [
  { icon: CalendarDays, title: "Agenda diaria y semanal" },
  { icon: Users, title: "Pacientes e historial" },
  { icon: Stethoscope, title: "Profesionales y horarios" },
  { icon: ShieldCheck, title: "Acceso seguro del equipo" },
] as const;

const trustSignals = [
  { icon: Lock, label: "Sesión protegida" },
  { icon: Cloud, label: "Datos en la nube" },
] as const;

interface AuthBrandPanelProps {
  className?: string;
}

export function AuthBrandPanel({ className }: AuthBrandPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden h-[100dvh] overflow-hidden border-r border-brand-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white lg:flex",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl"
      />

      <div className="relative grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] px-7 py-6 xl:px-10 xl:py-7">
        <header className="max-w-xl">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-10 w-10 shrink-0" />
            <div>
              <p className="text-base font-bold tracking-tight">{siteConfig.name}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-brand-100">
                {siteConfig.tagline}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
            {siteConfig.clinicName}
          </p>
          <h2 className="mt-1.5 text-xl font-bold leading-tight tracking-tight xl:text-2xl">
            Tu consultorio, organizado en un solo panel
          </h2>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-brand-50/90 xl:text-sm">
            Turnos, pacientes y profesionales en una sola plataforma.
          </p>
        </header>

        <div className="grid min-h-0 items-center gap-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-6 xl:gap-8">
          <section aria-label="Funcionalidades principales" className="min-w-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-100">
              Qué podés hacer
            </p>
            <div className="grid grid-cols-2 gap-2">
              {capabilities.map((item) => (
                <article
                  key={item.title}
                  className="flex items-start gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-medium leading-snug text-brand-50 xl:text-xs">
                    {item.title}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="hidden shrink-0 lg:block">
            <AuthPanelPreview />
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
          {trustSignals.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-brand-50"
            >
              <item.icon className="h-3 w-3 shrink-0" />
              {item.label}
            </span>
          ))}
          <span className="text-[11px] text-brand-100/90">
            {siteConfig.name} · v1.0
          </span>
        </footer>
      </div>
    </aside>
  );
}
