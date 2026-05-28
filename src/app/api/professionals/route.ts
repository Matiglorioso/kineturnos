import { getProfessionalsFromDb } from "@/lib/db/professionals";
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
