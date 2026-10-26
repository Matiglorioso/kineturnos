import { prisma } from "@/lib/prisma";
import type { RolUsuario } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: RolUsuario;
  active: boolean;
  professionalId?: string | null;
  mustChangePassword: boolean;
};

export async function findAuthUserByEmail(
  email: string
): Promise<(AuthUser & { passwordHash: string }) | null> {
  const record = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!record) return null;

  return {
    id: record.id,
    email: record.email,
    name: record.nombre,
    role: record.rol,
    active: record.activo,
    professionalId: record.profesionalId,
    mustChangePassword: record.debeCambiarPassword,
    passwordHash: record.passwordHash,
  };
}
