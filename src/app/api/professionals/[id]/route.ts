import { parseProfessionalWriteInput } from "@/lib/api/parse-professional-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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

export async function DELETE(_request: Request, context: RouteContext) {
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
