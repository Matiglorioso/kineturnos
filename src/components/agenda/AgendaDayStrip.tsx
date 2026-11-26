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
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { useEffect, useState } from "react";

interface AgendaDayStripProps {
  /** Día elegido (dd-MM-yyyy). */
  value: string;
  today: string;
  /** Turnos por día, con los filtros aplicados. */
  counts: Map<string, number>;
  onChange: (appDate: string) => void;
  /** El calendario se puede abrir desde afuera (en el celular, tocando el mes del título). */
  calendarOpen?: boolean;
  onCalendarOpenChange?: (open: boolean) => void;
}

/** Selector de día "en vivo": meses en pestañas y los días del mes en una tira. */
export function AgendaDayStrip({
  value,
  today,
  counts,
  onChange,
  calendarOpen: calendarOpenProp,
  onCalendarOpenChange,
}: AgendaDayStripProps) {
  const [calendarOpenState, setCalendarOpenState] = useState(false);
  const calendarOpen = calendarOpenProp ?? calendarOpenState;
  const setCalendarOpen = (open: boolean) => {
    setCalendarOpenState(open);
    onCalendarOpenChange?.(open);
  };
  const { ref: stripRef, handlers: dragHandlers, wasDrag } = useDragScroll<HTMLDivElement>();
  const selectedMonth = getCalendarMonth(value);
  const tabs = getMonthTabs(getCalendarMonth(today), selectedMonth);
  // El consultorio no atiende los domingos: no se muestran, salvo que sea el día elegido.
  const days = getMonthDays(selectedMonth).filter((date) => !isSunday(date) || date === value);

  // Mantiene el día elegido a la vista (centrado) al cambiar de día o de mes.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const center = () => {
      const selected = strip.querySelector<HTMLElement>("[aria-pressed='true']");
      if (!selected) return;
      strip.scrollTo({
        left: selected.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2,
        // "instant": la tira tiene scroll suave por CSS, y una animación cortada la dejaba a mitad de camino.
        behavior: "instant",
      });
    };
    center();
    // El ancho final llega después del primer render (fuentes, menú lateral): recentra cuando cambia.
    const observer = new ResizeObserver(center);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [value, selectedMonth, days.length, stripRef]);

  const scrollStrip = (direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8 });
  };

  return (
    <div className="space-y-3">
      {/* Meses, "Hoy" y "Ver calendario": en la computadora (en el celular, el mes va en el título). */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-3">
        <div
          role="tablist"
          aria-label="Mes de la agenda"
          className="hidden w-full rounded-xl bg-muted p-1 lg:col-start-2 lg:inline-flex lg:w-auto"
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

        <div className="flex items-center justify-end gap-2 lg:justify-self-end">
          <span className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={value === today}
            onClick={() => onChange(today)}
          >
            Hoy
          </Button>
          <Button type="button" size="sm" aria-label="Ver calendario" onClick={() => setCalendarOpen(true)}>
            <CalendarDays className="h-4 w-4" />
            Ver calendario
          </Button>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden h-9 w-9 shrink-0 rounded-md lg:inline-flex"
          aria-label="Días anteriores"
          onClick={() => scrollStrip(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={stripRef}
          {...dragHandlers}
          role="group"
          aria-label={`Días de ${formatCalendarMonth(selectedMonth)}`}
          className="relative flex min-w-0 flex-1 cursor-grab touch-pan-x select-none gap-1 overflow-x-auto py-1 active:cursor-grabbing [scrollbar-width:none] max-lg:-mx-4 max-lg:gap-1.5 max-lg:px-4 [&::-webkit-scrollbar]:hidden"
        >
          {days.map((date) => {
            const count = counts.get(date) ?? 0;
            const selected = date === value;
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected}
                aria-label={dayAriaLabel(date, count)}
                onClick={() => {
                  // Un arrastre no cuenta como toque.
                  if (!wasDrag()) onChange(date);
                }}
                className={cn(
                  "relative flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 transition-colors",
                  // Celular: fichas blancas con borde, como el boceto.
                  "max-lg:w-12 max-lg:justify-center max-lg:rounded-xl max-lg:border max-lg:py-2",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm max-lg:border-primary"
                    : count > 0
                      ? "text-slate-900 hover:bg-brand-50 max-lg:border-slate-200 max-lg:bg-white"
                      : "text-slate-500 hover:bg-muted max-lg:border-slate-200 max-lg:bg-white"
                )}
              >
                <span className="text-[11px] font-medium uppercase">
                  {formatAppDate(date, "EEE").replace(".", "")}
                </span>
                <span className="text-xl font-semibold leading-tight">
                  {formatAppDate(date, "d")}
                </span>
                <span className="text-[10px] uppercase max-lg:hidden">
                  {formatAppDate(date, "MMM").replace(".", "")}
                </span>
                <span className="mt-1 flex h-4 items-center max-lg:hidden">
                  {count > 0 ? (
                    <span
                      className={cn(
                        "rounded px-1.5 text-[10px] font-semibold leading-4",
                        selected ? "bg-white text-brand-800" : "bg-brand-100 text-brand-800"
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
          className="hidden h-9 w-9 shrink-0 rounded-md lg:inline-flex"
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
