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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative z-[1] flex h-full w-full flex-col px-8 py-7 xl:px-12 xl:py-9">
        <header className="shrink-0">
          <div className="flex items-center gap-3.5">
            <LogoMark className="h-12 w-12 shrink-0" />
            <div>
              <p className="text-lg font-bold tracking-tight">{siteConfig.name}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                {siteConfig.tagline}
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="w-full shrink-0 space-y-4 pt-4 text-left xl:pt-5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                {siteConfig.clinicName}
              </p>
              <div aria-hidden className="h-0.5 w-8 rounded-full bg-brand-300" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
              Tu consultorio, organizado en un solo panel
            </h2>
            <p className="text-sm leading-relaxed text-brand-50/90 xl:text-base">
              Menos papeleo. Más tiempo con tus pacientes.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center py-6 xl:py-8">
            <AuthPanelPreview />
          </div>

          <section
            aria-label="Funcionalidades principales"
            className="w-full shrink-0 pb-2"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
              Qué podés hacer
            </p>
            <div className="grid grid-cols-4 gap-2">
              {capabilities.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/15 p-2.5 text-center backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 xl:p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-medium leading-snug text-brand-50 xl:text-xs">
                    {item.title}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-4 flex shrink-0 flex-wrap items-center gap-3 border-t border-white/25 pt-5">
          {trustSignals.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-brand-50"
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
