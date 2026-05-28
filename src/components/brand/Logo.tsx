import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { Activity } from "lucide-react";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

const sizeStyles: Record<
  LogoSize,
  {
    box: string;
    icon: string;
    title: string;
    tagline: string;
    gap: string;
  }
> = {
  sm: {
    box: "h-8 w-8 rounded-lg",
    icon: "h-4 w-4",
    title: "text-sm font-bold",
    tagline: "text-[9px]",
    gap: "gap-2",
  },
  md: {
    box: "h-9 w-9 rounded-xl",
    icon: "h-5 w-5",
    title: "text-base font-bold",
    tagline: "text-[10px]",
    gap: "gap-3",
  },
  lg: {
    box: "h-11 w-11 rounded-xl",
    icon: "h-6 w-6",
    title: "text-lg font-bold",
    tagline: "text-[11px]",
    gap: "gap-3",
  },
};

interface LogoProps {
  size?: LogoSize;
  showTagline?: boolean;
  showText?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  showTagline = true,
  showText = true,
  href,
  className,
}: LogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center gradient-brand shadow-sm ring-1 ring-brand-600/10",
          styles.box
        )}
        aria-hidden
      >
        <Activity className={cn("text-white", styles.icon)} strokeWidth={2.25} />
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={cn("tracking-tight text-slate-900", styles.title)}>
            <span>Kine</span>
            <span className="text-brand-600">Turnos</span>
          </p>
          {showTagline && (
            <p
              className={cn(
                "font-medium uppercase tracking-widest text-brand-600/90",
                styles.tagline
              )}
            >
              {siteConfig.tagline}
            </p>
          )}
        </div>
      )}
    </>
  );

  const wrapperClass = cn(
    "flex items-center",
    styles.gap,
    href && "transition-opacity hover:opacity-90",
    className
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label={siteConfig.name}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

/** Solo el ícono de marca, útil en avatares compactos */
export function LogoMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-xs font-bold text-white shadow-sm ring-1 ring-brand-600/10",
        className
      )}
      aria-hidden
    >
      <Activity className={cn("h-4 w-4", iconClassName)} strokeWidth={2.25} />
    </div>
  );
}
