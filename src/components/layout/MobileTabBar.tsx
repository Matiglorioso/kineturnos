"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { canAccessPage } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { CalendarDays, Home, Menu, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { name: "Hoy", href: "/", icon: Home },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Pacientes", href: "/pacientes", icon: Users },
];

/**
 * Navegación del celular: barra fija abajo, al alcance del pulgar (en la computadora está
 * el menú lateral). Las secciones que el perfil no puede ver no aparecen.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { role } = usePermissions();
  const tabs = role ? TABS.filter((tab) => canAccessPage(role, tab.href)) : TABS;

  const isTabActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // Las demás secciones (Profesionales, Obras sociales…) se abren desde la pantalla "Más".
  const moreActive = !TABS.some((tab) => isTabActive(tab.href));

  const item =
    "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors";

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden"
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(item, active ? "font-semibold text-brand-800" : "text-slate-500")}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full",
                active && "bg-brand-100"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            {tab.name}
          </Link>
        );
      })}
      <Link
        href="/mas"
        aria-current={moreActive ? "page" : undefined}
        className={cn(item, moreActive ? "font-semibold text-brand-800" : "text-slate-500")}
      >
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-brand-100")}>
          <Menu className="h-5 w-5" />
        </span>
        Más
      </Link>
    </nav>
  );
}
