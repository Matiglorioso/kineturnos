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

const DOT_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")";

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
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: DOT_PATTERN }}
      />
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
          <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6 xl:gap-10 xl:py-8">
            <div className="w-full max-w-lg space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">
                  {siteConfig.clinicName}
                </p>
                <div className="h-0.5 w-8 rounded-full bg-brand-300" aria-hidden />
              </div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
                Tu consultorio, organizado en un solo panel
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-brand-50/90 xl:text-base">
                Menos papeleo. Más tiempo con tus pacientes.
              </p>
            </div>

            <div className="flex w-full justify-center">
              <AuthPanelPreview />
            </div>
          </div>

          <section
            aria-label="Funcionalidades principales"
            className="w-full max-w-xl shrink-0 pb-2"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
              Qué podés hacer
            </p>
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col gap-2.5 rounded-xl border border-white/20 bg-white/15 p-3.5 backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 xl:p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <p className="text-[13px] font-medium leading-snug text-brand-50">
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
