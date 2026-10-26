"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWithTemporaryPassword } from "@/lib/api/users-client";
import { Check, Copy, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

interface TemporaryPasswordDialogProps {
  /** Resultado del alta o del restablecimiento; null = cerrado. */
  result: (UserWithTemporaryPassword & { reason: "alta" | "restablecida" }) | null;
  onClose: () => void;
}

/** Muestra la contraseña temporal una sola vez: después no se puede volver a ver. */
export function TemporaryPasswordDialog({ result, onClose }: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [result]);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <KeyRound className="h-4 w-4" />
            </span>
            {result?.reason === "alta" ? "Usuario creado" : "Contraseña restablecida"}
          </DialogTitle>
          <DialogDescription>
            Pasale estos datos a {result?.user.name}. La contraseña es temporal: al ingresar va a tener que
            elegir una propia.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <dl className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="mt-0.5 break-all text-sm font-medium text-slate-900">{result.user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contraseña temporal
              </dt>
              <dd className="mt-1 flex items-center gap-2">
                <code
                  aria-label="Contraseña temporal"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-base font-semibold tracking-wide text-slate-900"
                >
                  {result.temporaryPassword}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={() => void copy()} aria-label="Copiar contraseña">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </dd>
            </div>
          </dl>
        )}

        <p className="text-xs text-muted-foreground">
          Por seguridad no se vuelve a mostrar. Si se pierde, restablecé la contraseña otra vez.
        </p>

        <DialogFooter>
          <Button type="button" className="w-full sm:w-auto" onClick={onClose}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
