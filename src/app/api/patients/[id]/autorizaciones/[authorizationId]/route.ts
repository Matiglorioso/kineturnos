import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { deleteAuthorizationFromDb, updateAuthorizationInDb } from "@/lib/db/insurances";
import { parseAuthorizationInput } from "@/lib/insurance";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; authorizationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id, authorizationId } = await context.params;
    const parsed = parseAuthorizationInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }
    return NextResponse.json({
      data: await updateAuthorizationInDb(id, authorizationId, parsed.input),
    });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar la autorización.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id, authorizationId } = await context.params;
    await deleteAuthorizationFromDb(id, authorizationId);
    return NextResponse.json({ data: { id: authorizationId } });
  } catch (error) {
    return handleWriteError(error, "No se pudo eliminar la autorización.");
  }
}
