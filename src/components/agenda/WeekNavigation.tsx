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

export function WeekNavigation({
  weekStart,
  isCurrentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
}: WeekNavigationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold capitalize text-slate-900">
        {formatWeekRangeLabel(weekStart)}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-2 sm:px-3"
          onClick={onPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Semana anterior</span>
          <span className="sm:hidden">Ant.</span>
        </Button>
        <Button
          type="button"
          variant={isCurrentWeek ? "default" : "outline"}
          size="sm"
          className="px-2 sm:px-3"
          onClick={onCurrentWeek}
        >
          <span className="truncate text-xs sm:text-sm">
            <span className="sm:hidden">Actual</span>
            <span className="hidden sm:inline">Semana actual</span>
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-2 sm:px-3"
          onClick={onNextWeek}
        >
          <span className="hidden sm:inline">Semana siguiente</span>
          <span className="sm:hidden">Sig.</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
