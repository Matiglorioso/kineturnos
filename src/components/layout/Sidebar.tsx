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

  const renderNav = (options: { compact: boolean; onNavigate?: () => void }) => {
    const { compact, onNavigate } = options;

    return (
      <>
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-200/60",
            compact ? "justify-center px-2" : "px-6"
          )}
        >
          <Logo href="/" size="md" showText={!compact} showTagline={!compact} />
        </div>

        <nav className={cn("flex-1 space-y-1", compact ? "p-2" : "p-4")}>
          {!compact && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Menu principal
            </p>
          )}
          {visibleNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={compact ? item.name : undefined}
                aria-label={compact ? item.name : undefined}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                  compact
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!compact && item.name}
                {!compact && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <nav className={cn("space-y-1", compact ? "px-2 pb-2" : "px-4 pb-4")}>
          {!compact && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Soporte
            </p>
          )}
          {visibleSecondary.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={compact ? item.name : undefined}
                aria-label={compact ? item.name : undefined}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                  compact
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!compact && item.name}
                {!compact && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              aria-expanded={!collapsed}
              className={cn(
                "mt-2 hidden w-full items-center rounded-xl text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 lg:flex",
                compact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5 shrink-0 text-slate-400" />
              ) : (
                <PanelLeftClose className="h-5 w-5 shrink-0 text-slate-400" />
              )}
              {!compact && (collapsed ? "Expandir" : "Colapsar")}
            </button>
          )}
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
        {renderNav({ compact: false, onNavigate: () => setMobileOpen(false) })}
      </aside>

      {/* Rail fijo desktop / notebook */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {renderNav({ compact: collapsed })}
      </aside>
    </>
  );
}
