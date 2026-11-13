import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { createInsuranceInDb, getInsurancesFromDb } from "@/lib/db/insurances";
import { parseInsuranceInput } from "@/lib/insurance";
import { auditContextFor, auditWrite } from "@/lib/db/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Catálogo de obras sociales (RF07). */
export async function GET(request: Request) {
  const access = await requireApiPermission(request, "insurances:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    return NextResponse.json({ data: await getInsurancesFromDb() });
  } catch (error) {
    return handleWriteError(error, "No se pudieron leer las obras sociales.");
  }
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const parsed = parseInsuranceInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }
    const insurance = await createInsuranceInDb(parsed.input);
    await auditWrite(auditContextFor(access.session.user, request), "obra_social", "alta", insurance.id, null);
    return NextResponse.json({ data: insurance }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo guardar la obra social.");
  }
}
