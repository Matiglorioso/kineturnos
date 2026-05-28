import { getPatientsFromDb } from "@/lib/db/patients";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const patients = await getPatientsFromDb();
    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error("GET /api/patients", error);
    return NextResponse.json(
      {
        error:
          "No se pudieron leer los pacientes. Revisá DATABASE_URL y ejecutá npm run db:push && npm run db:seed",
      },
      { status: 503 }
    );
  }
}
