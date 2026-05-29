import { PrismaClient } from "@prisma/client";

const BASE = process.env.VERIFY_PROD_URL ?? "https://kineturnos.vercel.app";

type CheckResult = { name: string; ok: boolean; detail: string };

const results: CheckResult[] = [];

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
}

async function checkJson(path: string, predicate: (body: unknown) => boolean, okDetail: string, failDetail: string) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const body = await res.json().catch(() => null);
    if (predicate(body)) {
      pass(path, okDetail);
    } else {
      fail(path, `${failDetail} (HTTP ${res.status})`);
    }
  } catch (error) {
    fail(path, error instanceof Error ? error.message : String(error));
  }
}

async function checkStatus(path: string, expected: number, okDetail: string) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    if (res.status === expected) {
      pass(path, okDetail);
    } else {
      fail(path, `Esperado HTTP ${expected}, recibido ${res.status}`);
    }
  } catch (error) {
    fail(path, error instanceof Error ? error.message : String(error));
  }
}

async function checkRedirectToLogin(path: string) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const location = res.headers.get("location") ?? "";
    if (
      (res.status === 307 || res.status === 308 || res.status === 302) &&
      location.includes("/login")
    ) {
      pass(path, "Redirige a /login sin sesion");
    } else {
      fail(path, `Esperado redirect a login, recibido ${res.status} → ${location || "sin location"}`);
    }
  } catch (error) {
    fail(path, error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log(`Verificando produccion: ${BASE}\n`);

  await checkJson(
    "/api/health/db",
    (body) =>
      typeof body === "object" &&
      body !== null &&
      "ok" in body &&
      (body as { ok: boolean }).ok === true,
    "DB conectada",
    "Health DB fallo"
  );

  await checkStatus("/login", 200, "Login accesible");

  await checkStatus("/ayuda", 200, "Ayuda publica accesible");

  await checkRedirectToLogin("/proyecto");

  await checkRedirectToLogin("/pacientes");

  await checkStatus("/api/patients", 401, "API protegida sin auth");

  const prisma = new PrismaClient();
  try {
    const usuarios = await prisma.usuario.count();
    if (usuarios >= 3) {
      pass("DB usuarios (local/Neon)", `${usuarios} usuarios en seed`);
    } else {
      fail(
        "DB usuarios (local/Neon)",
        `Solo ${usuarios} usuario(s). Corré npm run db:seed con DATABASE_URL de produccion`
      );
    }
  } catch (error) {
    fail(
      "DB usuarios (local/Neon)",
      `No se pudo consultar: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await prisma.$disconnect();
  }

  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"}  ${r.name}: ${r.detail}`);
  }

  console.log(`\n${passed.length} OK, ${failed.length} FAIL`);

  if (failed.length > 0) {
    console.log(
      "\nSi falla login en Vercel: agregá AUTH_SECRET y redeploy (docs/TU-PARTE-VERCEL.md)."
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
