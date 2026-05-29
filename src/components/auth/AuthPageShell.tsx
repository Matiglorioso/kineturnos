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
    <div className="min-h-screen min-h-[100dvh] lg:grid lg:grid-cols-2">
      <AuthBrandPanel />

      <div
        className={cn(
          "flex flex-1 items-center justify-center gradient-subtle px-4 py-10 sm:px-6 sm:py-12 lg:bg-gradient-to-b lg:from-slate-50/80 lg:via-white lg:to-white lg:px-10 lg:py-12 xl:px-12",
          className
        )}
      >
        <div
          className={cn(
            "w-full",
            contentMaxWidth === "2xl" ? "max-w-2xl" : "max-w-md"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
