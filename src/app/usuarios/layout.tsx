import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("usuarios");

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
