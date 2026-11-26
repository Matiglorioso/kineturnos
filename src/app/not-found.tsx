import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Página no encontrada" };

/** 404 en español (la de Next.js viene en inglés). */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">Error 404</p>
      <h1 className="text-2xl font-semibold text-slate-900">No encontramos esta página</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <Button asChild>
        <Link href="/">Ir al panel</Link>
      </Button>
    </div>
  );
}
