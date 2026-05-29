import {
  createAppointmentInDb,
  getAppointmentsFromDb,
} from "@/lib/db/appointments";
import {
  parseAppointmentWriteInput,
} from "@/lib/api/parse-appointment-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const appointments = await getAppointmentsFromDb();
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
  try {
    const body = await request.json();
    const parsed = parseAppointmentWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const appointment = await createAppointmentInDb(parsed.input);
    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo agendar el turno.");
  }
}
