import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("obrasSociales");

export default function ObrasSocialesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
