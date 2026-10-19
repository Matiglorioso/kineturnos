import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { deleteInsuranceFromDb, updateInsuranceInDb } from "@/lib/db/insurances";
import { parseInsuranceInput } from "@/lib/insurance";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const parsed = parseInsuranceInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }
    return NextResponse.json({ data: await updateInsuranceInDb(id, parsed.input) });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar la obra social.");
  }
}

/** Solo si ningún paciente ni autorización la usa; si no, hay que desactivarla. */
export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    await deleteInsuranceFromDb(id);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    return handleWriteError(error, "No se pudo eliminar la obra social.");
  }
}
