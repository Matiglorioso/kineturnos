import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("mas");

export default function MasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
