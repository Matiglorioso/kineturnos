-- Rate limiting de login: fallos por clave (email:<x> / ip:<y>) con ventana y bloqueo.
CREATE TABLE "login_intentos" (
    "clave" TEXT NOT NULL,
    "fallos" INTEGER NOT NULL DEFAULT 0,
    "ventana_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloqueado_hasta" TIMESTAMPTZ(6),

    CONSTRAINT "login_intentos_pkey" PRIMARY KEY ("clave")
);
