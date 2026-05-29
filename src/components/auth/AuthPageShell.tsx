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
      <AuthBrandPanel variant="compact" className="lg:hidden" />

      <AuthBrandPanel variant="full" className="hidden lg:flex" />

      <div
        className={cn(
          "flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50/80 via-white to-white px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12 xl:px-12",
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
