import { LoginForm } from "@/components/auth/LoginForm";
import { LoginShell } from "@/components/auth/LoginShell";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { createPageMetadata } from "@/lib/site-config";
import { Suspense } from "react";

export const metadata = createPageMetadata("login");

function LoginLoading() {
  return (
    <AuthPageShell>
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          Cargando acceso…
        </div>
      </div>
    </AuthPageShell>
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
