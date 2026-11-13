import {
  AUDIT_MAX_ROWS,
  diffAuditSnapshots,
  formatAuditValue,
  resolveAuditAction,
  shouldRecordAudit,
  type AuditAction,
  type AuditChange,
  type AuditEntity,
  type AuditSnapshot,
} from "@/lib/audit";
import { getClientIp } from "@/lib/auth/login-rate-limit";
import type { ApiSessionUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/prisma";
import type { AuditLogItem } from "@/types";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

/** Quién hizo el cambio y desde dónde. */
export interface AuditContext {
  userId: string | null;
  userName: string;
  userRole: string;
  ip: string | null;
  userAgent: string | null;
}

type HeaderSource = Pick<Headers, "get">;

function fromHeaders(headers: HeaderSource) {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
  const userAgent = headers.get("user-agent")?.slice(0, 300) || null;
  return { ip, userAgent };
}

export function auditContextFor(user: ApiSessionUser, request: Request): AuditContext {
  return {
    userId: user.id,
    userName: user.name || user.email || user.id,
    userRole: user.role,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
  };
}

/** Cambios que hace el paciente desde los botones del correo (sin iniciar sesión). */
export function patientAuditContext(patientName: string, headers: HeaderSource): AuditContext {
  return { userId: null, userName: patientName, userRole: "paciente", ...fromHeaders(headers) };
}

export function loginAuditContext(
  user: { id: string; name: string; role: string } | null,
  email: string,
  request?: Request
): AuditContext {
  return {
    userId: user?.id ?? null,
    userName: user?.name ?? email,
    userRole: user?.role ?? "desconocido",
    ...(request ? fromHeaders(request.headers) : { ip: null, userAgent: null }),
  };
}

interface Snapshot {
  fields: AuditSnapshot;
  label: string;
}

const date = (value: Date | null) => formatAuditValue(value, "date") ?? "";
const time = (value: Date | null) => formatAuditValue(value, "time") ?? "";

/** Foto del registro tal como está en la base, para comparar antes y después. */
export async function readAuditSnapshot(entity: AuditEntity, id: string): Promise<Snapshot | null> {
  switch (entity) {
    case "turno": {
      const row = await prisma.turno.findUnique({ where: { id } });
      return row && { fields: row, label: `${row.pacienteNombre} · ${date(row.fecha)} ${time(row.hora)}` };
    }
    case "paciente": {
      const row = await prisma.paciente.findUnique({ where: { id } });
      return row && { fields: row, label: row.nombre };
    }
    case "profesional": {
      const row = await prisma.profesional.findUnique({ where: { id } });
      return row && { fields: row, label: row.nombre };
    }
    case "obra_social": {
      const row = await prisma.obraSocial.findUnique({ where: { id } });
      return row && { fields: row, label: row.nombre };
    }
    case "autorizacion": {
      const row = await prisma.autorizacion.findUnique({
        where: { id },
        include: { paciente: { select: { nombre: true } }, obraSocial: { select: { nombre: true } } },
      });
      return (
        row && {
          fields: { ...row, obraSocialNombre: row.obraSocial.nombre },
          label: `${row.paciente.nombre} · ${row.obraSocial.nombre}`,
        }
      );
    }
    case "historia_clinica": {
      const row = await prisma.historiaClinica.findUnique({
        where: { id },
        include: { paciente: { select: { nombre: true } } },
      });
      return row && { fields: row, label: `${row.paciente.nombre} · sesión del ${date(row.fecha)}` };
    }
    case "ficha_clinica": {
      const row = await prisma.fichaClinica.findUnique({
        where: { pacienteId: id },
        include: { paciente: { select: { nombre: true } } },
      });
      return row && { fields: row, label: row.paciente.nombre };
    }
    case "objetivo": {
      const row = await prisma.objetivoTratamiento.findUnique({
        where: { id },
        include: { paciente: { select: { nombre: true } } },
      });
      return row && { fields: row, label: `${row.paciente.nombre} · ${row.descripcion}` };
    }
    case "usuario": {
      const row = await prisma.usuario.findUnique({
        where: { id },
        select: {
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          profesional: { select: { nombre: true } },
        },
      });
      return (
        row && {
          fields: { ...row, profesionalNombre: row.profesional?.nombre ?? null },
          label: `${row.nombre} (${row.email})`,
        }
      );
    }
    case "sesion":
      return null;
  }
}

interface AuditEvent {
  entity: AuditEntity;
  entityId: string | null;
  action: AuditAction;
  label: string;
  changes?: AuditChange[];
}

/**
 * Guarda un evento. Nunca hace fallar la operación auditada (ya está hecha):
 * si no se puede escribir, queda en el log del servidor.
 */
export async function recordAuditEvent(context: AuditContext, event: AuditEvent): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        id: randomUUID(),
        usuarioId: context.userId,
        usuarioNombre: context.userName,
        usuarioRol: context.userRole,
        accion: event.action,
        entidad: event.entity,
        entidadId: event.entityId,
        registro: event.label,
        cambios: event.changes?.length ? (event.changes as unknown as Prisma.InputJsonValue) : undefined,
        ip: context.ip,
        navegador: context.userAgent,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la auditoría", event.entity, event.entityId, error);
  }
}

/**
 * Registra un alta, una modificación o una baja comparando la foto previa
 * (`before`, leída con readAuditSnapshot antes de escribir) con la actual.
 */
export async function auditWrite(
  context: AuditContext,
  entity: AuditEntity,
  requested: "alta" | "modificacion" | "baja",
  id: string,
  before: Snapshot | null
): Promise<void> {
  try {
    const after = requested === "baja" ? null : await readAuditSnapshot(entity, id);
    const changes = diffAuditSnapshots(entity, before?.fields ?? null, after?.fields ?? null);
    const action = resolveAuditAction(requested, changes);
    if (!shouldRecordAudit(action, changes)) return;

    await recordAuditEvent(context, {
      entity,
      entityId: id,
      action,
      label: after?.label ?? before?.label ?? id,
      changes,
    });
  } catch (error) {
    console.error("No se pudo registrar la auditoría", entity, id, error);
  }
}

/** Eventos desde `since`, del más reciente al más viejo, con el tope AUDIT_MAX_ROWS. */
export async function getAuditLogFromDb(
  since: Date
): Promise<{ items: AuditLogItem[]; truncated: boolean }> {
  const rows = await prisma.auditoria.findMany({
    where: { fecha: { gte: since } },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    take: AUDIT_MAX_ROWS + 1,
  });

  return {
    truncated: rows.length > AUDIT_MAX_ROWS,
    items: rows.slice(0, AUDIT_MAX_ROWS).map((row) => ({
      id: row.id,
      at: row.fecha.toISOString(),
      userId: row.usuarioId,
      userName: row.usuarioNombre,
      userRole: row.usuarioRol,
      action: row.accion,
      entity: row.entidad as AuditEntity,
      entityId: row.entidadId,
      label: row.registro,
      changes: Array.isArray(row.cambios) ? (row.cambios as unknown as AuditChange[]) : [],
      ip: row.ip,
      userAgent: row.navegador,
    })),
  };
}
