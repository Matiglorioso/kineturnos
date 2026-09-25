/**
 * Helpers de tests de integración (DB + API).
 * Requieren Postgres migrado y sembrado (`db:seed`) y el dev server corriendo
 * (`VERIFY_BASE_URL`, `VERIFY_SECRET`). En CI los provee el job "Verify DB + API".
 */
import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";
import { hashPassword } from "../../src/lib/auth/password";
import { appDateToDb, appTimeToDb } from "../../src/lib/db/date-codec";
import {
  getTodayAppDate,
  parseAppDate,
  toAppDate,
} from "../../src/lib/date-utils";
import type { RolUsuario } from "@prisma/client";

export const BASE_URL = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
export const SEED_PASSWORD =
  process.env.SEED_INITIAL_PASSWORD?.trim() || "demo1234";

export const prisma = new PrismaClient();

/** Todo lo que crean los tests lleva este prefijo en el id, para limpiarlo sin tocar el seed. */
export const TEST_PREFIX = "it-";

let counter = 0;
export function testId(kind: string): string {
  counter += 1;
  return `${TEST_PREFIX}${kind}-${Date.now().toString(36)}-${counter}`;
}

/** Número único de n dígitos (DNI, matrícula) para no chocar con otros tests. */
export function uniqueDigits(length = 8): string {
  const base = `${Date.now()}${counter}${Math.floor(Math.random() * 1000)}`;
  counter += 1;
  return base.slice(-length).padStart(length, "1");
}

// ---------------------------------------------------------------- API client

export type Auth =
  | { kind: "bypass" }
  | { kind: "anon" }
  | { kind: "session"; cookie: string };

export const BYPASS: Auth = { kind: "bypass" };
export const ANON: Auth = { kind: "anon" };

export type ApiResult<T> = {
  status: number;
  data?: T;
  error?: string;
  field?: string;
};

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: Auth } = {}
): Promise<ApiResult<T>> {
  const auth = options.auth ?? BYPASS;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth.kind === "bypass") {
    const secret = process.env.VERIFY_SECRET;
    if (!secret) throw new Error("VERIFY_SECRET no está definido.");
    headers["x-verify-secret"] = secret;
  } else if (auth.kind === "session") {
    headers.cookie = auth.cookie;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: "manual",
  });

  const json = (await response.json().catch(() => null)) as {
    data?: T;
    error?: string;
    field?: string;
  } | null;

  return {
    status: response.status,
    data: json?.data,
    error: json?.error,
    field: json?.field,
  };
}

function cookieHeader(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

/** Login real con Auth.js (credentials): devuelve la cookie de sesión. */
export async function login(
  email: string,
  password = SEED_PASSWORD
): Promise<Auth> {
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(csrfResponse),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE_URL}/`,
    }),
  });

  const cookie = cookieHeader(response);
  if (!cookie.includes("authjs.session-token")) {
    throw new Error(`Login fallido para ${email} (HTTP ${response.status}).`);
  }

  return { kind: "session", cookie };
}

// ---------------------------------------------------------------- Fechas

/** Día hábil (lunes a sábado) a `daysAhead` días de hoy, en formato dd-MM-yyyy. */
export function futureWorkday(daysAhead: number): string {
  let date = addDays(parseAppDate(getTodayAppDate())!, daysAhead);
  if (date.getDay() === 0) date = addDays(date, 1);
  return toAppDate(date);
}

export function weekdayName(appDate: string): string {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][
    parseAppDate(appDate)!.getDay()
  ];
}

// ---------------------------------------------------------------- Fixtures (Prisma)

const ALL_WORKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function createProfessional(
  overrides: Partial<{
    id: string;
    nombrePila: string;
    apellido: string;
    diasAtencion: string[];
    horarioInicio: string;
    horarioFin: string;
    activo: boolean;
  }> = {}
) {
  const nombrePila = overrides.nombrePila ?? "Test";
  const apellido = overrides.apellido ?? "Profesional";
  const license = `MN${uniqueDigits(6)}`;

  return prisma.profesional.create({
    data: {
      id: overrides.id ?? testId("prof"),
      nombre: `${nombrePila} ${apellido}`,
      nombrePila,
      apellido,
      matricula: license,
      matriculaNormalizada: license,
      especialidad: "Traumatología",
      diasAtencion: overrides.diasAtencion ?? ALL_WORKDAYS,
      horarioInicio: overrides.horarioInicio ?? "08:00",
      horarioFin: overrides.horarioFin ?? "20:00",
      duracionDefault: 60,
      activo: overrides.activo ?? true,
      colorAvatar: "brand",
    },
  });
}

export async function createPatient(
  overrides: Partial<{ id: string; nombrePila: string; apellido: string }> = {}
) {
  const nombrePila = overrides.nombrePila ?? "Test";
  const apellido = overrides.apellido ?? "Paciente";
  const dni = uniqueDigits(8);

  return prisma.paciente.create({
    data: {
      id: overrides.id ?? testId("pac"),
      nombre: `${nombrePila} ${apellido}`,
      nombrePila,
      apellido,
      dni,
      dniNormalizado: dni,
      telefono: "+54 11 5555-5555",
      estado: "activo",
    },
  });
}

/** Turno directo en DB: permite estados/fechas que la API no deja crear (p. ej. atendido pasado). */
export async function createAppointmentInDb(input: {
  patient: { id: string; nombre: string };
  professional: { id: string; nombre: string };
  date: string;
  time: string;
  status?: "pendiente" | "confirmado" | "atendido" | "cancelado" | "ausente";
}) {
  return prisma.turno.create({
    data: {
      id: testId("turno"),
      pacienteId: input.patient.id,
      pacienteNombre: input.patient.nombre,
      profesionalId: input.professional.id,
      profesionalNombre: input.professional.nombre,
      fecha: appDateToDb(input.date),
      hora: appTimeToDb(input.time),
      duracion: 60,
      estado: input.status ?? "pendiente",
      tipoSesion: "Control",
    },
  });
}

export async function createUser(input: {
  rol: RolUsuario;
  password?: string;
  profesionalId?: string | null;
}) {
  const id = testId("user");
  return prisma.usuario.create({
    data: {
      id,
      email: `${id}@test.local`,
      nombre: `Usuario ${id}`,
      passwordHash: await hashPassword(input.password ?? SEED_PASSWORD),
      rol: input.rol,
      activo: true,
      profesionalId: input.profesionalId ?? null,
    },
  });
}

export function appointmentBody(input: {
  id?: string;
  patientId: string;
  professionalId: string;
  date: string;
  time: string;
  status?: string;
}) {
  return {
    id: input.id ?? testId("turno"),
    patientId: input.patientId,
    professionalId: input.professionalId,
    date: input.date,
    time: input.time,
    duration: 60,
    sessionType: "Control",
    status: input.status ?? "pendiente",
    notes: "",
  };
}

/** Borra todo lo creado por los tests (prefijo `it-`), sin tocar el seed. */
export async function cleanupTestData(): Promise<void> {
  const byPrefix = { startsWith: TEST_PREFIX };
  await prisma.turno.deleteMany({
    where: {
      OR: [{ id: byPrefix }, { pacienteId: byPrefix }, { profesionalId: byPrefix }],
    },
  });
  await prisma.usuario.deleteMany({ where: { id: byPrefix } });
  await prisma.paciente.deleteMany({ where: { id: byPrefix } });
  await prisma.profesional.deleteMany({ where: { id: byPrefix } });
}
