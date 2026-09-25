import {
  createPatientInDb,
  getPatientsFromDb,
} from "@/lib/db/patients";
import { parsePatientWriteInput } from "@/lib/api/parse-patient-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  getOwnProfessionalId,
  requireApiPermission,
} from "@/lib/auth/require-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireApiPermission(request, "patients:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (access.session.user.role === "profesional" && !ownProfessionalId) {
      return NextResponse.json({ data: [] });
    }

    const patients = await getPatientsFromDb(
      ownProfessionalId ? { professionalId: ownProfessionalId } : undefined
    );
    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error("GET /api/patients", error);
    return NextResponse.json(
      { error: "No se pudieron leer los pacientes. Intentá de nuevo en unos minutos." },
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
      return NextResponse.json(
        { error: parsed.error, field: parsed.field },
        { status: 400 }
      );
    }

    const patient = await createPatientInDb(parsed.input);
    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    return handleWriteError(error, "No se pudo registrar el paciente.");
  }
}
