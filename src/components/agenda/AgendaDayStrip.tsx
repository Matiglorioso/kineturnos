"use client";

import { AgendaCalendarDialog } from "@/components/agenda/AgendaCalendarDialog";
import { Button } from "@/components/ui/button";
import {
  dayAriaLabel,
  formatCalendarMonth,
  formatDayCount,
  getCalendarMonth,
  getDefaultDayForMonth,
  getMonthDays,
  getMonthTabs,
  isSameCalendarMonth,
  isSunday,
} from "@/lib/agenda-calendar";
import { formatAppDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AgendaDayStripProps {
  /** Día elegido (dd-MM-yyyy). */
  value: string;
  today: string;
  /** Turnos por día, con los filtros aplicados. */
  counts: Map<string, number>;
  onChange: (appDate: string) => void;
}

/** Selector de día "en vivo": meses en pestañas y los días del mes en una tira. */
export function AgendaDayStrip({ value, today, counts, onChange }: AgendaDayStripProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedMonth = getCalendarMonth(value);
  const tabs = getMonthTabs(getCalendarMonth(today), selectedMonth);
  const days = getMonthDays(selectedMonth);

  // Mantiene el día elegido a la vista (centrado) al cambiar de día o de mes.
  useEffect(() => {
    const strip = stripRef.current;
    const selected = strip?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!strip || !selected) return;
    strip.scrollTo({
      left: selected.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2,
    });
  }, [value]);

  const scrollStrip = (direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8 });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div
          role="tablist"
          aria-label="Mes de la agenda"
          className="inline-flex w-full rounded-xl bg-muted p-1 lg:col-start-2 lg:w-auto"
        >
          {tabs.map((tab) => {
            const active = isSameCalendarMonth(tab, selectedMonth);
            const [monthName, year] = formatCalendarMonth(tab).split(" ");
            return (
              <button
                key={`${tab.year}-${tab.month}`}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(getDefaultDayForMonth(tab, today))}
                className={cn(
                  "flex flex-1 flex-col items-center rounded-lg px-3 py-1.5 text-sm font-medium leading-tight transition-all lg:flex-none lg:px-6",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {monthName}
                <span className={cn("text-xs font-normal", active ? "opacity-90" : "text-muted-foreground")}>
                  {year}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 lg:justify-self-end [&>button]:flex-1 lg:[&>button]:flex-none">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={value === today}
            onClick={() => onChange(today)}
          >
            Hoy
          </Button>
          <Button type="button" size="sm" onClick={() => setCalendarOpen(true)}>
            <CalendarDays className="h-4 w-4" />
            Ver calendario
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Días anteriores"
          onClick={() => scrollStrip(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={stripRef}
          role="group"
          aria-label={`Días de ${formatCalendarMonth(selectedMonth)}`}
          className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((date) => {
            const count = counts.get(date) ?? 0;
            const selected = date === value;
            const isToday = date === today;
            const sunday = isSunday(date);
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected}
                aria-label={dayAriaLabel(date, count)}
                onClick={() => onChange(date)}
                className={cn(
                  "relative flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : count > 0
                      ? "text-slate-900 hover:bg-brand-50"
                      : "text-slate-400 hover:bg-muted",
                  sunday && !selected && "opacity-60"
                )}
              >
                <span className="text-[11px] font-medium uppercase">
                  {formatAppDate(date, "EEE").replace(".", "")}
                </span>
                <span className="text-xl font-semibold leading-tight">
                  {formatAppDate(date, "d")}
                </span>
                <span className="text-[10px] uppercase">
                  {formatAppDate(date, "MMM").replace(".", "")}
                </span>
                <span className="mt-1 flex h-4 items-center">
                  {count > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] font-semibold leading-4",
                        selected ? "bg-white/25 text-white" : "bg-brand-100 text-brand-800"
                      )}
                    >
                      {formatDayCount(count)}
                    </span>
                  ) : isToday ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                {isToday && !selected && (
                  <span className="sr-only">(hoy)</span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Días siguientes"
          onClick={() => scrollStrip(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <AgendaCalendarDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        value={value}
        today={today}
        counts={counts}
        onSelect={(date) => {
          onChange(date);
          setCalendarOpen(false);
        }}
      />
    </div>
  );
}
