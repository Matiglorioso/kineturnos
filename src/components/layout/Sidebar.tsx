"use client";

import { Logo } from "@/components/brand/Logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useState, type ComponentType } from "react";

/**
 * Patrón de portales SaaS (Linear / Notion / dashboards):
 * - Toggle en el header del sidebar, junto al logo.
 * - Collapsed = rail de íconos + tooltips.
 * - Links con next/link (sin preventDefault / routers manuales).
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

function NavLink({
  href,
  name,
  icon: Icon,
  isActive,
  compact,
  onNavigate,
}: {
  href: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      prefetch
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-xl text-sm font-medium transition-colors duration-200",
        compact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive
            ? "text-brand-600"
            : "text-slate-400 group-hover:text-slate-600"
        )}
      />
      {/* No animar labels ocultos: evita spans opacity-0 que interceptan clicks */}
      {!compact && (
        <>
          <span className="truncate">{name}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          )}
        </>
      )}
    </Link>
  );

  if (!compact) {
    return link;
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {name}
      </TooltipContent>
    </Tooltip>
  );
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

  const renderNav = (options: {
    compact: boolean;
    onNavigate?: () => void;
  }) => {
    const { compact, onNavigate } = options;

    return (
      <>
        <nav className={cn("flex-1 space-y-1 p-3", compact ? "overflow-visible" : "overflow-y-auto")}>
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
              <NavLink
                key={item.href}
                href={item.href}
                name={item.name}
                icon={item.icon}
                isActive={isActive}
                compact={compact}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>

        <nav className="space-y-1 px-3 pb-3">
          {!compact && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Soporte
            </p>
          )}
          {visibleSecondary.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                href={item.href}
                name={item.name}
                icon={item.icon}
                isActive={isActive}
                compact={compact}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <button
        type="button"
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
          aria-hidden
        />
      )}

      {/* Drawer móvil */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200/60 px-5">
          <Logo href="/" size="md" />
        </div>
        {renderNav({
          compact: false,
          onNavigate: () => setMobileOpen(false),
        })}
      </aside>

      {/* Rail fijo desktop / notebook */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-[width] lg:flex",
          SIDEBAR_TRANSITION,
          collapsed ? "w-[4.5rem] overflow-visible" : "w-72 overflow-hidden"
        )}
      >
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
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
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
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "bottom"}>
                {collapsed ? "Expandir menú" : "Colapsar menú"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {renderNav({ compact: collapsed })}
      </aside>
    </TooltipProvider>
  );
}
