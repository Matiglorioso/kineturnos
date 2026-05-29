import {
  createProfessionalInDb,
  getProfessionalsFromDb,
} from "@/lib/db/professionals";
import { parseProfessionalWriteInput } from "@/lib/api/parse-professional-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const professionals = await getProfessionalsFromDb();
    return NextResponse.json({ data: professionals });
  } catch (error) {
    console.error("GET /api/professionals", error);
    return NextResponse.json(
      {
        error:
          "No se pudieron leer los profesionales. Revisá DATABASE_URL y ejecutá npm run db:push && npm run db:seed",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseProfessionalWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const professional = await createProfessionalInDb(parsed.input);
    return NextResponse.json({ data: professional }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo registrar el profesional.");
  }
}
