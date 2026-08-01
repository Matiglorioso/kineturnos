"use client";

import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleLabel } from "@/lib/auth/roles";
import { formatTodayLongLabel } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { Bell, LogOut, Plus, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

function TodayLabel() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(formatTodayLongLabel());
  }, []);

  return (
    <p className="text-sm font-semibold capitalize text-slate-900">
      {today || "\u00A0"}
    </p>
  );
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const { canSchedule, canManagePatients } = usePermissions();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="pl-10 lg:pl-0">
          {title ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {siteConfig.clinicName}
              </p>
              <TodayLabel />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {canManagePatients && (
            <Link
              href="/pacientes"
              className="hidden items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 py-2 transition-colors hover:bg-muted md:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Buscar pacientes</span>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
          </Button>

          {canSchedule && (
            <>
              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/agenda" aria-label="Agendar turno">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>

              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/agenda">
                  <Plus className="h-4 w-4" />
                  Agendar turno
                </Link>
              </Button>
            </>
          )}

          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getRoleLabel(user.role)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar sesión"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          <LogoMark className="h-9 w-9" />
        </div>
      </div>
    </header>
  );
}
