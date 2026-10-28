"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleLabel } from "@/lib/auth/roles";
import { formatTodayLongLabel } from "@/lib/date-utils";
import { siteConfig } from "@/lib/site-config";
import { cn, getInitials } from "@/lib/utils";
import { ChevronDown, KeyRound, LogOut, Plus, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const { canSchedule, canManagePatients } = usePermissions();
  // En Pacientes y en la Agenda la página ya tiene su buscador y su "Agendar turno".
  const showPatientSearch = canManagePatients && pathname !== "/pacientes";
  const showSchedule = canSchedule && pathname !== "/agenda";
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
    <header className="sticky top-0 z-30 print:hidden border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
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
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                {siteConfig.clinicName}
              </p>
              <TodayLabel />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showPatientSearch && (
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
                aria-label="Buscar pacientes por nombre, DNI o CUIL"
                className="w-56 bg-muted/50 pl-9 lg:w-64"
              />
            </form>
          )}

          {showSchedule && (
            <>
              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/agenda?nuevo=1" aria-label="Agendar turno">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>

              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/agenda?nuevo=1">
                  <Plus className="h-4 w-4" />
                  Agendar turno
                </Link>
              </Button>
            </>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menú de tu cuenta"
                  className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                    {getInitials(user.name ?? "")}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs font-semibold text-slate-900">{user.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{getRoleLabel(user.role)}</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  <span className="mt-1 block text-xs text-brand-700">{getRoleLabel(user.role)}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/cambiar-contrasena" className="cursor-pointer">
                    <KeyRound className="h-4 w-4" />
                    Cambiar contraseña
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn("cursor-pointer text-red-600 focus:text-red-700")}
                  onSelect={() => void signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
