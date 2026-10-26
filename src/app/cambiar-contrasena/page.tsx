import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("cambiarContrasena");

export default function CambiarContrasenaPage() {
  return (
    <AuthPageShell>
      <ChangePasswordForm />
    </AuthPageShell>
  );
}
