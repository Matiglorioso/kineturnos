"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { showErrorToast } from "@/lib/toast";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

const DEMO_USERS = [
  { role: "Recepción", email: "recepcion@kineturnos.local", password: "demo1234" },
  { role: "Admin", email: "admin@kineturnos.local", password: "demo1234" },
  { role: "Profesional", email: "profe@kineturnos.local", password: "demo1234" },
];

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

  function fillDemo(user: (typeof DEMO_USERS)[number]) {
    setEmail(user.email);
    setPassword(user.password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/proyecto" size="lg" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ingresá al consultorio
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
              placeholder="recepcion@kineturnos.local"
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

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Usuarios demo
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => fillDemo(user)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="font-medium text-slate-800">{user.role}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Contraseña para todos: <span className="font-mono">demo1234</span>
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/proyecto" className="text-brand-600 hover:underline">
            Ver acerca del proyecto
          </Link>
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
