import type { PrismaClient, RolUsuario } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

export type SeedUserInput = {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  profesionalId?: string | null;
};

/** Usuarios iniciales para Centro Kine Norte (go-live o desarrollo). */
export function getDefaultUsers(professionalId?: string | null): SeedUserInput[] {
  return [
    {
      id: "u-admin",
      email: "admin@kineturnos.local",
      nombre: "Carolina Viera",
      rol: "admin",
      profesionalId: null,
    },
    {
      id: "u-recepcion",
      email: "recepcion@kineturnos.local",
      nombre: "Laura Mendoza",
      rol: "recepcion",
      profesionalId: null,
    },
    {
      id: "u-profe",
      email: "profe@kineturnos.local",
      nombre: "Profesional del consultorio",
      rol: "profesional",
      profesionalId: professionalId ?? null,
    },
  ];
}

export async function clearAllTables(prisma: PrismaClient) {
  await prisma.turno.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profesional.deleteMany();
}

/** Evita `db:seed` con mocks en producción (Neon/Vercel). CI y local usan ALLOW_DEV_SEED o NODE_ENV≠production. */
export function ensureDevSeedAllowed() {
  if (process.env.ALLOW_DEV_SEED === "1") {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "El seed con mocks está deshabilitado en producción. Usá npm run db:seed:minimal con SEED_INITIAL_PASSWORD."
    );
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "No ejecutes db:seed en el entorno de producción de Vercel. Usá db:seed:minimal una sola vez desde tu PC contra Neon."
    );
  }
}

export async function seedUsers(
  prisma: PrismaClient,
  users: SeedUserInput[],
  plainPassword: string
) {
  const passwordHash = await hashPassword(plainPassword);

  for (const user of users) {
    await prisma.usuario.create({
      data: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        passwordHash,
        rol: user.rol,
        activo: true,
        profesionalId: user.profesionalId ?? null,
      },
    });
  }
}

export function resolveSeedPassword(options: {
  mode: "dev" | "minimal";
}): string {
  const fromEnv = process.env.SEED_INITIAL_PASSWORD?.trim();

  if (fromEnv) {
    if (fromEnv.length < 8) {
      throw new Error("SEED_INITIAL_PASSWORD debe tener al menos 8 caracteres.");
    }
    return fromEnv;
  }

  if (options.mode === "minimal") {
    throw new Error(
      "Definí SEED_INITIAL_PASSWORD en .env antes de correr db:seed:minimal (mín. 8 caracteres)."
    );
  }

  console.warn(
    "SEED_INITIAL_PASSWORD no definida; usando contraseña de desarrollo (demo1234)."
  );
  return "demo1234";
}
