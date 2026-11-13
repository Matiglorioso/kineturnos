import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("auditoria");

export default function AuditoriaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
