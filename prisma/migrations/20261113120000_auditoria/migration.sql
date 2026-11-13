-- CreateEnum
CREATE TYPE "accion_auditoria" AS ENUM ('alta', 'modificacion', 'baja', 'cambio_estado', 'ingreso', 'ingreso_fallido', 'cambio_password', 'restablecimiento_password');

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT,
    "usuario_nombre" TEXT NOT NULL,
    "usuario_rol" TEXT NOT NULL,
    "accion" "accion_auditoria" NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "registro" TEXT NOT NULL,
    "cambios" JSONB,
    "ip" TEXT,
    "navegador" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");


-- Inmutabilidad: el registro de auditoría no se puede modificar ni borrar
-- desde la aplicación (ni con TRUNCATE). Depurar registros viejos requiere
-- que el administrador de la base deshabilite el trigger a propósito.
CREATE FUNCTION "auditoria_inmutable"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'El registro de auditoría no se puede modificar ni borrar';
END;
$$;

CREATE TRIGGER "auditoria_sin_cambios"
BEFORE UPDATE OR DELETE ON "auditoria"
FOR EACH ROW EXECUTE FUNCTION "auditoria_inmutable"();

CREATE TRIGGER "auditoria_sin_truncate"
BEFORE TRUNCATE ON "auditoria"
FOR EACH STATEMENT EXECUTE FUNCTION "auditoria_inmutable"();
