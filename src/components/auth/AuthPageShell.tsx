import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { cn } from "@/lib/utils";

interface AuthPageShellProps {
  children: React.ReactNode;
  className?: string;
  contentMaxWidth?: "md" | "2xl";
}

export function AuthPageShell({
  children,
  className,
  contentMaxWidth = "md",
}: AuthPageShellProps) {
  return (
    <div className="h-[100dvh] overflow-hidden lg:grid lg:grid-cols-2">
      <AuthBrandPanel />

      <div
        className={cn(
          "flex h-[100dvh] min-h-0 flex-col justify-center overflow-hidden gradient-subtle px-4 py-6 sm:px-6 lg:bg-gradient-to-b lg:from-slate-50/80 lg:via-white lg:to-white lg:px-8 lg:py-6 xl:px-10",
          className
        )}
      >
        <div
          className={cn(
            "mx-auto w-full min-h-0 overflow-y-auto lg:overflow-visible",
            contentMaxWidth === "2xl" ? "max-w-2xl" : "max-w-md"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
