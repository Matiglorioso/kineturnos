import { PrismaClient } from "@prisma/client";
import {
  normalizeDni,
  normalizeLicense,
} from "../src/lib/document-validation";

const prisma = new PrismaClient();
const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const VERIFY_SECRET = process.env.VERIFY_SECRET;

type CheckResult = { name: string; ok: boolean; detail: string };

const results: CheckResult[] = [];

function apiHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (VERIFY_SECRET) {
    headers["x-verify-secret"] = VERIFY_SECRET;
  }

  return { ...headers, ...(extra as Record<string, string> | undefined) };
}

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: apiHeaders(init?.headers),
  });
  const body = (await res.json().catch(() => null)) as {
    data?: T;
    error?: string;
  } | null;

  if (!res.ok) {
    throw new Error(body?.error ?? `HTTP ${res.status} en ${path}`);
  }

  if (!body || body.data === undefined) {
    throw new Error(`Respuesta invalida en ${path}`);
  }

  return body.data;
}

type ProfessionalSchedule = {
  id: string;
  days: string[];
  scheduleStart: string;
  scheduleEnd: string;
};

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Devuelve un bloque válido de 1 h para el profesional: primer día que atiende
 * a partir de `fromIso` (YYYY-MM-DD) y la hora del bloque `slotIndex` dentro de su horario.
 */
function findValidSlot(
  professional: ProfessionalSchedule,
  fromIso: string,
  slotIndex = 0
): { date: string; time: string } {
  const [startH] = professional.scheduleStart.split(":").map(Number);
  const [endH] = professional.scheduleEnd.split(":").map(Number);
  const slots = Math.max(1, endH - startH);
  const hour = startH + (slotIndex % slots);
  const base = new Date(`${fromIso}T12:00:00Z`);

  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(base.getTime() + offset * 86_400_000);
    if (professional.days.includes(WEEKDAY_NAMES[day.getUTCDay()])) {
      const dd = String(day.getUTCDate()).padStart(2, "0");
      const mm = String(day.getUTCMonth() + 1).padStart(2, "0");
      return {
        date: `${dd}-${mm}-${day.getUTCFullYear()}`,
        time: `${String(hour).padStart(2, "0")}:00`,
      };
    }
  }

  throw new Error(`El profesional ${professional.id} no tiene días de atención.`);
}

async function verifyDbIntegrity() {
  const pacientes = await prisma.paciente.findMany();
  const profesionales = await prisma.profesional.findMany();
  const turnos = await prisma.turno.findMany();
  const usuarios = await prisma.usuario.findMany();

  if (pacientes.length === 0) {
    fail("DB pacientes", "No hay pacientes. Ejecutá npm run db:seed");
  } else {
    pass("DB pacientes", `${pacientes.length} registros`);
  }

  if (profesionales.length === 0) {
    fail("DB profesionales", "No hay profesionales. Ejecutá npm run db:seed");
  } else {
    pass("DB profesionales", `${profesionales.length} registros`);
  }

  pass("DB turnos", `${turnos.length} registros (seed)`);

  if (usuarios.length < 3) {
    fail("DB usuarios", `Se esperaban 3 usuarios demo, hay ${usuarios.length}`);
  } else {
    pass("DB usuarios", `${usuarios.length} usuarios (admin, recepcion, profesional)`);
  }

  const roles = new Set(usuarios.map((u) => u.rol));
  if (!roles.has("admin") || !roles.has("recepcion") || !roles.has("profesional")) {
    fail("Roles usuarios", "Faltan roles admin, recepcion o profesional en seed");
  } else {
    pass("Roles usuarios", "admin, recepcion y profesional presentes");
  }

  const pacientesSinDniNorm = pacientes.filter(
    (p) => !p.dniNormalizado || p.dniNormalizado !== normalizeDni(p.dni)
  );
  if (pacientesSinDniNorm.length > 0) {
    fail(
      "DNI normalizado",
      `${pacientesSinDniNorm.length} paciente(s) con dni_normalizado incorrecto`
    );
  } else if (pacientes.length > 0) {
    pass("DNI normalizado", "Todos los pacientes tienen dni_normalizado correcto");
  }

  const pacientesNullCriticos = pacientes.filter(
    (p) => !p.nombrePila || !p.apellido || !p.email || !p.fechaAlta
  );
  if (pacientesNullCriticos.length > 0) {
    fail(
      "Pacientes campos completos",
      `${pacientesNullCriticos.length} con campos NULL inesperados`
    );
  } else if (pacientes.length > 0) {
    pass("Pacientes campos completos", "nombre_pila, apellido, email y fecha_alta OK");
  }

  const dniNorms = pacientes.map((p) => p.dniNormalizado);
  const dniDupes = dniNorms.length - new Set(dniNorms).size;
  if (dniDupes > 0) {
    fail("DNI unicos en DB", `${dniDupes} duplicado(s) en dni_normalizado`);
  } else if (pacientes.length > 0) {
    pass("DNI unicos en DB", "Sin duplicados en dni_normalizado");
  }

  const mats = profesionales
    .map((p) => p.matriculaNormalizada)
    .filter(Boolean) as string[];
  const matDupes = mats.length - new Set(mats).size;
  if (matDupes > 0) {
    fail("Matriculas unicas en DB", `${matDupes} duplicado(s)`);
  } else if (profesionales.length > 0) {
    pass("Matriculas unicas en DB", "Sin duplicados en matricula_normalizada");
  }

  for (const turno of turnos) {
    const paciente = pacientes.find((p) => p.id === turno.pacienteId);
    const profesional = profesionales.find((p) => p.id === turno.profesionalId);
    if (!paciente || !profesional) {
      fail(
        "FK turnos",
        `Turno ${turno.id} referencia paciente/profesional inexistente`
      );
      return;
    }
  }
  if (turnos.length > 0) {
    pass("FK turnos", "Todos los turnos tienen paciente y profesional validos");
  }
}

async function verifyPatientsApi() {
  const list = await fetchApi<
    Array<{ id: string; name: string; dni: string; firstName?: string }>
  >("/api/patients");

  if (list.length === 0) {
    fail("GET /api/patients", "Lista vacia");
    return;
  }

  pass("GET /api/patients", `${list.length} pacientes`);

  const testId = `p-verify-${Date.now()}`;
  const created = await fetchApi<{ id: string; name: string; dni: string }>(
    "/api/patients",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        firstName: "Test",
        lastName: "Verificacion",
        dni: "99.999.999",
        phone: "+54 11 9999-9999",
        email: "test.verify@email.com",
        insurance: "Particular",
        status: "activo",
        notes: "",
      }),
    }
  );

  if (created.id !== testId) {
    fail("POST /api/patients", "ID no coincide");
  } else {
    pass("POST /api/patients", `Creado ${created.name}`);
  }

  try {
    await fetchApi("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Duplicado",
        lastName: "DNI",
        dni: "99999999",
        phone: "+54 11 1111-1111",
        email: "",
        insurance: "",
        status: "activo",
        notes: "",
      }),
    });
    fail("POST DNI duplicado", "Deberia rechazar DNI duplicado (409)");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("DNI") || msg.includes("409") || msg.includes("existe")) {
      pass("POST DNI duplicado", "Rechazado correctamente");
    } else {
      fail("POST DNI duplicado", msg);
    }
  }

  await fetchApi(`/api/patients/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "Actualizado",
      dni: "99.999.999",
      phone: "+54 11 9999-9999",
      email: "test.updated@email.com",
      insurance: "OSDE",
      status: "activo",
      notes: "Nota test",
    }),
  });
  pass("PATCH /api/patients/[id]", "Actualizacion OK");

  await fetchApi(`/api/patients/${testId}`, { method: "DELETE" });
  pass("DELETE /api/patients/[id]", "Eliminacion OK");
}

async function verifyProfessionalsApi() {
  const list = await fetchApi<Array<{ id: string; name: string; license?: string }>>(
    "/api/professionals"
  );

  if (list.length === 0) {
    fail("GET /api/professionals", "Lista vacia");
    return;
  }

  pass("GET /api/professionals", `${list.length} profesionales`);

  const testId = `prof-verify-${Date.now()}`;
  const created = await fetchApi<{ id: string; name: string }>("/api/professionals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: testId,
      firstName: "Test",
      lastName: "Kine",
      license: "MN 99.999",
      email: "prof.test@email.com",
      phone: "+54 11 8888-8888",
      specialty: "Traumatología",
      days: ["Lunes", "Martes"],
      scheduleStart: "09:00",
      scheduleEnd: "17:00",
      defaultDuration: "45",
      active: true,
      avatarColor: "bg-teal-500",
      notes: "",
    }),
  });

  pass("POST /api/professionals", `Creado ${created.name}`);

  try {
    await fetchApi("/api/professionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Duplicado",
        lastName: "Matricula",
        license: "MN99999",
        email: "",
        phone: "",
        specialty: "Deportiva",
        days: ["Miércoles"],
        scheduleStart: "10:00",
        scheduleEnd: "18:00",
        defaultDuration: "45",
        active: true,
        avatarColor: "bg-blue-500",
        notes: "",
      }),
    });
    fail("POST matricula duplicada", "Deberia rechazar matricula duplicada");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("matricula") || msg.includes("existe")) {
      pass("POST matricula duplicada", "Rechazado correctamente");
    } else {
      fail("POST matricula duplicada", msg);
    }
  }

  await fetchApi(`/api/professionals/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "Actualizado",
      license: "MN 99.999",
      email: "prof.updated@email.com",
      phone: "+54 11 8888-8888",
      specialty: "RPG",
      days: ["Lunes", "Jueves"],
      scheduleStart: "08:00",
      scheduleEnd: "16:00",
      defaultDuration: "60",
      active: true,
      avatarColor: "bg-teal-500",
      notes: "Test",
    }),
  });
  pass("PATCH /api/professionals/[id]", "Actualizacion OK");

  await fetchApi(`/api/professionals/${testId}`, { method: "DELETE" });
  pass("DELETE /api/professionals/[id]", "Eliminacion OK (sin turnos)");

  const withTurnos = list[0] as unknown as ProfessionalSchedule | undefined;
  const patientsForBlock = await fetchApi<Array<{ id: string }>>("/api/patients");
  if (withTurnos && patientsForBlock[0]) {
    const blockSlot = findValidSlot(withTurnos, "2027-03-01");
    const blockId = `a-block-${Date.now()}`;
    await fetchApi("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        id: blockId,
        patientId: patientsForBlock[0].id,
        professionalId: withTurnos.id,
        date: blockSlot.date,
        time: blockSlot.time,
        duration: "60",
        sessionType: "Control",
        status: "pendiente",
        notes: "",
      }),
    });

    try {
      await fetchApi(`/api/professionals/${withTurnos.id}`, { method: "DELETE" });
      fail(
        "DELETE profesional con turnos activos",
        "Deberia bloquear eliminacion si tiene turnos pendientes o confirmados"
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("turno") && (msg.includes("activo") || msg.includes("asignado"))) {
        pass(
          "DELETE profesional con turnos activos",
          "Bloqueado correctamente"
        );
      } else {
        fail("DELETE profesional con turnos activos", msg);
      }
    }

    await fetchApi(`/api/appointments/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelado" }),
    });
  }
}

async function verifyAppointmentsApi() {
  const list = await fetchApi<
    Array<{ id: string; patientId: string; professionalId: string; date: string; time: string }>
  >("/api/appointments");

  pass("GET /api/appointments", `${list.length} turnos`);

  const patients = await fetchApi<Array<{ id: string; name: string }>>(
    "/api/patients"
  );
  const professionals = await fetchApi<Array<ProfessionalSchedule & { name: string }>>(
    "/api/professionals"
  );

  if (patients.length === 0 || professionals.length === 0) {
    fail("POST /api/appointments", "Faltan pacientes o profesionales para probar");
    return;
  }

  const testId = `a-verify-${Date.now()}`;
  const patient = patients[0];
  const professional = professionals[0];
  const { date: testDate, time } = findValidSlot(professional, "2027-04-05", 1);

  const created = await fetchApi<{ id: string; patientName: string }>(
    "/api/appointments",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testId,
        patientId: patient.id,
        professionalId: professional.id,
        date: testDate,
        time,
        duration: "60",
        sessionType: "Control",
        status: "pendiente",
        notes: "",
      }),
    }
  );

  pass("POST /api/appointments", `Creado turno de ${created.patientName}`);

  try {
    await fetchApi("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        professionalId: professional.id,
        date: testDate,
        time,
        duration: "60",
        sessionType: "Control",
        status: "pendiente",
        notes: "",
      }),
    });
    fail("POST turno solapado", "Deberia rechazar solapamiento");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("horario") || msg.includes("profesional")) {
      pass("POST turno solapado", "Rechazado correctamente");
    } else {
      fail("POST turno solapado", msg);
    }
  }

  await fetchApi(`/api/appointments/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmado" }),
  });
  pass("PATCH estado turno", "Cambio de estado OK");

  await fetchApi(`/api/appointments/${testId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId: patient.id,
      professionalId: professional.id,
      date: testDate,
      time,
      duration: "60",
      sessionType: "Rehabilitación",
      status: "confirmado",
      notes: "Actualizado",
    }),
  });
  pass("PATCH /api/appointments/[id]", "Actualizacion completa OK");

  await fetchApi(`/api/appointments/${testId}`, { method: "PATCH", headers: apiHeaders(), body: JSON.stringify({ status: "cancelado" }) });
  pass("DELETE logico turno", "Cancelacion via PATCH OK");
}

async function verifySyncBehavior() {
  const patients = await fetchApi<Array<{ id: string; name: string; lastAppointment?: string }>>(
    "/api/patients"
  );
  const professionals = await fetchApi<Array<ProfessionalSchedule & { name: string }>>(
    "/api/professionals"
  );

  if (patients.length === 0 || professionals.length === 0) {
    fail("Sync ultimo_turno", "Faltan pacientes o profesionales");
    return;
  }

  const patientId = `p-sync-${Date.now()}`;
  const professionalId = professionals[0].id;
  const appointmentId = `a-sync-${Date.now()}`;
  const { date: futureDate, time } = findValidSlot(professionals[0], "2027-05-03", 2);
  // La API no permite turnos en fechas pasadas ni "atendido" en fechas futuras:
  // se crea pendiente a futuro y se lleva a pasado/atendido directo en DB.
  const attendedDate = "05-01-2026";
  const testDni = `${Date.now()}`.slice(-8);

  await fetchApi("/api/patients", {
    method: "POST",
    body: JSON.stringify({
      id: patientId,
      firstName: "Sync",
      lastName: "UltimoTurno",
      dni: testDni,
      phone: "+54 11 7777-7777",
      email: "sync@test.local",
      insurance: "Particular",
      status: "activo",
      notes: "",
    }),
  });

  await fetchApi("/api/appointments", {
    method: "POST",
    body: JSON.stringify({
      id: appointmentId,
      patientId,
      professionalId,
      date: futureDate,
      time,
      duration: "60",
      sessionType: "Control",
      status: "pendiente",
      notes: "",
    }),
  });

  await prisma.turno.update({
    where: { id: appointmentId },
    data: { fecha: attendedDate, estado: "atendido" },
  });

  const patientAfterAttended = await fetchApi<{
    lastAppointment?: string;
  }>(`/api/patients/${patientId}`);

  if (patientAfterAttended.lastAppointment === attendedDate) {
    pass("Sync ultimo_turno", `Actualizado a ${attendedDate}`);
  } else {
    fail(
      "Sync ultimo_turno",
      `Esperado ${attendedDate}, recibido ${patientAfterAttended.lastAppointment ?? "null"}`
    );
  }

  const updatedPatientName = "Sync Nombre Nuevo";
  await fetchApi(`/api/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify({
      firstName: "Sync",
      lastName: "Nombre Nuevo",
      dni: testDni,
      phone: "+54 11 7777-7777",
      email: "sync@test.local",
      insurance: "Particular",
      status: "activo",
      notes: "",
    }),
  });

  const appointmentAfterRename = await fetchApi<{ patientName: string }>(
    `/api/appointments/${appointmentId}`
  );

  if (appointmentAfterRename.patientName === updatedPatientName) {
    pass("Sync paciente_nombre", "Nombre propagado al turno");
  } else {
    fail(
      "Sync paciente_nombre",
      `Esperado "${updatedPatientName}", recibido "${appointmentAfterRename.patientName}"`
    );
  }

  await fetchApi(`/api/patients/${patientId}`, { method: "DELETE" });
}

async function verifyAuthProtection() {
  const res = await fetch(`${BASE}/api/patients`);
  const body = (await res.json().catch(() => null)) as { error?: string } | null;

  if (res.status === 401) {
    pass("API sin auth", "Rechaza 401 sin sesion ni VERIFY_SECRET");
    return;
  }

  fail(
    "API sin auth",
    `Esperado 401, recibido ${res.status}: ${body?.error ?? JSON.stringify(body) ?? "sin mensaje"}`
  );
}

async function main() {
  console.log("Verificando migracion a PostgreSQL...\n");
  console.log(`Base URL: ${BASE}\n`);

  try {
    await verifyDbIntegrity();
  } catch (error) {
    fail("DB integrity", error instanceof Error ? error.message : String(error));
  }

  let serverUp = false;
  try {
    const health = await fetch(`${BASE}/api/health/db`);
    serverUp = health.ok;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    console.log(
      "Servidor no disponible en",
      BASE,
      "- omitiendo pruebas API (solo DB).\n"
    );
    console.log("Para pruebas API completas: npm run dev en otra terminal.\n");
  } else {
    if (!VERIFY_SECRET) {
      console.log(
        "VERIFY_SECRET no configurado — las pruebas API pueden fallar por auth.\n"
      );
      console.log(
        "Agregá VERIFY_SECRET en .env (ver env.example) y reiniciá dev.\n"
      );
    }

    try {
      await verifyPatientsApi();
    } catch (error) {
      fail("API pacientes", error instanceof Error ? error.message : String(error));
    }

    try {
      await verifyProfessionalsApi();
    } catch (error) {
      fail(
        "API profesionales",
        error instanceof Error ? error.message : String(error)
      );
    }

    try {
      await verifyAppointmentsApi();
    } catch (error) {
      fail(
        "API turnos",
        error instanceof Error ? error.message : String(error)
      );
    }

    try {
      await verifySyncBehavior();
    } catch (error) {
      fail(
        "Sync dominio",
        error instanceof Error ? error.message : String(error)
      );
    }

    try {
      await verifyAuthProtection();
    } catch (error) {
      fail(
        "Auth API",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"}  ${r.name}: ${r.detail}`);
  }

  console.log(`\n${passed.length} OK, ${failed.length} FAIL`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
