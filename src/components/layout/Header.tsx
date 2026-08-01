"use client";

import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleLabel } from "@/lib/auth/roles";
import { formatTodayLongLabel } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { LogOut, Plus, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { canSchedule, canManagePatients } = usePermissions();
  const [patientQuery, setPatientQuery] = useState("");

  const handlePatientSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = patientQuery.trim();
    const href = query
      ? `/pacientes?q=${encodeURIComponent(query)}`
      : "/pacientes";
    router.push(href);
  };

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
            <form
              onSubmit={handlePatientSearch}
              className="relative hidden md:block"
              role="search"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={patientQuery}
                onChange={(event) => setPatientQuery(event.target.value)}
                placeholder="Buscar pacientes…"
                aria-label="Buscar pacientes por nombre o DNI"
                className="w-56 bg-muted/50 pl-9 lg:w-64"
              />
            </form>
          )}

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
