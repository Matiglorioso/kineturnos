import { parseProfessionalWriteInput } from "@/lib/api/parse-professional-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  getOwnProfessionalId,
  requireApiPermission,
} from "@/lib/auth/require-session";
import {
  countProfessionalAppointmentsInDb,
  deleteProfessionalFromDb,
  getProfessionalByIdFromDb,
  updateProfessionalInDb,
} from "@/lib/db/professionals";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "professionals:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (ownProfessionalId && id !== ownProfessionalId) {
      return forbiddenResponse("No tenés acceso a este profesional.");
    }

    const professional = await getProfessionalByIdFromDb(id);

    if (!professional) {
      return NextResponse.json(
        { error: "Profesional no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: professional });
  } catch (error) {
    console.error("GET /api/professionals/[id]", error);
    return NextResponse.json(
      { error: "No se pudo leer el profesional." },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "professionals:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const existing = await getProfessionalByIdFromDb(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Profesional no encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = parseProfessionalWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const professional = await updateProfessionalInDb(id, {
      ...parsed.input,
      avatarColor: parsed.input.avatarColor || existing.avatarColor,
    });

    return NextResponse.json({ data: professional });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar el profesional.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "professionals:delete");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const existing = await getProfessionalByIdFromDb(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Profesional no encontrado." },
        { status: 404 }
      );
    }

    const deletedAppointments = await countProfessionalAppointmentsInDb(id);
    await deleteProfessionalFromDb(id);

    return NextResponse.json({
      data: {
        id,
        deletedAppointments,
      },
    });
  } catch (error) {
    return handleWriteError(error, "No se pudo eliminar el profesional.");
  }
}
