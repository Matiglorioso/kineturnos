"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError } from "@/lib/api/fetch-json";
import { changeOwnPasswordRequest } from "@/lib/api/users-client";
import { newPasswordValidationError, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { showSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, ChevronLeft, Circle, KeyRound, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2", met ? "text-emerald-700" : "text-muted-foreground")}>
      {met ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      {children}
    </li>
  );
}

/**
 * Cambio de la propia contraseña. Con una contraseña temporal es obligatorio
 * (el middleware trae acá) y no se puede volver al sistema sin hacerlo.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const forced = session?.user?.mustChangePassword === true;

  const [values, setValues] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const longEnough = values.newPassword.length >= PASSWORD_MIN_LENGTH;
  const mixed = /[a-zA-ZñÑ]/.test(values.newPassword) && /\d/.test(values.newPassword);
  const matches = values.newPassword !== "" && values.newPassword === values.confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!values.currentPassword) {
      nextErrors.currentPassword = forced ? "Ingresá la contraseña temporal" : "Ingresá tu contraseña actual";
    }
    const policyError = newPasswordValidationError(values.newPassword);
    if (policyError) nextErrors.newPassword = policyError;
    else if (!matches) nextErrors.confirmPassword = "Las contraseñas no coinciden";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await changeOwnPasswordRequest(values.currentPassword, values.newPassword);
      showSuccessToast("Contraseña actualizada", "Ya podés usar tu nueva contraseña.");
      if (forced) {
        await update({ mustChangePassword: false });
        router.replace("/");
        router.refresh();
      } else {
        router.push("/");
      }
    } catch (error) {
      if (error instanceof ApiError && (error.field === "currentPassword" || error.field === "newPassword")) {
        setErrors({ [error.field]: error.message });
      } else {
        setFormError(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-lg:pb-24">
      {/* Celular: como los formularios (volver arriba, título a la izquierda, botón fijo abajo). */}
      {!forced && (
        <Link
          href="/mas"
          className="-ml-1 mb-1 flex h-10 w-fit items-center gap-0.5 rounded-lg px-1 text-[15px] font-semibold text-brand-800 lg:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </Link>
      )}
      <div className="text-left">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 max-lg:hidden">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="text-[22px] font-bold text-slate-900 lg:text-2xl lg:font-semibold">
          {forced ? "Elegí tu contraseña" : "Cambiar contraseña"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {forced
            ? `Hola${session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}. Ingresaste con una contraseña temporal: elegí una propia para seguir.`
            : "Ingresá tu contraseña actual y la nueva."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-white lg:p-5 lg:shadow-sm"
      >
        <FormField
          id="currentPassword"
          label={forced ? "Contraseña temporal" : "Contraseña actual"}
          error={errors.currentPassword}
        >
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(event) => set("currentPassword", event.target.value)}
            className="h-12 max-lg:bg-white sm:h-10"
          />
        </FormField>

        <FormField id="newPassword" label="Nueva contraseña" error={errors.newPassword}>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(event) => set("newPassword", event.target.value)}
            className="h-12 max-lg:bg-white sm:h-10"
          />
        </FormField>

        <FormField id="confirmPassword" label="Repetí la nueva contraseña" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => set("confirmPassword", event.target.value)}
            className="h-12 max-lg:bg-white sm:h-10"
          />
        </FormField>

        <ul aria-label="Requisitos de la contraseña" className="space-y-1 text-xs">
          <Requirement met={longEnough}>Al menos {PASSWORD_MIN_LENGTH} caracteres</Requirement>
          <Requirement met={mixed}>Letras y números</Requirement>
          <Requirement met={matches}>Las dos coinciden</Requirement>
        </ul>

        {formError && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:border-t max-lg:border-slate-200/80 max-lg:bg-background/95 max-lg:px-4 max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-lg:pt-3 max-lg:backdrop-blur">
          <Button type="submit" className="h-12 w-full text-[15px] lg:h-10 lg:text-sm" disabled={saving}>
            {saving ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </div>
      </form>

      <div className={cn("flex items-center gap-4 text-sm", !forced && "max-lg:hidden")}>
        {!forced && (
          <Link href="/" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        )}
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
