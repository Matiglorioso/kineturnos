import { LoginForm } from "@/components/auth/LoginForm";
import { LoginShell } from "@/components/auth/LoginShell";
import { Logo } from "@/components/brand/Logo";
import { createPageMetadata } from "@/lib/site-config";
import { Suspense } from "react";

export const metadata = createPageMetadata("login");

function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <Logo size="lg" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        Cargando acceso…
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginShell>
        <LoginForm />
      </LoginShell>
    </Suspense>
  );
}
