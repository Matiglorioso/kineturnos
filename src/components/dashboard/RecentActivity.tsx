"use client";

import { EmptyStateFromPreset } from "@/components/ui/EmptyState";
import { emptyStateActions, emptyStates } from "@/lib/empty-states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CalendarCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const typeConfig = {
  appointment: {
    icon: Activity,
    color: "bg-sky-50 text-sky-600",
  },
  patient: {
    icon: UserPlus,
    color: "bg-violet-50 text-violet-600",
  },
  cancellation: {
    icon: XCircle,
    color: "bg-red-50 text-red-600",
  },
  confirmation: {
    icon: CalendarCheck,
    color: "bg-emerald-50 text-emerald-600",
  },
};

function RelativeTime({ timestamp }: { timestamp: string }) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    setTimeAgo(
      formatDistanceToNow(parseISO(timestamp), {
        addSuffix: true,
        locale: es,
      })
    );
  }, [timestamp]);

  return (
    <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo || "\u00A0"}</p>
  );
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyStateFromPreset
            preset={emptyStates.dashboard.noActivity}
            size="compact"
            actionLabel={emptyStateActions.goToPatients}
            actionHref="/pacientes"
          />
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50",
                    index !== items.length - 1 && "border-b border-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      config.color
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{item.message}</p>
                    <RelativeTime timestamp={item.timestamp} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
