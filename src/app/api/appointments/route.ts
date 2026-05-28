import { getAppointmentsFromDb } from "@/lib/db/appointments";
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
