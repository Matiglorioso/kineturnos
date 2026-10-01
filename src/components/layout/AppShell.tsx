"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "kineturnos.sidebar-collapsed";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isStandalonePage = pathname === "/login" || pathname === "/ayuda";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // localStorage no disponible
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // localStorage no disponible
      }
      return next;
    });
  };

  if (isStandalonePage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />
      </div>
      <div
        className={cn(
          "relative z-0 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-72",
          "print:pl-0"
        )}
      >
        <Header />
        <main className="animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
