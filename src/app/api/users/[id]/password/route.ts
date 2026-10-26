import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { resetUserPasswordInDb } from "@/lib/db/users";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Restablece la contraseña: genera una temporal que se muestra una sola vez. */
export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "users:manage");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const result = await resetUserPasswordInDb(access.session.user, id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleWriteError(error, "No se pudo restablecer la contraseña.");
  }
}
