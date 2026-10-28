/**
 * Base descartable + app compilada para producción, para las pruebas de
 * rendimiento y las capturas de pantalla. Crea una base nueva en el servidor de
 * DATABASE_URL (.env.local, la rama de pruebas de Neon), la migra y la borra al
 * terminar; la app corre con `next start` en un puerto aparte, compilada en
 * `.next-perf` para no pisar el `.next` de `next dev`.
 */
import { PrismaClient } from "@prisma/client";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";

export const DIST_DIR = ".next-perf";

export function run(command: string, args: string[], env: NodeJS.ProcessEnv, label: string) {
  const result = spawnSync(command, args, {
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 600_000,
  });
  if (result.status !== 0) throw new Error(`${label} falló:\n${result.stdout}\n${result.stderr}`);
}

export interface ScratchApp {
  baseUrl: string;
  databaseUrl: string;
  /** Cliente de Prisma sobre la base descartable. */
  db: PrismaClient;
  /** Compila (salvo `skipBuild`) y levanta la app contra la base descartable. */
  start(options?: { skipBuild?: boolean }): Promise<void>;
  /** Para la app y borra la base. */
  dispose(): Promise<void>;
}

export async function createScratchApp(prefix: string, port: number): Promise<ScratchApp> {
  process.loadEnvFile?.(".env.local");
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error("Falta DATABASE_URL (.env.local).");

  // Neon tarda unos segundos en reactivarse después de un rato sin uso: el
  // timeout de conexión por defecto de Prisma (5 s) no alcanza.
  const serverUrl = new URL(baseUrl);
  if (!serverUrl.searchParams.has("connect_timeout")) serverUrl.searchParams.set("connect_timeout", "20");

  const name = `${prefix}_${Date.now()}`;
  const pooled = new URL(serverUrl.toString());
  pooled.pathname = `/${name}`;
  const direct = new URL(pooled.toString());
  direct.hostname = direct.hostname.replace("-pooler", "");

  const admin = new PrismaClient({ datasourceUrl: serverUrl.toString() });
  console.log(`Base descartable: ${name}`);
  await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  run("npx", ["prisma", "migrate", "deploy"], { ...process.env, DATABASE_URL: direct.toString() }, "migrate deploy");

  const db = new PrismaClient({ datasources: { db: { url: pooled.toString() } } });
  let server: ChildProcess | null = null;
  const appUrl = `http://localhost:${port}`;

  return {
    baseUrl: appUrl,
    databaseUrl: pooled.toString(),
    db,
    async start(options = {}) {
      const env = {
        ...process.env,
        DATABASE_URL: pooled.toString(),
        NEXT_DIST_DIR: DIST_DIR,
        BREVO_API_KEY: "",
        NODE_ENV: "production" as const,
      };
      if (!options.skipBuild) {
        console.log("Compilando para producción…");
        run("npx", ["next", "build"], env, "next build");
      }
      server = spawn("npx", ["next", "start", "-p", String(port)], {
        env,
        shell: process.platform === "win32",
        stdio: "ignore",
      });
      for (let attempt = 0; attempt < 120; attempt += 1) {
        try {
          if ((await fetch(`${appUrl}/login`)).ok) return;
        } catch {
          // todavía arrancando
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error(`La app no respondió en el puerto ${port}.`);
    },
    async dispose() {
      if (server?.pid) {
        if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
        else server.kill("SIGTERM");
      }
      await db.$disconnect();
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.$disconnect();
      console.log(`Base ${name} borrada.`);
    },
  };
}
