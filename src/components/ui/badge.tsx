import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        danger:
          "border-transparent bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
        warning:
          "border-transparent bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
        info:
          "border-transparent bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15",
        neutral:
          "border-transparent bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
