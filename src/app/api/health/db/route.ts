import { checkDatabaseConnection } from "@/lib/db-health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const connected = await checkDatabaseConnection();

  if (!connected) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo conectar a la base de datos. Revisá DATABASE_URL en .env",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Conexión a PostgreSQL (Neon) exitosa",
  });
}
