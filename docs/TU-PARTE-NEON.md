# Lo que necesitás hacer vos (5 minutos)

El código ya está conectado a PostgreSQL. Solo falta **tu base Neon** en local y, para producción, **Vercel**.

## 1. Crear Neon (si aún no lo hiciste)

1. [https://neon.tech](https://neon.tech) → registrate con GitHub
2. **New Project** → nombre `kineturnos` → **Create**

## 2. Copiar la connection string

1. En Neon: **Connect** → **Connection string**
2. Copiá la URL completa (empieza con `postgresql://`)

## 3. Crear `.env` en tu PC

En la carpeta del proyecto, creá el archivo `.env`:

```env
DATABASE_URL="PEGÁ_ACÁ_LA_URL_DE_NEON"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

> Podés copiar la plantilla: renombrá `env.example` → `.env`

## 4. Ejecutar estos comandos

```powershell
cd C:\Users\matias.aliaga\kineturnos
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run dev
```

> **Windows / PowerShell:** si `npm run ...` falla, usá **`npm.cmd`**.

**Orden importante:** primero `db:push` (crea tablas), después `db:seed` (carga datos).

## 5. Probar en el navegador

| URL | Resultado esperado |
|-----|-------------------|
| http://localhost:3000/api/health/db | `{ "ok": true, ... }` |
| http://localhost:3000/api/patients | Lista JSON de pacientes |
| http://localhost:3000/api/professionals | Lista JSON de profesionales |
| http://localhost:3000/api/appointments | Lista JSON de turnos |
| http://localhost:3000/pacientes | UI con pacientes del seed |

## 6. Verificación automática

Con `npm run dev` activo, en otra terminal:

```powershell
npm.cmd run verify:migration
```

Debería terminar con **25 OK, 0 FAIL**.

## 7. Vercel (producción)

Guía detallada: **[`docs/TU-PARTE-VERCEL.md`](./TU-PARTE-VERCEL.md)**

Resumen:

1. Vercel → **kineturnos** → **Settings** → **Environment Variables**
2. `DATABASE_URL` = connection string **Pooled** de Neon
3. `NEXT_PUBLIC_SITE_URL` = `https://kineturnos.vercel.app`
4. **Redeploy**
5. Probar `https://kineturnos.vercel.app/api/health/db`

---

## Qué NO hace falta que me pases

**No me envíes la connection string por chat** (tiene tu contraseña).

Con que me digas *"listo, health/db responde ok en Vercel"* alcanza.

## Si algo falla

Copiame el **mensaje de error exacto** del terminal (sin la URL completa de la base).
