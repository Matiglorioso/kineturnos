import {
  parseAppointmentStatusInput,
  parseAppointmentWriteInput,
} from "@/lib/api/parse-appointment-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  getOwnProfessionalId,
  requireApiPermission,
  requireApiSession,
} from "@/lib/auth/require-session";
import { hasPermission } from "@/lib/auth/permissions";
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

function assertOwnAppointment(
  professionalId: string | null,
  appointmentProfessionalId: string
) {
  if (professionalId && appointmentProfessionalId !== professionalId) {
    return forbiddenResponse("No tenés acceso a este turno.");
  }
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "appointments:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const appointment = await getAppointmentByIdFromDb(id);

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado." }, { status: 404 });
    }

    const owned = assertOwnAppointment(
      getOwnProfessionalId(access.session.user),
      appointment.professionalId
    );
    if (owned) return owned;

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id]", error);
    return NextResponse.json({ error: "No se pudo leer el turno." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const sessionResult = await requireApiSession(request);
  if (sessionResult.unauthorized) return sessionResult.unauthorized;

  const { user } = sessionResult.session;

  try {
    const { id } = await context.params;
    const existing = await getAppointmentByIdFromDb(id);

    if (!existing) {
      return NextResponse.json({ error: "Turno no encontrado." }, { status: 404 });
    }

    const owned = assertOwnAppointment(
      getOwnProfessionalId(user),
      existing.professionalId
    );
    if (owned) return owned;

    const body = await request.json();

    if (
      body &&
      typeof body === "object" &&
      "status" in body &&
      Object.keys(body as object).length === 1
    ) {
      if (!hasPermission(user.role, "appointments:status")) {
        return forbiddenResponse();
      }

      const parsedStatus = parseAppointmentStatusInput(body);
      if (!parsedStatus.status) {
        return NextResponse.json({ error: parsedStatus.error }, { status: 400 });
      }

      const appointment = await updateAppointmentStatusInDb(id, parsedStatus.status);
      return NextResponse.json({ data: appointment });
    }

    if (!hasPermission(user.role, "appointments:write")) {
      return forbiddenResponse();
    }

    const parsed = parseAppointmentWriteInput(body);
    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const ownProfessionalId = getOwnProfessionalId(user);
    if (
      ownProfessionalId &&
      parsed.input.professionalId !== ownProfessionalId
    ) {
      return forbiddenResponse(
        "Solo podés editar turnos de tu propia agenda."
      );
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
