import { handleWriteError } from "@/lib/api/handle-write-error";
import { parseUserWriteInput } from "@/lib/api/parse-user-body";
import { requireApiPermission } from "@/lib/auth/require-session";
import { createUserInDb, getUsersFromDb } from "@/lib/db/users";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "users:manage");
  if (access.unauthorized) return access.unauthorized;

  try {
    return NextResponse.json({ data: await getUsersFromDb() });
  } catch (error) {
    console.error("GET /api/users", error);
    return NextResponse.json(
      { error: "No se pudieron leer los usuarios. Intentá de nuevo en unos minutos." },
      { status: 503 }
    );
  }
}

/** Alta con contraseña temporal: la respuesta la incluye una sola vez. */
export async function POST(request: Request) {
  const access = await requireApiPermission(request, "users:manage");
  if (access.unauthorized) return access.unauthorized;

  try {
    const parsed = parseUserWriteInput(await request.json());
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    const result = await createUserInDb(access.session.user, parsed.input);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo crear el usuario.");
  }
}
