import type { DefaultSession } from "next-auth";
import type { RolUsuario } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RolUsuario;
      professionalId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: RolUsuario;
    professionalId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RolUsuario;
    professionalId: string | null;
  }
}
