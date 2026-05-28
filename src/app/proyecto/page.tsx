import { ProjectAboutPage } from "@/components/proyecto/ProjectAboutPage";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata("proyecto");

export default function ProyectoPage() {
  return <ProjectAboutPage />;
}
