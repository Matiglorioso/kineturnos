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
  PanelLeftClose,
  PanelLeftOpen,
  Stethoscope,
  UserCog,
  Users,
  ShieldCheck,
  History,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType } from "react";

/**
 * Patrón de portales SaaS (Linear / Notion / dashboards):
 * - Toggle en el header del sidebar, junto al logo.
 * - Collapsed = rail de íconos + tooltips.
 * - Links con next/link (sin preventDefault / routers manuales).
 */
const SIDEBAR_TRANSITION =
  "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const navigation = [
  {
    name: "Panel",
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
  {
    name: "Obras sociales",
    href: "/obras-sociales",
    icon: ShieldCheck,
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: UserCog,
  },
  {
    name: "Auditoría",
    href: "/auditoria",
    icon: History,
  },
];

export const secondaryNavigation = [
  {
    name: "Ayuda",
    href: "/proyecto",
    icon: CircleHelp,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Menú del celular: lo abre "Más" de la barra de abajo. */
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
          ? "bg-white/[0.12] font-semibold text-white shadow-[inset_3px_0_0_theme(colors.brand.200)]"
          : "text-brand-50/85 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-white" : "text-brand-200"
        )}
      />
      {/* No animar labels ocultos: evita spans opacity-0 que interceptan clicks */}
      {!compact && (
        <>
          <span className="truncate">{name}</span>
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

        <nav aria-label="Soporte" className="mx-3 space-y-1 border-t border-white/10 pb-3 pt-3">
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

      {/* Rail fijo desktop / notebook */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-brand-800 transition-[width] lg:flex",
          SIDEBAR_TRANSITION,
          collapsed ? "w-[4.5rem] overflow-visible" : "w-72 overflow-hidden"
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-white/10",
            collapsed ? "justify-center px-2" : "gap-1 px-3 pr-2"
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden px-1">
              <Logo href="/" size="md" showText showTagline tone="dark" />
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
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-200 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
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
