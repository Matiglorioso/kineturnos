import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  requireApiPermission,
} from "@/lib/auth/require-session";
import {
  CLINICAL_ACCESS_DENIED_ERROR,
  parseClinicalEntryInput,
} from "@/lib/clinical-history";
import {
  createClinicalEntryInDb,
  getClinicalHistoryFromDb,
  hasClinicalAccess,
  logClinicalAccess,
} from "@/lib/db/clinical-history";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Historia clínica del paciente (RF12). Cada lectura queda registrada (RNF07). */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "clinical:read");
  if (access.unauthorized) return access.unauthorized;
  const { user } = access.session;

  try {
    const { id } = await context.params;
    if (!(await hasClinicalAccess(user, id))) {
      return forbiddenResponse(CLINICAL_ACCESS_DENIED_ERROR);
    }

    const history = await getClinicalHistoryFromDb(id, user);

    await logClinicalAccess(prisma, { patientId: id, user, action: "lectura" });
    return NextResponse.json({ data: history });
  } catch (error) {
    return handleWriteError(error, "No se pudo leer la historia clínica.");
  }
}

/** Registra una sesión: evolución y, si corresponde, diagnóstico y plan (RF11). */
export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "clinical:write");
  if (access.unauthorized) return access.unauthorized;
  const { user } = access.session;

  try {
    const { id } = await context.params;
    if (!(await hasClinicalAccess(user, id))) {
      return forbiddenResponse(CLINICAL_ACCESS_DENIED_ERROR);
    }

    const parsed = parseClinicalEntryInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }

    const entry = await createClinicalEntryInDb(id, parsed.input, user);
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo guardar el registro de la historia clínica.");
  }
}
