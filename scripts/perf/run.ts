/**
 * Pruebas de rendimiento (RNF03, RNF04).
 *
 *   npm run perf                      # crea una base descartable, carga volumen, compila y mide
 *   npm run perf -- --sin-build       # reutiliza la compilación anterior (.next-perf)
 *   npm run perf -- --salida informe.md
 *
 * Crea una base nueva (`kineturnos_perf_…`) en el mismo servidor de DATABASE_URL
 * (.env.local), la migra, la llena con meses de operación del consultorio, levanta
 * la app compilada para producción en el puerto 3100 y mide la API y las pantallas
 * con varios usuarios a la vez. Al terminar borra la base. No toca otros datos,
 * pero usá la rama de pruebas de Neon, nunca la de producción.
 */
import { DEFAULT_VOLUME, seedVolume } from "./seed-volume";
import { createScratchApp } from "../lib/scratch-app";
import { chromium } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { addDays, format } from "date-fns";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const REQUESTS = Number(option("pedidos", "60"));
const CONCURRENCY = Number(option("usuarios", "6"));
const PAGE_RUNS = Number(option("cargas", "5"));
/** Altas y cambios de estado: dos recepcionistas a la vez, como en el consultorio. */
const WRITERS = 2;
const LIMIT_MS = 3000;

interface Sample {
  ms: number;
  bytes: number;
  status: number;
}

interface Row {
  scenario: string;
  samples: Sample[];
}

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`);
const fmtKb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

function cookieHeader(response: Response): string {
  const jar = new Map<string, string>();
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    jar.set(pair.slice(0, pair.indexOf("=")), pair);
  }
  return [...jar.values()].join("; ");
}

async function login(email: string, password: string): Promise<string> {
  const csrf = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrf.json()) as { csrfToken: string };
  const response = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader(csrf) },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/` }),
  });
  const cookie = cookieHeader(response);
  if (!cookie.includes("authjs.session-token")) throw new Error(`No se pudo iniciar sesión como ${email}.`);
  return cookie;
}

async function timed(cookie: string, path: string, init: RequestInit = {}): Promise<Sample> {
  const start = performance.now();
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", cookie, ...(init.headers ?? {}) },
  });
  const body = await response.arrayBuffer();
  return { ms: performance.now() - start, bytes: body.byteLength, status: response.status };
}

/** `total` pedidos repartidos entre `users` usuarios simultáneos. */
async function load(total: number, users: number, run: (index: number) => Promise<Sample>): Promise<Sample[]> {
  const samples: Sample[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: users }, async () => {
      while (next < total) {
        const index = next++;
        samples.push(await run(index));
      }
    })
  );
  return samples;
}

async function measurePages(email: string, password: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(`${BASE}/`);

  const screens: { name: string; path: string; ready: () => Promise<void> }[] = [
    {
      name: "Panel (hoy, para hacer e indicadores)",
      path: "/",
      ready: () => page.getByRole("region", { name: "Indicadores" }).waitFor(),
    },
    {
      name: "Agenda del día",
      path: "/agenda",
      ready: () => page.getByRole("group", { name: "Vista de la agenda" }).waitFor(),
    },
    {
      name: "Lista de pacientes",
      path: "/pacientes",
      ready: () => page.getByRole("table").getByRole("row").nth(1).waitFor(),
    },
  ];

  const results: { name: string; times: number[] }[] = [];
  for (const screen of screens) {
    const times: number[] = [];
    for (let attempt = 0; attempt < PAGE_RUNS + 1; attempt += 1) {
      const start = performance.now();
      await page.goto(`${BASE}${screen.path}`);
      await screen.ready();
      // La primera carga compila y calienta cachés: no se cuenta.
      if (attempt > 0) times.push(performance.now() - start);
    }
    results.push({ name: screen.name, times });
  }
  await browser.close();
  return results;
}

async function main() {
  const app = await createScratchApp("kineturnos_perf", PORT);
  const password = randomBytes(12).toString("base64url") + "9a";
  let dbLatency = 0;

  try {
    // Ida y vuelta a la base desde donde corre la app: pesa en cada consulta.
    await app.db.$queryRaw`SELECT 1`;
    const pings: number[] = [];
    for (let index = 0; index < 10; index += 1) {
      const start = performance.now();
      await app.db.$queryRaw`SELECT 1`;
      pings.push(performance.now() - start);
    }
    dbLatency = percentile(pings, 50);
    console.log(`Latencia app → base: ${fmtMs(dbLatency)} por consulta`);
    const seedStart = performance.now();
    const volume = await seedVolume(app.db, password, DEFAULT_VOLUME);
    console.log(`Volumen cargado en ${fmtMs(performance.now() - seedStart)}:`, volume.counts);

    await app.start({ skipBuild: flag("sin-build") });

    const adminCookie = await login(volume.adminEmail, password);
    const professionalCookie = await login(volume.professionalEmail, password);

    // Arranque en frío de cada endpoint (primera consulta), aparte.
    for (const path of ["/api/appointments", "/api/patients", "/api/professionals", "/api/autorizaciones"]) {
      await timed(adminCookie, path);
    }

    const rows: Row[] = [];
    const measure = async (
      scenario: string,
      fn: (index: number) => Promise<Sample>,
      users = CONCURRENCY
    ) => {
      process.stdout.write(`Midiendo: ${scenario}… `);
      const samples = await load(REQUESTS, users, fn);
      rows.push({ scenario: `${scenario} · ${users} a la vez`, samples });
      console.log(`p95 ${fmtMs(percentile(samples.map((s) => s.ms), 95))}`);
    };

    await measure("Turnos (todos, Administración)", () => timed(adminCookie, "/api/appointments"));
    await measure("Turnos (los propios, Profesional)", () => timed(professionalCookie, "/api/appointments"));
    await measure("Pacientes (con cobertura)", () => timed(adminCookie, "/api/patients"));
    await measure("Profesionales", () => timed(adminCookie, "/api/professionals"));
    await measure("Autorizaciones", () => timed(adminCookie, "/api/autorizaciones"));
    await measure("Historia clínica de un paciente", () =>
      timed(professionalCookie, `/api/patients/${volume.samplePatientId}/historia`)
    );

    // Altas en horarios libres (días hábiles futuros): cada recepcionista agenda con
    // su propio profesional sin turnos, así no chocan horarios.
    const freeSlots: { date: string; time: string }[] = [];
    for (let offset = 40; freeSlots.length < REQUESTS; offset += 1) {
      const day = addDays(new Date(), offset);
      if (day.getDay() === 0) continue;
      for (let hour = 8; hour < 18 && freeSlots.length < REQUESTS; hour += 1) {
        freeSlots.push({ date: format(day, "dd-MM-yyyy"), time: `${String(hour).padStart(2, "0")}:00` });
      }
    }
    const created: string[] = [];
    await measure(
      "Agendar un turno (con validaciones y bloqueo)",
      (index) =>
        timed(adminCookie, "/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            patientId: `perf-pac-${index}`,
            professionalId: volume.freeProfessionalIds[index % WRITERS],
            date: freeSlots[Math.floor(index / WRITERS)].date,
            time: freeSlots[Math.floor(index / WRITERS)].time,
            sessionType: "Rehabilitación",
            status: "pendiente",
            notes: "",
          }),
        }),
      WRITERS
    );
    for (const appointment of await app.db.turno.findMany({
      where: { profesionalId: { in: volume.freeProfessionalIds } },
      select: { id: true },
    })) {
      created.push(appointment.id);
    }
    await measure(
      "Confirmar un turno (cambio de estado)",
      (index) =>
        timed(adminCookie, `/api/appointments/${created[index % created.length]}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "confirmado" }),
        }),
      WRITERS
    );

    console.log("Midiendo pantallas en el navegador…");
    const pages = await measurePages(volume.adminEmail, password);

    const failures = rows.flatMap((row) => row.samples).filter((sample) => sample.status >= 400).length;
    const lines = [
      `## Resultados (${format(new Date(), "dd-MM-yyyy HH:mm")})`,
      "",
      `Volumen: ${Object.entries(volume.counts)
        .map(([key, value]) => `${value} ${key}`)
        .join(", ")}. ${REQUESTS} pedidos por escenario. Latencia de la app a la base: ${fmtMs(dbLatency)} por consulta.`,
      "",
      "### API",
      "",
      "| Escenario | Mediana | p95 | Máximo | Tamaño | Límite 3 s |",
      "|---|---|---|---|---|---|",
      ...rows.map(({ scenario, samples }) => {
        const times = samples.map((sample) => sample.ms);
        const p95 = percentile(times, 95);
        return `| ${scenario} | ${fmtMs(percentile(times, 50))} | ${fmtMs(p95)} | ${fmtMs(Math.max(...times))} | ${fmtKb(
          percentile(samples.map((sample) => sample.bytes), 50)
        )} | ${p95 <= LIMIT_MS ? "✅" : "❌"} |`;
      }),
      "",
      `Respuestas con error: ${failures}.`,
      "",
      "### Pantallas (desde que se pide hasta que se puede usar)",
      "",
      "| Pantalla | Mediana | Máximo | Límite 3 s |",
      "|---|---|---|---|",
      ...pages.map(({ name: screen, times }) => {
        const max = Math.max(...times);
        return `| ${screen} | ${fmtMs(percentile(times, 50))} | ${fmtMs(max)} | ${max <= LIMIT_MS ? "✅" : "❌"} |`;
      }),
      "",
    ];
    const report = lines.join("\n");
    console.log(`\n${report}`);
    const output = option("salida", "");
    if (output) writeFileSync(output, report, "utf8");
  } finally {
    await app.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
