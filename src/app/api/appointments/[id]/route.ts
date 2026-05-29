import {
  parseAppointmentStatusInput,
  parseAppointmentWriteInput,
} from "@/lib/api/parse-appointment-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  getAppointmentByIdFromDb,
  updateAppointmentInDb,
  updateAppointmentStatusInDb,
} from "@/lib/db/appointments";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const appointment = await getAppointmentByIdFromDb(id);

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id]", error);
    return NextResponse.json({ error: "No se pudo leer el turno." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getAppointmentByIdFromDb(id);

    if (!existing) {
      return NextResponse.json({ error: "Turno no encontrado." }, { status: 404 });
    }

    const body = await request.json();

    if (
      body &&
      typeof body === "object" &&
      "status" in body &&
      Object.keys(body as object).length === 1
    ) {
      const parsedStatus = parseAppointmentStatusInput(body);
      if (!parsedStatus.status) {
        return NextResponse.json({ error: parsedStatus.error }, { status: 400 });
      }

      const appointment = await updateAppointmentStatusInDb(id, parsedStatus.status);
      return NextResponse.json({ data: appointment });
    }

    const parsed = parseAppointmentWriteInput(body);
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const appointment = await updateAppointmentInDb(id, {
      ...parsed.input,
      notes: parsed.input.notes ?? existing.notes,
    });

    return NextResponse.json({ data: appointment });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar el turno.");
  }
}
