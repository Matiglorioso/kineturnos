import { canAccessPage } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@prisma/client";
import { ArrowRight, CalendarDays, ShieldCheck, Stethoscope, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

const SHORTCUTS: { href: string; title: string; description: string; icon: LucideIcon; tone: string }[] = [
  {
    href: "/agenda",
    title: "Agenda",
    description: "Turnos del día y de la semana",
    icon: CalendarDays,
    tone: "bg-brand-50 text-brand-700",
  },
  {
    href: "/pacientes",
    title: "Pacientes",
    description: "Fichas e historia clínica",
    icon: Users,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    href: "/obras-sociales",
    title: "Obras sociales",
    description: "Autorizaciones y planilla mensual",
    icon: ShieldCheck,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    href: "/profesionales",
    title: "Profesionales",
    description: "Equipo y días de atención",
    icon: Stethoscope,
    tone: "bg-emerald-50 text-emerald-700",
  },
];

/** Accesos a las secciones clave, según lo que puede ver cada perfil. */
export function DashboardShortcuts({ role }: { role: RolUsuario | undefined }) {
  const items = role ? SHORTCUTS.filter((item) => canAccessPage(role, item.href)) : [];
  if (items.length === 0) return null;

  return (
    <nav aria-label="Accesos rápidos">
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4", items.length >= 4 && "lg:grid-cols-4")}>
        {items.map(({ href, title, description, icon: Icon, tone }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3"
            >
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 self-stretch sm:self-auto">
                <span className="block truncate font-semibold text-slate-900">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{description}</span>
              </span>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-700 sm:block" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
