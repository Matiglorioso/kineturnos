#!/usr/bin/env node
/**
 * Informe de disponibilidad (RNF08) a partir del historial del workflow
 * "Disponibilidad" de GitHub Actions. Necesita el CLI `gh` autenticado.
 *
 *   npm run disponibilidad                 # últimos 30 días
 *   npm run disponibilidad -- --dias 7
 *   npm run disponibilidad -- --desde 2026-10-26
 */
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const since = option("desde")
  ? new Date(`${option("desde")}T00:00:00-03:00`)
  : new Date(Date.now() - Number(option("dias") ?? 30) * 24 * 60 * 60 * 1000);

if (Number.isNaN(since.getTime())) {
  console.error("Fecha inválida. Usá --desde aaaa-mm-dd o --dias N.");
  process.exit(1);
}

let output;
try {
  output = execFileSync(
    "gh",
    [
      "api",
      "--paginate",
      `repos/{owner}/{repo}/actions/workflows/disponibilidad.yml/runs?per_page=100&created=${encodeURIComponent(`>=${since.toISOString()}`)}`,
      "--jq",
      ".workflow_runs[] | [.conclusion, .created_at, .event] | @tsv",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
} catch (error) {
  const detail = String(error.stderr ?? error.message);
  console.error(
    detail.includes("404")
      ? "No se encontró el workflow \"Disponibilidad\": todavía no está en main."
      : `No se pudo leer el historial de GitHub Actions (¿gh instalado y autenticado?).
${detail}`
  );
  process.exit(1);
}

const runs = output
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [conclusion, createdAt, event] = line.split("\t");
    return { conclusion, createdAt: new Date(createdAt), event };
  })
  // Solo los chequeos programados y terminados (no los manuales ni los que siguen corriendo).
  .filter((run) => run.event === "schedule" && (run.conclusion === "success" || run.conclusion === "failure"));

if (runs.length === 0) {
  console.log("Todavía no hay chequeos programados en ese período.");
  process.exit(0);
}

const failures = runs.filter((run) => run.conclusion === "failure");
const percent = ((runs.length - failures.length) / runs.length) * 100;
const first = runs.reduce((min, run) => (run.createdAt < min ? run.createdAt : min), runs[0].createdAt);
const format = (date) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

console.log(`Disponibilidad de producción desde ${format(first)}`);
console.log(`  Chequeos: ${runs.length} (cada 15 minutos)`);
console.log(`  Exitosos: ${runs.length - failures.length}`);
console.log(`  Fallidos: ${failures.length}`);
console.log(`  Disponibilidad: ${percent.toFixed(2)} %`);
if (failures.length > 0) {
  console.log("  Fallas:");
  for (const run of failures) console.log(`    - ${format(run.createdAt)}`);
}
