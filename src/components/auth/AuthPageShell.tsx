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
    <div className="h-[100dvh] overflow-hidden lg:grid lg:grid-cols-2 lg:[&>*]:min-w-0">
      <AuthBrandPanel />

      <div
        className={cn(
          "flex h-[100dvh] min-h-0 flex-col justify-start overflow-hidden gradient-subtle px-5 pb-6 pt-[calc(env(safe-area-inset-top)+2.5rem)] sm:justify-center sm:px-6 sm:py-6 lg:px-8 lg:py-6 2xl:px-10",
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
