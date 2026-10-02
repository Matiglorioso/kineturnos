"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dayAriaLabel,
  formatCalendarMonth,
  formatDayCount,
  getCalendarMonth,
  getMonthGrid,
  shiftCalendarMonth,
  type CalendarMonth,
} from "@/lib/agenda-calendar";
import { formatAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface AgendaCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  today: string;
  counts: Map<string, number>;
  onSelect: (appDate: string) => void;
}

/** Calendario mensual para elegir el día de la agenda, con la cantidad de turnos por día. */
export function AgendaCalendarDialog({
  open,
  onOpenChange,
  value,
  today,
  counts,
  onSelect,
}: AgendaCalendarDialogProps) {
  const [month, setMonth] = useState<CalendarMonth>(() => getCalendarMonth(value));

  // Al abrir, muestra el mes del día elegido.
  useEffect(() => {
    if (open) setMonth(getCalendarMonth(value));
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Elegir fecha</DialogTitle>
          <DialogDescription>Los números indican cuántos turnos hay ese día.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => setMonth((current) => shiftCalendarMonth(current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="font-semibold text-slate-900" aria-live="polite">
            {formatCalendarMonth(month)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => setMonth((current) => shiftCalendarMonth(current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div role="grid" aria-label={formatCalendarMonth(month)} className="space-y-1.5">
          <div role="row" className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                role="columnheader"
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          {getMonthGrid(month).map((week) => (
            <div key={week[0].date} role="row" className="grid grid-cols-7 gap-1.5">
              {week.map(({ date, inMonth }) => {
                const count = counts.get(date) ?? 0;
                const selected = date === value;
                const isToday = date === today;
                return (
                  <div key={date} role="gridcell">
                    <button
                      type="button"
                      aria-label={dayAriaLabel(date, count)}
                      aria-pressed={selected}
                      onClick={() => onSelect(date)}
                      className={cn(
                        "relative flex aspect-square w-full flex-col items-center justify-center rounded-xl text-sm transition-colors sm:aspect-[5/4]",
                        selected
                          ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                          : count > 0
                            ? "bg-brand-50 font-medium text-brand-900 hover:bg-brand-100"
                            : "text-slate-500 hover:bg-muted",
                        !inMonth && !selected && "opacity-40",
                        isToday && !selected && "ring-2 ring-primary/40"
                      )}
                    >
                      {formatAppDate(date, "d")}
                      {count > 0 && (
                        <span
                          className={cn(
                            "absolute right-1 top-1 rounded-full px-1 text-[10px] font-semibold leading-4",
                            selected ? "bg-white/25 text-white" : "text-brand-700"
                          )}
                        >
                          {formatDayCount(count)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-brand-50 ring-1 ring-brand-200" />
            Con turnos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-primary" />
            Seleccionado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-primary/40" />
            Hoy
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
