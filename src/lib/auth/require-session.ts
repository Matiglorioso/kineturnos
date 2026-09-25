import { auth } from "@/auth";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { hasVerifyBypass } from "@/lib/auth/route-access";
import { prisma } from "@/lib/prisma";
import type { RolUsuario } from "@prisma/client";
import { NextResponse } from "next/server";

export type ApiSessionUser = {
  id: string;
  role: RolUsuario;
  professionalId: string | null;
  name?: string | null;
  email?: string | null;
};

type SessionOk = {
  session: { user: ApiSessionUser };
  unauthorized: null;
};

type SessionFail = {
  session: null;
  unauthorized: NextResponse;
};

export async function requireApiSession(
  request?: Request
): Promise<SessionOk | SessionFail> {
  if (request) {
    const pathname = new URL(request.url).pathname;
    if (hasVerifyBypass(request, pathname)) {
      return {
        session: {
          user: {
            id: "verify-bypass",
            role: "admin",
            professionalId: null,
            name: "Verify Bypass",
            email: null,
          },
        },
        unauthorized: null,
      };
    }
  }

  const session = await auth();

  if (!session?.user?.id) {
    return unauthorizedResult();
  }

  // El JWT dura días: rol, vínculo y estado activo se leen de la base en cada
  // llamada, para que desactivar o cambiar el rol de un usuario tenga efecto ya.
  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { rol: true, activo: true, profesionalId: true },
  });

  if (!user || !user.activo) {
    return unauthorizedResult();
  }

  return {
    session: {
      user: {
        id: session.user.id,
        role: user.rol,
        professionalId: user.profesionalId,
        name: session.user.name,
        email: session.user.email,
      },
    },
    unauthorized: null,
  };
}

function unauthorizedResult(): SessionFail {
  return {
    session: null,
    unauthorized: NextResponse.json(
      { error: "No autorizado. Iniciá sesión." },
      { status: 401 }
    ),
  };
}

export async function requireApiPermission(
  request: Request,
  permission: Permission
): Promise<SessionOk | SessionFail> {
  const result = await requireApiSession(request);

  if (result.unauthorized) {
    return result;
  }

  if (!hasPermission(result.session.user.role, permission)) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "No tenés permiso para esta acción." },
        { status: 403 }
      ),
    };
  }

  return result;
}

/** Para rol profesional, fuerza el id vinculado; null si no hay vínculo. */
export function getOwnProfessionalId(
  user: ApiSessionUser
): string | null {
  if (user.role !== "profesional") return null;
  return user.professionalId;
}

export function forbiddenResponse(message = "No tenés permiso para esta acción.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
