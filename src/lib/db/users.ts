import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { newPasswordValidationError } from "@/lib/auth/password-policy";
import { generateTemporaryPassword } from "@/lib/auth/temporary-password";
import { DuplicateFieldError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import {
  canManageUser,
  DUPLICATE_EMAIL_MESSAGE,
  DUPLICATE_PROFESSIONAL_MESSAGE,
  normalizeEmail,
  selfEditError,
} from "@/lib/user-form";
import type { AppUser } from "@/types";
import type { Prisma, RolUsuario } from "@prisma/client";
import { randomUUID } from "node:crypto";

const userInclude = { profesional: { select: { nombre: true } } } satisfies Prisma.UsuarioInclude;
type UserRecord = Prisma.UsuarioGetPayload<{ include: typeof userInclude }>;

/** Nunca devuelve el hash de la contraseña. */
function mapUser(record: UserRecord): AppUser {
  return {
    id: record.id,
    name: record.nombre,
    email: record.email,
    role: record.rol,
    active: record.activo,
    professionalId: record.profesionalId,
    professionalName: record.profesional?.nombre ?? null,
    lastLogin: record.ultimoIngreso?.toISOString() ?? null,
    mustChangePassword: record.debeCambiarPassword,
    createdAt: record.creadoEn.toISOString(),
  };
}

export interface UserWriteInput {
  id?: string;
  name: string;
  email: string;
  role: RolUsuario;
  professionalId: string | null;
  active?: boolean;
}

/** Quién hace el cambio: define qué perfiles puede tocar y qué no puede hacerse a sí mismo. */
export interface UserActor {
  id: string;
  role: RolUsuario;
}

export async function getUsersFromDb(): Promise<AppUser[]> {
  const records = await prisma.usuario.findMany({
    include: userInclude,
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });
  return records.map(mapUser);
}

async function assertUserFieldsAvailable(input: UserWriteInput, excludeId?: string) {
  const sameEmail = await prisma.usuario.findUnique({ where: { email: normalizeEmail(input.email) } });
  if (sameEmail && sameEmail.id !== excludeId) {
    throw new DuplicateFieldError("email", DUPLICATE_EMAIL_MESSAGE);
  }

  if (input.professionalId) {
    const professional = await prisma.profesional.findUnique({
      where: { id: input.professionalId },
      include: { usuario: { select: { id: true } } },
    });
    if (!professional) throw new ValidationError("El profesional no existe", "professionalId");
    if (professional.usuario && professional.usuario.id !== excludeId) {
      throw new DuplicateFieldError("professionalId", DUPLICATE_PROFESSIONAL_MESSAGE);
    }
  }
}

function writeData(input: UserWriteInput) {
  return {
    nombre: input.name.trim(),
    email: normalizeEmail(input.email),
    rol: input.role,
    // Solo el perfil Profesional queda vinculado a un profesional (su agenda).
    profesionalId: input.role === "profesional" ? input.professionalId : null,
  };
}

function assertCanAssign(actor: UserActor, role: RolUsuario) {
  if (!canManageUser(actor.role, { role })) {
    throw new ForbiddenError("Solo un Superadmin puede gestionar usuarios Superadmin.");
  }
}

/** Alta con contraseña temporal: se devuelve una sola vez para entregársela a la persona. */
export async function createUserInDb(
  actor: UserActor,
  input: UserWriteInput
): Promise<{ user: AppUser; temporaryPassword: string }> {
  assertCanAssign(actor, input.role);
  await assertUserFieldsAvailable(input);

  const temporaryPassword = generateTemporaryPassword();
  const record = await prisma.usuario.create({
    data: {
      id: input.id?.trim() || `u-${randomUUID()}`,
      ...writeData(input),
      passwordHash: await hashPassword(temporaryPassword),
      debeCambiarPassword: true,
    },
    include: userInclude,
  });

  return { user: mapUser(record), temporaryPassword };
}

async function getManageableUser(actor: UserActor, id: string) {
  const existing = await prisma.usuario.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Usuario no encontrado.");
  assertCanAssign(actor, existing.rol);
  return existing;
}

export async function updateUserInDb(actor: UserActor, id: string, input: UserWriteInput): Promise<AppUser> {
  const existing = await getManageableUser(actor, id);
  assertCanAssign(actor, input.role);

  const selfError = selfEditError(actor.id, { id, role: existing.rol }, { role: input.role, active: input.active });
  if (selfError) throw new ValidationError(selfError, input.active === false ? "active" : "role");

  await assertUserFieldsAvailable(input, id);

  const record = await prisma.usuario.update({
    where: { id },
    data: { ...writeData(input), ...(input.active === undefined ? {} : { activo: input.active }) },
    include: userInclude,
  });
  return mapUser(record);
}

/** Nueva contraseña temporal; la anterior deja de servir y al ingresar tiene que cambiarla. */
export async function resetUserPasswordInDb(
  actor: UserActor,
  id: string
): Promise<{ user: AppUser; temporaryPassword: string }> {
  await getManageableUser(actor, id);
  if (actor.id === id) {
    throw new ValidationError("Para tu propia contraseña usá \"Cambiar contraseña\" en tu perfil.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const record = await prisma.usuario.update({
    where: { id },
    data: { passwordHash: await hashPassword(temporaryPassword), debeCambiarPassword: true },
    include: userInclude,
  });
  return { user: mapUser(record), temporaryPassword };
}

/** Cambio de la propia contraseña: pide la actual (o la temporal) y quita la obligación de cambiarla. */
export async function changeOwnPasswordInDb(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const record = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!record) throw new NotFoundError("Usuario no encontrado.");

  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    throw new ValidationError("La contraseña actual no es correcta", "currentPassword");
  }

  const policyError = newPasswordValidationError(newPassword);
  if (policyError) throw new ValidationError(policyError, "newPassword");
  if (newPassword === currentPassword) {
    throw new ValidationError("La nueva contraseña tiene que ser distinta de la actual", "newPassword");
  }

  await prisma.usuario.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword), debeCambiarPassword: false },
  });
}

export async function recordLoginInDb(userId: string, now = new Date()): Promise<void> {
  await prisma.usuario.update({ where: { id: userId }, data: { ultimoIngreso: now } });
}
