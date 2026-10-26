-- Gestión de usuarios: contraseña temporal con cambio obligatorio, último ingreso y fecha de alta.
ALTER TABLE "usuarios" ADD COLUMN "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN "ultimo_ingreso" TIMESTAMP(3);
ALTER TABLE "usuarios" ADD COLUMN "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
