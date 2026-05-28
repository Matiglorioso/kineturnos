"use client";

import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Menu,
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
    name: "Acerca del proyecto",
    href: "/proyecto",
    icon: BookOpen,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b border-slate-200/60 px-6">
        <Logo href="/" size="md" />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu principal
        </p>
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-brand-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <nav className="space-y-1 px-4 pb-2">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Proyecto
        </p>
        {secondaryNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-brand-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/60 p-4">
        <Link
          href="/proyecto"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "block rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 p-4 ring-1 ring-brand-100/50 transition-all hover:ring-brand-200",
            pathname.startsWith("/proyecto") && "ring-2 ring-brand-300"
          )}
        >
          <p className="text-xs font-semibold text-brand-800">Demo · Case study</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-600/90">
            Stack, decisiones técnicas y roadmap del producto.
          </p>
        </Link>
      </div>
    </>
  );

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

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        <NavContent />
      </aside>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white/95 lg:backdrop-blur-md">
        <NavContent />
      </aside>
    </>
  );
}
