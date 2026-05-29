import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireApiSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "No autorizado. Iniciá sesión." },
        { status: 401 }
      ),
    };
  }

  return { session, unauthorized: null };
}
