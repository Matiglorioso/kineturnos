import { handleWriteError } from "@/lib/api/handle-write-error";
import { forbiddenResponse, requireApiPermission } from "@/lib/auth/require-session";
import {
  CLINICAL_ACCESS_DENIED_ERROR,
  parseTreatmentGoalInput,
} from "@/lib/clinical-history";
import { createTreatmentGoalInDb, hasClinicalAccess } from "@/lib/db/clinical-history";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Agrega un objetivo al plan de tratamiento. */
export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "clinical:write");
  if (access.unauthorized) return access.unauthorized;
  const { user } = access.session;

  try {
    const { id } = await context.params;
    if (!(await hasClinicalAccess(user, id))) {
      return forbiddenResponse(CLINICAL_ACCESS_DENIED_ERROR);
    }

    const parsed = parseTreatmentGoalInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    const goal = await createTreatmentGoalInDb(id, parsed.input.description, user);
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo agregar el objetivo.");
  }
}
