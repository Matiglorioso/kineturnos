import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("profesionales");

export default function ProfesionalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
