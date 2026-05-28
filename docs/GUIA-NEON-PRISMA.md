# Guía: Neon + Prisma + PostgreSQL para KineTurnos

Esta guía te lleva de cero a tener la base de datos conectada.  
**La app sigue usando `localStorage` por ahora**; este paso prepara Postgres. Después conectaremos las pantallas a la DB.

---

## Resumen rápido

1. Crear cuenta y proyecto en **Neon**
2. Copiar la **connection string**
3. Crear archivo **`.env`** local con `DATABASE_URL`
4. Ejecutar **`npm run db:push`** (crea tablas)
5. Ejecutar **`npm run db:seed`** (carga datos de demo)
6. Probar **`http://localhost:3000/api/health/db`**
7. (Opcional) Agregar `DATABASE_URL` en **Vercel**

---

## Paso 1 — Crear cuenta en Neon

1. Entrá a [https://neon.tech](https://neon.tech)
2. Registrate con **GitHub** (recomendado) o email
3. En el dashboard, clic en **New Project**
4. Configuración sugerida:
   - **Project name:** `kineturnos`
   - **Region:** la más cercana (ej. `South America` si está disponible, o `US East`)
   - **Postgres version:** la default (16+)
5. Clic en **Create project**

---

## Paso 2 — Obtener la connection string

1. En tu proyecto Neon, andá a **Dashboard**
2. Buscá **Connection string** (o **Connect**)
3. Elegí:
   - **Branch:** `main`
   - **Database:** `neondb` (default)
   - **Role:** el que venga por defecto
4. Copiá la URL que empieza con:

   ```
   postgresql://usuario:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### ¿Pooled o Direct?

| Tipo | Cuándo usarlo |
|------|----------------|
| **Pooled** (`-pooler` en el host) | **Vercel / producción** — recomendado |
| **Direct** | Migraciones locales (`db:push`, `db:migrate`) |

Para empezar en local, cualquiera de las dos funciona. Si una falla, probá la otra.

---

## Paso 3 — Crear el archivo `.env` local

En la **raíz del proyecto** (`kineturnos/`), creá un archivo llamado `.env` (sin extensión extra).

Contenido:

```env
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Reemplazá la URL por la que copiaste de Neon.

> **Importante:** `.env` **no se sube a GitHub** (está en `.gitignore`). Nunca pegues la URL con contraseña en el README ni en commits.

---

## Paso 4 — Crear las tablas en Postgres

Abrí una terminal en la carpeta del proyecto y ejecutá:

```bash
npm run db:push
```

Qué hace:
- Lee `prisma/schema.prisma`
- Crea en Neon las tablas: `Patient`, `Professional`, `Appointment`

Si ves **"Your database is now in sync"**, ¡listo!

### Si hay error

| Error | Solución |
|-------|----------|
| `Environment variable not found: DATABASE_URL` | Falta el `.env` o está mal escrito el nombre |
| `Can't reach database server` | Revisá internet, URL, o probá connection string **Direct** |
| `password authentication failed` | Volvé a copiar la URL desde Neon (regenerá password si hace falta) |

---

## Paso 5 — Cargar datos de demo (seed)

```bash
npm run db:seed
```

Deberías ver algo como:

```
Seed completado: { professionals: 3, patients: 8, appointments: 12 }
```

---

## Paso 6 — Verificar que funciona

1. Arrancá la app:

   ```bash
   npm run dev
   ```

2. Abrí en el navegador:

   ```
   http://localhost:3000/api/health/db
   ```

3. Respuesta esperada:

   ```json
   { "ok": true, "message": "Conexión a PostgreSQL (Neon) exitosa" }
   ```

### Ver datos con interfaz gráfica (opcional)

```bash
npm run db:studio
```

Se abre **Prisma Studio** en el navegador para ver/editar tablas como una planilla.

---

## Paso 7 — Conectar Vercel (producción)

1. Entrá a [vercel.com](https://vercel.com) → tu proyecto **kineturnos**
2. **Settings** → **Environment Variables**
3. Agregá:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Connection string **Pooled** de Neon |

4. Marcá **Production**, **Preview** y **Development**
5. **Save** y hacé **Redeploy**

En el build, `postinstall` ejecuta `prisma generate` automáticamente.

Para aplicar tablas en producción (cuando uses migraciones):

```bash
npx prisma migrate deploy
```

Por ahora, con `db:push` local alcanza para desarrollo. En producción podés correr `db:push` una vez desde tu máquina apuntando a la URL de Neon, o pasar a migraciones formales.

---

## Scripts útiles

| Comando | Qué hace |
|---------|----------|
| `npm run db:generate` | Regenera el cliente Prisma |
| `npm run db:push` | Sincroniza schema → DB (sin archivos de migración) |
| `npm run db:migrate` | Crea migración versionada (recomendado a futuro) |
| `npm run db:seed` | Carga mocks en la DB |
| `npm run db:studio` | UI para ver la base de datos |

---

## Estructura agregada al proyecto

```
prisma/
  schema.prisma    # Modelos: Patient, Professional, Appointment
  seed.ts          # Datos iniciales desde mocks
src/
  lib/
    prisma.ts      # Cliente Prisma (singleton)
    db-health.ts   # Chequeo de conexión
  app/api/health/db/route.ts   # GET para probar conexión
```

---

## ¿Qué sigue después de esto?

La app **todavía guarda en `localStorage`**. El próximo paso de desarrollo sería:

1. Crear **Server Actions** o **API routes** (`/api/patients`, etc.)
2. Reemplazar `usePersistedPatients` por fetch a la DB
3. Mantener validaciones en `src/lib/` como ahora

Cuando quieras, podemos hacer esa migración módulo por módulo (pacientes primero, etc.).

---

## Ayuda rápida

- Documentación Neon: [neon.tech/docs](https://neon.tech/docs)
- Documentación Prisma: [prisma.io/docs](https://www.prisma.io/docs)
- Integración Vercel + Neon: [neon.tech/docs/guides/vercel](https://neon.tech/docs/guides/vercel)
