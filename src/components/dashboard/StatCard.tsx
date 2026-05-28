import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "brand" | "emerald" | "amber" | "red" | "sky" | "violet";
  className?: string;
}

const accentStyles = {
  brand: {
    bg: "bg-brand-50",
    icon: "text-brand-600",
    ring: "ring-brand-100",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    ring: "ring-emerald-100",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    ring: "ring-amber-100",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    ring: "ring-red-100",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
    ring: "ring-sky-100",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    ring: "ring-violet-100",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
  accent = "brand",
  className,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card
      className={cn(
        "group p-5 transition-all duration-300 hover:shadow-elevated",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl ring-1",
            styles.bg,
            styles.icon,
            styles.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
  );
}
