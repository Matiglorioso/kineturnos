import { parsePatientWriteInput } from "@/lib/api/parse-patient-body";
import { handleWriteError } from "@/lib/api/handle-write-error";
import {
  forbiddenResponse,
  getOwnProfessionalId,
  requireApiPermission,
} from "@/lib/auth/require-session";
import {
  countPatientAppointmentsInDb,
  deletePatientFromDb,
  getPatientByIdFromDb,
  patientBelongsToProfessionalInDb,
  updatePatientInDb,
} from "@/lib/db/patients";
import { auditContextFor, auditWrite, readAuditSnapshot } from "@/lib/db/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "patients:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const patient = await getPatientByIdFromDb(id);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    const ownProfessionalId = getOwnProfessionalId(access.session.user);
    if (
      access.session.user.role === "profesional" &&
      (!ownProfessionalId ||
        !(await patientBelongsToProfessionalInDb(id, ownProfessionalId)))
    ) {
      return forbiddenResponse("No tenés acceso a este paciente.");
    }

    return NextResponse.json({ data: patient });
  } catch (error) {
    console.error("GET /api/patients/[id]", error);
    return NextResponse.json(
      { error: "No se pudo leer el paciente." },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "patients:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const existing = await getPatientByIdFromDb(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = parsePatientWriteInput(body);

    if (!parsed.input) {
      return NextResponse.json(
        { error: parsed.error, field: parsed.field },
        { status: 400 }
      );
    }

    const before = await readAuditSnapshot("paciente", id);
    const patient = await updatePatientInDb(id, {
      ...parsed.input,
      lastAppointment: parsed.input.lastAppointment ?? existing.lastAppointment,
      createdAt: parsed.input.createdAt ?? existing.createdAt,
    });
    await auditWrite(auditContextFor(access.session.user, request), "paciente", "modificacion", id, before);

    return NextResponse.json({ data: patient });
  } catch (error) {
    return handleWriteError(error, "No se pudo actualizar el paciente.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "patients:delete");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const existing = await getPatientByIdFromDb(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    const deletedAppointments = await countPatientAppointmentsInDb(id);
    const before = await readAuditSnapshot("paciente", id);
    await deletePatientFromDb(id);
    await auditWrite(auditContextFor(access.session.user, request), "paciente", "baja", id, before);

    return NextResponse.json({
      data: {
        id,
        deletedAppointments,
      },
    });
  } catch (error) {
    return handleWriteError(error, "No se pudo eliminar el paciente.");
  }
}
