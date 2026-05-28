import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("pacientes");

export default function PacientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
