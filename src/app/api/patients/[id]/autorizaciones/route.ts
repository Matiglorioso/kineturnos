import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  getOwnProfessionalId,
  requireApiPermission,
} from "@/lib/auth/require-session";
import {
  createAuthorizationInDb,
  getPatientAuthorizationsFromDb,
} from "@/lib/db/insurances";
import { patientBelongsToProfessionalInDb } from "@/lib/db/patients";
import { parseAuthorizationInput } from "@/lib/insurance";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Autorizaciones del paciente y estado de su cobertura (RF15). */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (
      access.session.user.role === "profesional" &&
      (!ownProfessionalId || !(await patientBelongsToProfessionalInDb(id, ownProfessionalId)))
    ) {
      return forbiddenResponse("Solo podés ver la cobertura de tus pacientes.");
    }
    return NextResponse.json({ data: await getPatientAuthorizationsFromDb(id) });
  } catch (error) {
    return handleWriteError(error, "No se pudieron leer las autorizaciones.");
  }
}

/** Registra una autorización de la obra social actual del paciente (RF14). */
export async function POST(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const parsed = parseAuthorizationInput(await request.json().catch(() => null));
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
    }
    const authorization = await createAuthorizationInDb(id, parsed.input, access.session.user);
    return NextResponse.json({ data: authorization }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo guardar la autorización.");
  }
}
