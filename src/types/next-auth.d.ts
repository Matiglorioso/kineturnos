import type { DefaultSession } from "next-auth";
import type { RolUsuario } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RolUsuario;
    } & DefaultSession["user"];
  }

  interface User {
    role: RolUsuario;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RolUsuario;
  }
}
