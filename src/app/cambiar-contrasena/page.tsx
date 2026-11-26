import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("cambiarContrasena");

export default function CambiarContrasenaPage() {
  return (
    // Celular: "Volver" arriba de todo, como en los formularios.
    <AuthPageShell className="max-lg:pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <ChangePasswordForm />
    </AuthPageShell>
  );
}
