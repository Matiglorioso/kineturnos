import { LogoMark } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CalendarDays, ShieldCheck, Users } from "lucide-react";

const highlights = [
  {
    icon: CalendarDays,
    text: "Agenda diaria y semanal",
  },
  {
    icon: Users,
    text: "Pacientes y profesionales",
  },
  {
    icon: ShieldCheck,
    text: "Acceso seguro del equipo",
  },
] as const;

interface AuthBrandPanelProps {
  variant: "compact" | "full";
  className?: string;
}

export function AuthBrandPanel({ variant, className }: AuthBrandPanelProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white",
        isCompact
          ? "px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10"
          : "flex h-full flex-col justify-between border-r border-brand-100/80 px-8 py-10 xl:px-10 xl:py-12",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl sm:h-56 sm:w-56"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <LogoMark className={cn(isCompact ? "h-10 w-10 sm:h-11 sm:w-11" : "h-11 w-11")} />
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold tracking-tight text-white",
                isCompact ? "text-base sm:text-lg" : "text-lg"
              )}
            >
              {siteConfig.name}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-100 sm:text-[11px]">
              {siteConfig.tagline}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-100 sm:mt-5 sm:text-sm">
          {siteConfig.clinicName}
        </p>

        <h2
          className={cn(
            "mt-2 font-bold leading-tight tracking-tight text-white",
            isCompact
              ? "max-w-xl text-xl sm:text-2xl md:text-[1.75rem]"
              : "mt-3 max-w-md text-2xl xl:text-3xl"
          )}
        >
          {isCompact
            ? "Gestión de turnos para tu consultorio"
            : "Gestión de turnos para tu consultorio kinesiológico"}
        </h2>

        {!isCompact && (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-50/90">
            {siteConfig.description}
          </p>
        )}
      </div>

      <ul
        className={cn(
          "relative gap-2 sm:gap-3",
          isCompact
            ? "mt-5 grid grid-cols-1 sm:grid-cols-3 sm:gap-3 md:mt-6"
            : "mt-8 space-y-4 xl:mt-10"
        )}
      >
        {highlights.map((item) => (
          <li
            key={item.text}
            className={cn(
              "flex items-center gap-2.5 text-brand-50",
              isCompact
                ? "rounded-xl bg-white/10 px-3 py-2.5 text-xs sm:flex-col sm:items-start sm:px-3 sm:py-3 sm:text-[11px] md:text-xs"
                : "text-sm"
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-white/15",
                isCompact ? "h-7 w-7 sm:h-8 sm:w-8" : "mt-0.5 h-8 w-8"
              )}
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span className={cn(isCompact && "leading-snug")}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
