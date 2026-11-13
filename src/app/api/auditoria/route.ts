import { handleWriteError } from "@/lib/api/handle-write-error";
import { auditPeriodStart, parseAuditPeriodDays } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth/require-session";
import { getAuditLogFromDb } from "@/lib/db/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Registro de auditoría del período (?dias=1|7|30|90|365). Por ahora, solo Superadmin. */
export async function GET(request: Request) {
  const access = await requireApiPermission(request, "audit:read");
  if (access.unauthorized) return access.unauthorized;

  try {
    const days = parseAuditPeriodDays(new URL(request.url).searchParams.get("dias"));
    return NextResponse.json({ data: await getAuditLogFromDb(auditPeriodStart(days)) });
  } catch (error) {
    return handleWriteError(error, "No se pudo leer la auditoría.");
  }
}
