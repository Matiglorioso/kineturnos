import { DuplicateFieldError, DeleteBlockedError, ValidationError, NotFoundError } from "@/lib/db/errors";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleWriteError(
  error: unknown,
  fallbackMessage: string
): NextResponse {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, field: error.field },
      { status: 400 }
    );
  }

  if (error instanceof DuplicateFieldError) {
    return NextResponse.json(
      { error: error.message, field: error.field },
      { status: 409 }
    );
  }

  if (error instanceof DeleteBlockedError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "El registro ya existe con esos datos unicos." },
      { status: 409 }
    );
  }

  console.error(fallbackMessage, error);

  return NextResponse.json({ error: fallbackMessage }, { status: 503 });
}
