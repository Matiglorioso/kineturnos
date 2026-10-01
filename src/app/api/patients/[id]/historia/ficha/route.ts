import { handleWriteError } from "@/lib/api/handle-write-error";
import { forbiddenResponse, requireApiPermission } from "@/lib/auth/require-session";
import {
  CLINICAL_ACCESS_DENIED_ERROR,
  parseClinicalProfileInput,
} from "@/lib/clinical-history";
import { hasClinicalAccess, saveClinicalProfileInDb } from "@/lib/db/clinical-history";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Alertas clínicas y antecedentes del paciente. */
export async function PUT(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "clinical:write");
  if (access.unauthorized) return access.unauthorized;
  const { user } = access.session;

  try {
    const { id } = await context.params;
    if (!(await hasClinicalAccess(user, id))) {
      return forbiddenResponse(CLINICAL_ACCESS_DENIED_ERROR);
    }

    const parsed = parseClinicalProfileInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    return NextResponse.json({ data: await saveClinicalProfileInDb(id, parsed.input, user) });
  } catch (error) {
    return handleWriteError(error, "No se pudieron guardar las alertas y antecedentes.");
  }
}
