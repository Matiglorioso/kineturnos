"use client";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { getSupportMailto } from "@/data/public-help";
import { getLoginErrorMessage } from "@/lib/login-errors";
import { siteConfig } from "@/lib/site-config";
import { showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

function getAuthNotice(
  reason: string | null,
  callbackUrl: string | null
): string | null {
  if (reason === "auth_required" && callbackUrl) {
    return "Tu sesión expiró o necesitás ingresar para continuar.";
  }

  if (reason === "auth_required") {
    return "Ingresá con tu usuario para acceder al sistema.";
  }

  return null;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const reason = searchParams.get("reason");
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const authNotice = useMemo(
    () => getAuthNotice(reason, searchParams.get("callbackUrl")),
    [reason, searchParams]
  );

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const { message } = getLoginErrorMessage(null, result.error);
        setFormError(message);
        showErrorToast("No se pudo ingresar", message);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      const { message } = getLoginErrorMessage(error);
      setFormError(message);
      showErrorToast("No se pudo ingresar", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center lg:text-left">
        <div className="mb-5 flex justify-center lg:hidden">
          <Logo size="lg" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {siteConfig.clinicName}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-[1.75rem]">
          Ingresá a {siteConfig.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Acceso para recepción, profesionales y administración.
        </p>
      </div>

      {authNotice && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm text-amber-950 sm:px-4"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">{authNotice}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6"
        noValidate
      >
        <FormField id="email" label="Email">
          <Input
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="nombre@consultorio.com"
            required
            aria-invalid={Boolean(formError)}
            className="h-11 sm:h-10"
          />
        </FormField>

        <FormField id="password" label="Contraseña">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (formError) setFormError(null);
            }}
            required
            aria-invalid={Boolean(formError)}
            className="h-11 sm:h-10"
          />
        </FormField>

        {formError && (
          <p
            role="alert"
            className={cn(
              "rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm leading-relaxed text-destructive"
            )}
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full sm:h-10"
          disabled={loading}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <div className="space-y-3 text-center text-sm text-muted-foreground lg:text-left">
        <p className="leading-relaxed">
          ¿Olvidaste tu contraseña?{" "}
          <a
            href={getSupportMailto()}
            className="font-medium text-brand-600 hover:underline"
          >
            Contactá soporte
          </a>
        </p>
        <p className="text-xs leading-relaxed sm:text-sm">
          Soporte:{" "}
          <a
            href={getSupportMailto()}
            className="break-all font-medium text-brand-600 hover:underline sm:break-normal"
          >
            {siteConfig.supportEmail}
          </a>
        </p>
        <p>
          <Link href="/ayuda" className="font-medium text-brand-600 hover:underline">
            Ver ayuda antes de ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
