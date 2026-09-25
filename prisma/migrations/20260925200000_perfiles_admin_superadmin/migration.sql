-- Perfiles como en la tesis: Recepción se unifica en Administrador y se
-- agrega Superadmin (acceso técnico del equipo de desarrollo).
UPDATE "usuarios" SET "rol" = 'admin' WHERE "rol" = 'recepcion';

ALTER TYPE "rol_usuario" RENAME TO "rol_usuario_old";
CREATE TYPE "rol_usuario" AS ENUM ('superadmin', 'admin', 'profesional');

ALTER TABLE "usuarios" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuarios"
  ALTER COLUMN "rol" TYPE "rol_usuario" USING ("rol"::text::"rol_usuario");
-- Por defecto el perfil con menos permisos.
ALTER TABLE "usuarios" ALTER COLUMN "rol" SET DEFAULT 'profesional';

DROP TYPE "rol_usuario_old";
