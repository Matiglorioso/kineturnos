"use client";

import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { formatTodayLongLabel } from "@/lib/date-utils";
import { Bell, Plus, Search } from "lucide-react";
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
                Panel del consultorio
              </p>
              <TodayLabel />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Buscar en el consultorio…</span>
            <kbd className="ml-4 rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Ctrl K
            </kbd>
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
          </Button>

          <Button size="sm" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            Agendar turno
          </Button>

          <LogoMark className="h-9 w-9" />
        </div>
      </div>
    </header>
  );
}
