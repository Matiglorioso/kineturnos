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
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />
      <div
        className={cn(
          "transition-[padding] duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        <Header />
        <main className="animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
