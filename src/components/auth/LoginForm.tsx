"use client";

import { Logo } from "@/components/brand/Logo";
import { KineMark } from "@/components/brand/KineMark";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url";
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
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
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
        const { message } = getLoginErrorMessage(
          null,
          result.error,
          result.code
        );
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
    <div className="space-y-5 sm:space-y-6 lg:space-y-5">
      <div className="text-center lg:text-left">
        {/* Celular (boceto 14): la marca, el nombre y el consultorio, centrados. */}
        <div className="mb-3 flex justify-center lg:hidden">
          <Logo size="lg" showText={false} />
        </div>
        {/* Celular: nombre y consultorio. */}
        <h1 className="text-[22px] font-bold text-slate-900 lg:hidden">{siteConfig.name}</h1>
        <p className="mt-1 text-[13px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">
          {siteConfig.clinicName}
        </p>
        {/* Computadora: el isotipo y el título (el consultorio ya está en el panel izquierdo). */}
        <div className="flex items-center gap-3 max-lg:hidden">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-800 text-white">
            <KineMark className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ingresá a {siteConfig.name}</h1>
            <p className="text-sm text-muted-foreground">Administración y profesionales del consultorio.</p>
          </div>
        </div>
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
        className="space-y-3.5 max-lg:pt-3 lg:space-y-4 lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white lg:p-5"
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
            placeholder="usuario@sanmarsalud.com"
            required
            aria-invalid={Boolean(formError)}
            className="h-12 max-lg:bg-white sm:h-10 lg:border-[#D1D5DB] lg:bg-white lg:shadow-none lg:focus-visible:border-brand-800 lg:focus-visible:ring-0 lg:focus-visible:shadow-[0_0_0_3px_rgba(36,74,34,0.15)]"
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
            className="h-12 max-lg:bg-white sm:h-10 lg:border-[#D1D5DB] lg:bg-white lg:shadow-none lg:focus-visible:border-brand-800 lg:focus-visible:ring-0 lg:focus-visible:shadow-[0_0_0_3px_rgba(36,74,34,0.15)]"
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
          className="h-12 w-full text-[15px] sm:h-10 sm:text-sm"
          disabled={loading}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      {/* La ayuda tiene el contacto de soporte. */}
      <p className="text-center text-xs text-muted-foreground lg:text-left lg:text-sm">
        ¿Olvidaste tu contraseña? Pedila a Administración ·{" "}
        <Link href="/ayuda" className="font-semibold text-brand-700 hover:underline">
          Ayuda
        </Link>
      </p>
    </div>
  );
}
