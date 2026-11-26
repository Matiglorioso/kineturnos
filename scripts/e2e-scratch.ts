/**
 * Corre los E2E en local contra una base descartable (nunca la de .env.local):
 * crea la base en la rama de pruebas de Neon, la migra y siembra como el CI, levanta
 * `next dev` en el 3400 y corre Playwright. Al terminar borra la base.
 *
 *   npx tsx scripts/e2e-scratch.ts [argumentos de playwright]
 *   npx tsx scripts/e2e-scratch.ts e2e/pacientes.spec.ts --project=desktop
 */
import { createScratchApp, run } from "./lib/scratch-app";
import { spawn, spawnSync } from "node:child_process";

const PORT = 3400;

async function main() {
  const app = await createScratchApp("kineturnos_e2e", PORT);
  await app.db.$disconnect();
  const env = {
    ...process.env,
    DATABASE_URL: app.databaseUrl,
    NEXT_DIST_DIR: ".next-e2e",
    BREVO_API_KEY: "",
    E2E_BASE_URL: `http://localhost:${PORT}`,
  };
  let server: ReturnType<typeof spawn> | null = null;
  let status = 1;
  try {
    run("npm", ["run", "db:seed"], { ...env, ALLOW_DEV_SEED: "1" }, "db:seed");
    server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
      env,
      shell: process.platform === "win32",
      stdio: "ignore",
    });
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        const res = await fetch(`http://localhost:${PORT}/api/health/db`);
        if (res.ok) break;
      } catch {
        // todavía arrancando
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
      env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    status = result.status ?? 1;
  } finally {
    if (server?.pid) {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
      else server.kill("SIGTERM");
    }
    await app.dispose();
  }
  process.exit(status);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
