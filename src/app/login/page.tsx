"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site-config";
import { showErrorToast } from "@/lib/toast";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      showErrorToast("No se pudo ingresar", "Email o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {siteConfig.clinicName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Ingresá a {siteConfig.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso para recepción, profesionales y administración.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <FormField id="email" label="Email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@consultorio.com"
              required
            />
          </FormField>

          <FormField id="password" label="Contraseña">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </FormField>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Si no tenés usuario o olvidaste tu contraseña, contactá al administrador
          del sistema.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-subtle" />}>
      <LoginForm />
    </Suspense>
  );
}
