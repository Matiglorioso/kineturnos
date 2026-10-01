import { handleWriteError } from "@/lib/api/handle-write-error";
import { forbiddenResponse, requireApiPermission } from "@/lib/auth/require-session";
import { CLINICAL_ACCESS_DENIED_ERROR } from "@/lib/clinical-history";
import {
  deleteTreatmentGoalInDb,
  hasClinicalAccess,
  updateTreatmentGoalInDb,
} from "@/lib/db/clinical-history";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; goalId: string }>;
};

async function authorize(request: Request, patientId: string) {
  const access = await requireApiPermission(request, "clinical:write");
  if (access.unauthorized) return { response: access.unauthorized, user: null };
  const { user } = access.session;
  if (!(await hasClinicalAccess(user, patientId))) {
    return { response: forbiddenResponse(CLINICAL_ACCESS_DENIED_ERROR), user: null };
  }
  return { response: null, user };
}

/** Marca un objetivo como cumplido o pendiente: `{ achieved: boolean }`. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, goalId } = await context.params;
    const { response, user } = await authorize(request, id);
    if (response) return response;

    const body = (await request.json().catch(() => null)) as { achieved?: unknown } | null;
    if (typeof body?.achieved !== "boolean") {
      return NextResponse.json(
        { error: "Indicá si el objetivo está cumplido.", field: "achieved" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: await updateTreatmentGoalInDb(id, goalId, body.achieved, user),
    });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar el objetivo.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id, goalId } = await context.params;
    const { response, user } = await authorize(request, id);
    if (response) return response;

    await deleteTreatmentGoalInDb(id, goalId, user);
    return NextResponse.json({ data: { id: goalId } });
  } catch (error) {
    return handleWriteError(error, "No se pudo quitar el objetivo.");
  }
}
