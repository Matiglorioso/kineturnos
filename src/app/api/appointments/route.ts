import {
  createAppointmentInDb,
  getAppointmentsFromDb,
} from "@/lib/db/appointments";
import {
  parseAppointmentWriteInput,
} from "@/lib/api/parse-appointment-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  getOwnProfessionalId,
  requireApiPermission,
} from "@/lib/auth/require-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "appointments:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (access.session.user.role === "profesional" && !ownProfessionalId) {
      return NextResponse.json({ data: [] });
    }

    const appointments = await getAppointmentsFromDb(
      ownProfessionalId ? { professionalId: ownProfessionalId } : undefined
    );
    return NextResponse.json({ data: appointments });
  } catch (error) {
    console.error("GET /api/appointments", error);
    return NextResponse.json(
      {
        error:
          "No se pudieron leer los turnos. Revisá DATABASE_URL y ejecutá npm run db:push && npm run db:seed",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "appointments:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const body = await request.json();
    const parsed = parseAppointmentWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (
      ownProfessionalId &&
      parsed.input.professionalId !== ownProfessionalId
    ) {
      return forbiddenResponse(
        "Solo podés agendar turnos para tu propia agenda."
      );
    }

    const appointment = await createAppointmentInDb(parsed.input);
    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo agendar el turno.");
  }
}
