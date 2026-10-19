import { handleWriteError } from "@/lib/api/handle-write-error";
import { requireApiPermission } from "@/lib/auth/require-session";
import { getAttendanceReportFromDb } from "@/lib/db/insurances";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Planilla de asistencia mensual de una obra social: `?mes=2026-10`. */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireApiPermission(request, "insurances:write");
  if (access.unauthorized) return access.unauthorized;

  try {
    const { id } = await context.params;
    const month = new URL(request.url).searchParams.get("mes") ?? "";
    if (!MONTH_REGEX.test(month)) {
      return NextResponse.json(
        { error: "Indicá el mes con el formato aaaa-mm (por ejemplo 2026-10).", field: "mes" },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: await getAttendanceReportFromDb(id, month) });
  } catch (error) {
    return handleWriteError(error, "No se pudo armar la planilla.");
  }
}
