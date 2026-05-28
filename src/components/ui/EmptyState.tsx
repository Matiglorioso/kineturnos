import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmptyStatePreset } from "@/lib/empty-states";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

export type EmptyStateSize = "default" | "compact" | "inline";

interface EmptyStateProps extends Partial<EmptyStatePreset> {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  size?: EmptyStateSize;
  className?: string;
}

const sizeStyles: Record<
  EmptyStateSize,
  { wrapper: string; iconBox: string; icon: string; title: string; description: string }
> = {
  default: {
    wrapper: "px-6 py-16",
    iconBox: "mb-5 h-14 w-14 rounded-2xl",
    icon: "h-7 w-7",
    title: "text-base",
    description: "mb-6 max-w-md",
  },
  compact: {
    wrapper: "px-5 py-10",
    iconBox: "mb-4 h-12 w-12 rounded-xl",
    icon: "h-6 w-6",
    title: "text-sm",
    description: "mb-4 max-w-sm",
  },
  inline: {
    wrapper: "px-4 py-6 sm:flex-row sm:items-center sm:gap-5 sm:text-left",
    iconBox: "mb-4 h-10 w-10 shrink-0 rounded-xl sm:mb-0",
    icon: "h-5 w-5",
    title: "text-sm",
    description: "mb-0 max-w-none sm:flex-1",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  size = "default",
  className,
}: EmptyStateProps) {
  const styles = sizeStyles[size];
  const isInline = size === "inline";
  const hasActions = Boolean(
    actionLabel || secondaryActionLabel || actionHref
  );

  const primaryButton =
    actionLabel &&
    (actionHref ? (
      <Button size="sm" asChild>
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : onAction ? (
      <Button type="button" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed border-brand-200/50",
        "bg-gradient-to-b from-brand-50/30 via-muted/25 to-muted/40 text-center",
        isInline ? "sm:text-left" : "",
        styles.wrapper,
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-100/40 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-brand-50/60 blur-2xl"
      />

      <div
        className={cn(
          "relative flex flex-col items-center",
          isInline && "sm:flex-row sm:items-center sm:gap-5"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100/90 text-brand-600 shadow-sm ring-4 ring-brand-50/80",
            styles.iconBox
          )}
        >
          <Icon className={styles.icon} strokeWidth={1.75} />
        </div>

        <div className={cn(isInline && "min-w-0 flex-1")}>
          <h3
            className={cn(
              "font-semibold tracking-tight text-slate-900",
              styles.title
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-muted-foreground",
              size === "default" ? "text-sm" : "text-xs sm:text-sm",
              styles.description
            )}
          >
            {description}
          </p>
        </div>

        {hasActions && (
          <div
            className={cn(
              "relative flex flex-wrap items-center justify-center gap-2",
              isInline
                ? "mt-4 w-full sm:mt-0 sm:w-auto sm:shrink-0"
                : "mt-2 w-full"
            )}
          >
            {primaryButton}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Atajo para usar presets de `empty-states.ts` */
export function EmptyStateFromPreset({
  preset,
  ...props
}: { preset: EmptyStatePreset } & Omit<
  EmptyStateProps,
  "icon" | "title" | "description"
>) {
  return (
    <EmptyState icon={preset.icon} title={preset.title} description={preset.description} {...props} />
  );
}
