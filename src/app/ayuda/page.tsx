import { PublicHelpPage } from "@/components/auth/PublicHelpPage";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("ayuda");

export default function AyudaPage() {
  return <PublicHelpPage />;
}
