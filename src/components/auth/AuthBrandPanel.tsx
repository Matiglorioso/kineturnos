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
  {
    icon: CalendarDays,
    title: "Agenda",
    description: "Vista diaria y semanal con estados de turno",
  },
  {
    icon: Users,
    title: "Pacientes",
    description: "Fichas, historial y próximos turnos",
  },
  {
    icon: Stethoscope,
    title: "Profesionales",
    description: "Horarios, disponibilidad y carga del día",
  },
  {
    icon: ShieldCheck,
    title: "Equipo",
    description: "Acceso seguro para recepción y kinesiólogos",
  },
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
        "relative hidden overflow-hidden border-r border-brand-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white lg:flex lg:min-h-screen lg:min-h-[100dvh]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_45%)]"
      />

      <div className="relative flex w-full flex-col justify-center gap-8 px-8 py-10 xl:gap-10 xl:px-12 xl:py-14">
        <header className="max-w-lg">
          <div className="flex items-center gap-3">
            <LogoMark className="h-11 w-11 shrink-0" />
            <div>
              <p className="text-lg font-bold tracking-tight">{siteConfig.name}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-brand-100">
                {siteConfig.tagline}
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-100">
            {siteConfig.clinicName}
          </p>
          <h2 className="mt-2 max-w-md text-2xl font-bold leading-tight tracking-tight xl:text-[1.75rem] xl:leading-snug">
            Tu consultorio, organizado en un solo panel
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-50/90">
            {siteConfig.description}
          </p>
        </header>

        <AuthPanelPreview />

        <section aria-label="Funcionalidades principales" className="max-w-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-100">
            Qué podés hacer
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {capabilities.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-50/85">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex max-w-lg flex-wrap items-center gap-3 border-t border-white/15 pt-6">
          {trustSignals.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-brand-50"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </span>
          ))}
          <span className="text-xs text-brand-100/90">
            Plataforma {siteConfig.name} · v1.0
          </span>
        </footer>
      </div>
    </aside>
  );
}
