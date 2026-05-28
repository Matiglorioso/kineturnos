import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("agenda");

export default function AgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
