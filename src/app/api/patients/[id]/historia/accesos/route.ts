import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { getClinicalAccessLogFromDb } from "@/lib/db/clinical-history";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Trazabilidad (RNF07): quién y cuándo leyó o modificó la historia. Solo Administración. */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "clinical:audit");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    return NextResponse.json({ data: await getClinicalAccessLogFromDb(id) });
  } catch (error) {
    return handleWriteError(error, "No se pudo leer el registro de accesos.");
  }
}
