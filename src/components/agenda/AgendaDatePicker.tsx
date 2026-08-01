"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  APP_DATE_FORMAT,
  getTodayAppDate,
  isValidAppDate,
  normalizeAppDate,
  parseAppDate,
  toAppDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface AgendaDatePickerProps {
  value: string;
  onChange: (appDate: string) => void;
  className?: string;
}

export function AgendaDatePicker({
  value,
  onChange,
  className,
}: AgendaDatePickerProps) {
  const today = getTodayAppDate();
  const isToday = value === today;

  const shiftDay = (direction: -1 | 1) => {
    const parsed = parseAppDate(value) ?? new Date();
    onChange(toAppDate(addDays(parsed, direction)));
  };

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-2 sm:w-auto",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Día anterior"
        onClick={() => shiftDay(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="relative min-w-[9.5rem] flex-1 sm:flex-none">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          inputMode="numeric"
          aria-label="Fecha de la agenda"
          placeholder={APP_DATE_FORMAT}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => {
            const next = event.target.value.trim();
            if (isValidAppDate(next)) {
              onChange(normalizeAppDate(next));
            } else {
              onChange(normalizeAppDate(value) || today);
            }
          }}
          className="pl-9"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Día siguiente"
        onClick={() => shiftDay(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant={isToday ? "secondary" : "outline"}
        size="sm"
        disabled={isToday}
        onClick={() => onChange(today)}
      >
        Hoy
      </Button>
    </div>
  );
}
