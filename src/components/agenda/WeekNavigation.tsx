import { Button } from "@/components/ui/button";
import { formatWeekRangeLabel } from "@/lib/week-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigationProps {
  weekStart: Date;
  isCurrentWeek: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

/** Semana mostrada entre flechas, con el mismo estilo que la tira de días de la vista Lista. */
export function WeekNavigation({
  weekStart,
  isCurrentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card sm:p-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Semana anterior"
          onClick={onPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p
          className="min-w-0 truncate text-center text-sm font-semibold capitalize text-slate-900 sm:min-w-[14rem] sm:text-base"
          aria-live="polite"
        >
          {formatWeekRangeLabel(weekStart)}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Semana siguiente"
          onClick={onNextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isCurrentWeek}
        onClick={onCurrentWeek}
      >
        Hoy
      </Button>
    </div>
  );
}
