import { handleWriteError } from "@/lib/api/handle-write-error";
import { parsePasswordChangeBody } from "@/lib/api/parse-user-body";
import { requireApiSession } from "@/lib/auth/require-session";
import { changeOwnPasswordInDb } from "@/lib/db/users";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Cambio de la propia contraseña; es lo único permitido con una contraseña temporal pendiente. */
export async function POST(request: Request) {
  const access = await requireApiSession(request, { allowPendingPasswordChange: true });
  if (access.unauthorized) return access.unauthorized;

  try {
    const parsed = parsePasswordChangeBody(await request.json());
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    await changeOwnPasswordInDb(access.session.user.id, parsed.input.currentPassword, parsed.input.newPassword);
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return handleWriteError(error, "No se pudo cambiar la contraseña.");
  }
}
