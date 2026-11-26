"use client";

import { navigation, secondaryNavigation } from "@/components/layout/Sidebar";
import { MobilePageTitle } from "@/components/mobile/MobileUi";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccessPage } from "@/lib/auth/permissions";
import { getRoleLabel } from "@/lib/auth/roles";
import { siteConfig } from "@/lib/site-config";
import { cn, getInitials } from "@/lib/utils";
import { ChevronRight, KeyRound, LogOut, type LucideIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Lo que ya está en la barra de abajo no se repite acá. */
const IN_TAB_BAR = new Set(["/", "/agenda", "/pacientes"]);

const rowClass = "flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left text-[15px] font-semibold";

function MenuIcon({ icon: Icon, danger = false }: { icon: LucideIcon; danger?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
        danger ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/**
 * "Más" en el celular (boceto 13): la cuenta arriba, el resto de las secciones en filas y
 * al final cambiar contraseña y cerrar sesión. En la computadora está el menú lateral.
 */
export default function MasPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { role } = usePermissions();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (isDesktop) router.replace("/");
  }, [isDesktop, router]);

  // Hasta saber el perfil no se muestra nada (para no mostrar y sacar secciones).
  const sections = role
    ? [...navigation, ...secondaryNavigation].filter(
        (item) => !IN_TAB_BAR.has(item.href) && canAccessPage(role, item.href)
      )
    : [];

  return (
    <div className="space-y-4">
      <MobilePageTitle eyebrow={siteConfig.clinicName} title="Más" />

      {user && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold text-white">
            {getInitials(user.name ?? "")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-slate-900">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{getRoleLabel(user.role)}</span>
          </span>
        </div>
      )}

      <nav aria-label="Secciones">
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          {sections.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={cn(rowClass, "text-slate-900 active:bg-muted/60")}>
                <MenuIcon icon={item.icon as LucideIcon} />
                {item.name}
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <li>
          <Link href="/cambiar-contrasena" className={cn(rowClass, "text-slate-900 active:bg-muted/60")}>
            <MenuIcon icon={KeyRound} />
            Cambiar contraseña
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className={cn(rowClass, "text-red-600 active:bg-red-50/60")}
          >
            <MenuIcon icon={LogOut} danger />
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  );
}
