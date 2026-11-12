/**
 * Levanta la app en modo desarrollo sobre una base descartable con los datos de
 * demostración (los mismos de las capturas), para revisar y pulir la interfaz.
 *
 *   npm run demo          # http://localhost:3300 · Ctrl+C para cortar (borra la base)
 *
 * Usuarios: los de scripts/screenshots/demo-data.ts, con la contraseña de los seeds
 * (SEED_INITIAL_PASSWORD o demo1234). Usa la rama de pruebas de Neon (DATABASE_URL
 * de .env.local), nunca la de producción.
 */
import { createScratchApp } from "../lib/scratch-app";
import { seedDemo } from "./demo-data";
import { spawn, spawnSync } from "node:child_process";

const PORT = 3300;

async function main() {
  const app = await createScratchApp("kineturnos_demo", PORT);
  const password = process.env.SEED_INITIAL_PASSWORD?.trim() || "demo1234";
  const demo = await seedDemo(app.db, password);
  await app.db.$disconnect();

  const server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, DATABASE_URL: app.databaseUrl, NEXT_DIST_DIR: ".next-demo", BREVO_API_KEY: "" },
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  console.log(`Demo en http://localhost:${PORT} · Administración: ${demo.adminEmail} · Profesional: ${demo.professionalEmail}`);

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    if (server.pid) {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
      else server.kill("SIGTERM");
    }
    await app.dispose();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  server.on("exit", stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
