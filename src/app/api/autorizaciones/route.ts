import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { getAllAuthorizationsFromDb } from "@/lib/db/insurances";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Listado de todas las autorizaciones, para gestionarlas desde Obras sociales (RF15). */
export async function GET(request: Request) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    return NextResponse.json({ data: await getAllAuthorizationsFromDb() });
  } catch (error) {
    return handleWriteError(error, "No se pudieron leer las autorizaciones.");
  }
}
