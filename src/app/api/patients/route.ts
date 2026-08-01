import {
  createPatientInDb,
  getPatientsFromDb,
} from "@/lib/db/patients";
import { parsePatientWriteInput } from "@/lib/api/parse-patient-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "patients:read");
  if (access.unauthorized) return access.unauthorized;

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

export async function POST(request: Request) {
  const access = await requireApiPermission(request, "patients:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const body = await request.json();
    const parsed = parsePatientWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const patient = await createPatientInDb(parsed.input);
    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo registrar el paciente.");
  }
}
