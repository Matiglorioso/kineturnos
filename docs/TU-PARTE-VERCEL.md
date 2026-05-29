# Desplegar KineTurnos en Vercel con Neon (5 minutos)

La app ya persiste **pacientes, profesionales y turnos** en PostgreSQL. Para que la demo en **kineturnos.vercel.app** use la misma base, solo falta agregar `DATABASE_URL` en Vercel y redeployar.

---

## Requisitos previos

- Proyecto **Neon** creado y con tablas cargadas (`npm run db:push` + `npm run db:seed` desde tu PC)
- Proyecto **Vercel** vinculado al repo [github.com/Matiglorioso/kineturnos](https://github.com/Matiglorioso/kineturnos)
- En local, `http://localhost:3000/api/health/db` responde `{ "ok": true }`

---

## Paso 1 — Connection string Pooled de Neon

1. Entrá a [console.neon.tech](https://console.neon.tech)
2. Proyecto **kineturnos** → **Connect**
3. Elegí:
   - **Connection type:** `Pooled` (importante para serverless / Vercel)
   - **Branch:** `main`
4. Copiá la URL que empieza con:

   ```
   postgresql://usuario:password@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

> Usá **Pooled**, no Direct. Vercel ejecuta funciones serverless; el pooler de Neon evita agotar conexiones.

---

## Paso 2 — Variable en Vercel

1. [vercel.com/dashboard](https://vercel.com/dashboard) → proyecto **kineturnos**
2. **Settings** → **Environment Variables**
3. Agregar:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | URL **Pooled** de Neon (paso 1) |
   | `NEXT_PUBLIC_SITE_URL` | `https://kineturnos.vercel.app` |

4. Marcá los tres entornos: **Production**, **Preview**, **Development**
5. **Save**

---

## Paso 3 — Redeploy

1. Pestaña **Deployments**
2. En el último deploy → menú **⋯** → **Redeploy**
3. Esperá a que termine el build (incluye `prisma generate` vía `postinstall`)

---

## Paso 4 — Verificar producción

Reemplazá el dominio si usás otro:

| URL | Resultado esperado |
|-----|-------------------|
| `https://kineturnos.vercel.app/api/health/db` | `{ "ok": true, ... }` |
| `https://kineturnos.vercel.app/api/patients` | JSON con lista de pacientes |
| `https://kineturnos.vercel.app/api/professionals` | JSON con profesionales |
| `https://kineturnos.vercel.app/api/appointments` | JSON con turnos |
| `https://kineturnos.vercel.app/pacientes` | UI carga pacientes del seed |

Si `/api/health/db` falla con 503, revisá que `DATABASE_URL` esté bien pegada (sin espacios) y que sea la URL **Pooled**.

---

## Verificación automática (local)

Con el servidor corriendo (`npm run dev`):

```powershell
npm.cmd run verify:migration
```

Opcional, contra otro puerto:

```powershell
$env:VERIFY_BASE_URL='http://localhost:3001'; npm.cmd run verify:migration
```

El script prueba integridad de DB, CRUD de pacientes/profesionales, validaciones de DNI/matrícula y turnos (incluido solapamiento).

---

## Integración Neon ↔ Vercel (alternativa)

Neon ofrece integración directa con Vercel que crea la variable automáticamente:

1. Neon dashboard → **Integrations** → **Vercel**
2. Conectá tu cuenta y el proyecto
3. Redeploy en Vercel

Documentación: [neon.tech/docs/guides/vercel](https://neon.tech/docs/guides/vercel)

---

## Seguridad

- **No subas** `.env` ni la connection string al repo
- **No compartas** la URL por chat (incluye contraseña)
- Rotá la contraseña en Neon si se expuso accidentalmente

---

## Si algo falla

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| 503 en `/api/*` | Falta `DATABASE_URL` en Vercel | Agregar variable y redeploy |
| Tablas vacías | Seed no corrido en Neon | `npm run db:push` + `db:seed` local con la misma URL |
| Build falla en Prisma | Cliente no generado | Revisar logs; `postinstall` debe ejecutar `prisma generate` |
| Datos viejos / distintos | Otra DB o branch de Neon | Confirmar que local y Vercel usan el mismo proyecto Neon |

Copiame el **mensaje de error** (sin la URL completa) si necesitás ayuda.
