import { handleWriteError } from "@/lib/api/handle-write-error";
import { parseUserWriteInput } from "@/lib/api/parse-user-body";
import { requireApiPermission } from "@/lib/auth/require-session";
import { updateUserInDb } from "@/lib/db/users";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Edición de datos, perfil, vínculo y estado (activo/desactivado). Los usuarios no se borran. */
export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "users:manage");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const parsed = parseUserWriteInput(await request.json());
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    const user = await updateUserInDb(access.session.user, id, parsed.input);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar el usuario.");
  }
}
