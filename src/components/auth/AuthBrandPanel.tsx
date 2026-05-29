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
        className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]"
      />

      <div className="relative flex h-full w-full flex-col px-8 py-7 xl:px-12 xl:py-9">
        <header className="shrink-0">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 shrink-0" />
            <div>
              <p className="text-base font-bold tracking-tight">{siteConfig.name}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-brand-100">
                {siteConfig.tagline}
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center py-6 xl:py-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 xl:gap-12">
            <div className="flex flex-col justify-center gap-8 xl:gap-9">
              <div className="max-w-md space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                  {siteConfig.clinicName}
                </p>
                <h2 className="text-2xl font-bold leading-tight tracking-tight xl:text-[1.75rem] xl:leading-snug">
                  Tu consultorio, organizado en un solo panel
                </h2>
                <p className="text-sm leading-relaxed text-brand-50/90">
                  Turnos, pacientes y profesionales en una sola plataforma.
                </p>
              </div>

              <section aria-label="Funcionalidades principales" className="max-w-lg">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                  Qué podés hacer
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {capabilities.map((item) => (
                    <article
                      key={item.title}
                      className="flex flex-col gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm xl:p-4"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-medium leading-snug text-brand-50 xl:text-[13px]">
                        {item.title}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-center lg:justify-end xl:justify-center">
              <AuthPanelPreview />
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-white/15 pt-5">
          {trustSignals.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-brand-50"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </span>
          ))}
          <span className="text-xs text-brand-100/90">{siteConfig.name} · v1.0</span>
        </footer>
      </div>
    </aside>
  );
}
