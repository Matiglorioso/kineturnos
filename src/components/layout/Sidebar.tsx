"use client";

import { Logo } from "@/components/brand/Logo";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccessPage } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Patrón de portales SaaS (Linear / Notion / dashboards):
 * - Toggle en el header del sidebar, junto al logo (no en el borde ni como ítem de nav).
 * - Collapsed = rail de íconos; labels con tooltip nativo.
 * - Animación de ancho fluida; íconos anclados a la izquierda.
 */
const SIDEBAR_TRANSITION =
  "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    name: "Pacientes",
    href: "/pacientes",
    icon: Users,
  },
  {
    name: "Profesionales",
    href: "/profesionales",
    icon: Stethoscope,
  },
];

const secondaryNavigation = [
  {
    name: "Ayuda",
    href: "/proyecto",
    icon: CircleHelp,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = usePermissions();

  const visibleNavigation = role
    ? navigation.filter((item) => canAccessPage(role, item.href))
    : navigation;
  const visibleSecondary = role
    ? secondaryNavigation.filter((item) => canAccessPage(role, item.href))
    : secondaryNavigation;

  const renderNavLinks = (options: {
    compact: boolean;
    onNavigate?: () => void;
    animateLabels?: boolean;
  }) => {
    const { compact, onNavigate, animateLabels = false } = options;
    const hideLabels = compact;

    const linkClass = (isActive: boolean) =>
      cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        isActive
          ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      );

    const labelClass = cn(
      "whitespace-nowrap",
      animateLabels
        ? cn(
            "overflow-hidden transition-[opacity,max-width] duration-200 ease-out",
            hideLabels ? "max-w-0 opacity-0" : "max-w-[11rem] opacity-100"
          )
        : hideLabels && "sr-only"
    );

    const sectionLabelClass = cn(
      "mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400",
      animateLabels
        ? cn(
            "overflow-hidden transition-[opacity,max-height,margin] duration-200",
            hideLabels ? "mb-0 max-h-0 opacity-0" : "max-h-6 opacity-100"
          )
        : hideLabels && "sr-only"
    );

    return (
      <>
        <nav className="flex-1 space-y-1 overflow-hidden p-3">
          <p className={sectionLabelClass}>Menu principal</p>
          {visibleNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={hideLabels ? item.name : undefined}
                aria-label={hideLabels ? item.name : undefined}
                onClick={onNavigate}
                className={linkClass(isActive)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className={labelClass}>{item.name}</span>
                {isActive && !hideLabels && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1 overflow-hidden px-3 pb-3">
          <p className={sectionLabelClass}>Soporte</p>
          {visibleSecondary.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={hideLabels ? item.name : undefined}
                aria-label={hideLabels ? item.name : undefined}
                onClick={onNavigate}
                className={linkClass(isActive)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className={labelClass}>{item.name}</span>
                {isActive && !hideLabels && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </>
    );
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-slate-600" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer móvil */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200/60 px-5">
          <Logo href="/" size="md" />
        </div>
        {renderNavLinks({
          compact: false,
          onNavigate: () => setMobileOpen(false),
        })}
      </aside>

      {/* Rail fijo desktop / notebook */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-[width] lg:flex",
          SIDEBAR_TRANSITION,
          collapsed ? "w-[4.5rem]" : "w-72"
        )}
      >
        {/* Header: logo + toggle (patrón Linear / Notion / dashboards SaaS) */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-slate-200/60",
            collapsed ? "justify-center px-2" : "gap-1 px-3 pr-2"
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden px-1">
              <Logo href="/" size="md" showText showTagline />
            </div>
          )}

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              aria-expanded={!collapsed}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {renderNavLinks({ compact: collapsed, animateLabels: true })}
      </aside>
    </>
  );
}
