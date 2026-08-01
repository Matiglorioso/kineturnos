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
        "@container relative hidden h-[100dvh] min-w-0 overflow-hidden border-r border-brand-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white lg:flex",
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

      <div className="relative z-[1] flex h-full min-h-0 w-full min-w-0 flex-col px-6 py-5 lg:gap-3 @[52rem]:gap-0 @[52rem]:px-12 @[52rem]:py-9">
        <header className="shrink-0">
          <div className="flex items-center gap-2.5 @[52rem]:gap-3.5">
            <LogoMark className="h-10 w-10 shrink-0 @[52rem]:h-12 @[52rem]:w-12" />
            <div className="min-w-0">
              <p className="text-base font-bold tracking-tight @[52rem]:text-lg">{siteConfig.name}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                {siteConfig.tagline}
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:justify-start @[52rem]:gap-0">
          <div className="w-full min-w-0 shrink-0 space-y-2.5 pt-3 text-left lg:space-y-2 @[52rem]:space-y-4 @[52rem]:pt-5">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                {siteConfig.clinicName}
              </p>
              <div aria-hidden className="h-0.5 w-8 rounded-full bg-brand-300" />
            </div>
            <h2 className="text-balance text-[1.65rem] font-extrabold leading-snug tracking-tight @[52rem]:text-4xl @[52rem]:leading-tight">
              Tu consultorio, organizado en un solo panel
            </h2>
            <p className="text-xs leading-relaxed text-brand-50/90 @[52rem]:text-base">
              Menos papeleo. Más tiempo con tus pacientes.
            </p>
          </div>

          <div className="flex w-full min-w-0 shrink-0 items-center justify-center overflow-hidden py-1 @[52rem]:min-h-0 @[52rem]:flex-1 @[52rem]:py-8">
            <AuthPanelPreview />
          </div>

          <section
            aria-label="Funcionalidades principales"
            className="w-full min-w-0 shrink-0 pb-1 @[52rem]:pb-2"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-brand-100 @[52rem]:mb-3">
              Qué podés hacer
            </p>
            <div className="grid grid-cols-2 gap-2 @[52rem]:grid-cols-4">
              {capabilities.map((item) => (
                <article
                  key={item.title}
                  className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 p-2 text-center backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 @[52rem]:gap-2 @[52rem]:p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 @[52rem]:h-7 @[52rem]:w-7">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[10px] font-medium leading-snug text-brand-50 @[52rem]:text-xs">
                    {item.title}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-2 flex shrink-0 flex-wrap items-center gap-2 border-t border-white/25 pt-3 @[52rem]:mt-4 @[52rem]:gap-3 @[52rem]:pt-5">
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
