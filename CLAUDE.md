# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

KineTurnos: gestión de turnos para un consultorio de kinesiología. Next.js 15 (App Router) + React 19 + TypeScript, Prisma sobre PostgreSQL (Neon), Auth.js v5 (credenciales, JWT) y deploy en Vercel. Es el proyecto de tesis del autor: todo el producto (UI, mensajes, commits, PRs, docs) está en español rioplatense.

## Comandos

```bash
npm run dev            # next dev (puerto 3000)
npm run build          # next build (tipa también tests/ y e2e/)
npm run lint           # next lint
npx tsc --noEmit -p .  # chequeo de tipos rápido

npm test               # unitarios: node:test + tsx sobre src/lib/**/*.test.ts
npm run test:coverage  # cobertura de los unitarios con c8 (--all sobre src/lib; HTML en coverage/)
npm run test:int       # integración DB + API: tests/integration/*.int.test.ts
npm run test:e2e       # E2E Playwright: e2e/*.spec.ts (levanta npm run dev)

# Un solo archivo / un solo test
npx tsx --test src/lib/appointment-slots.test.ts
npx tsx --test --test-name-pattern="M3" src/lib/appointment-validation.test.ts
npx playwright test e2e/agenda.spec.ts -g "M2"

npm run db:migrate:deploy   # aplica migraciones
npm run db:seed             # mocks + usuarios demo (contraseña demo1234 si no hay SEED_INITIAL_PASSWORD)
npx prisma migrate dev --name <nombre>   # crear una migración nueva
```

- `test:int` y `test:e2e` necesitan una base **migrada y sembrada con `db:seed`**, y el primero además `npm run dev` corriendo con `VERIFY_SECRET` (bypass de auth solo fuera de producción). Crean y borran datos con ids `it-…` y usuarios de prueba: **nunca contra la base de producción**.
- Los unitarios que dependen de "hoy" inyectan `now`; `src/lib/date-utils.test.ts` fija `TZ=UTC` (como Vercel). Conviene correr también `TZ=UTC npm test`.
- Local: variables en `.env.local` (ignorado por git), ver `env.example`. Para iterar con base real se usa un branch descartable de Neon, no el de producción.

## Arquitectura

**Flujo de datos:** página (`src/app/*/page.tsx`, client components) → hook de dominio (`src/hooks/use-*.ts`) → cliente de API (`src/lib/api/*-client.ts`) → ruta REST (`src/app/api/**/route.ts`) → parser del body (`src/lib/api/parse-*-body.ts`) → capa DB (`src/lib/db/*.ts`, Prisma) → Postgres.

**Validación compartida cliente/servidor:** `src/lib/appointment-validation.ts` (`validateAppointmentForm`, `validateAppointmentStatusChange`) la usan tanto el formulario (`NewAppointmentDialog`) como la capa DB (`assertAppointmentInputValid`). Los parsers de la API validan formato y devuelven `{ error, field }`; solapamiento y agenda se validan en la capa DB con datos reales. Al editar, las opciones `previousDate` / `previousTime` / `previousProfessionalId` evitan revalidar un turno que no se mueve.

**Errores → HTTP** (`src/lib/api/handle-write-error.ts`): `ValidationError` 400, `ConflictError` (choque de horario) 409, `DuplicateFieldError` (DNI, matrícula) 409, `DeleteBlockedError` 409, `NotFoundError` 404; el resto, 503 genérico. Las respuestas de error incluyen `field` cuando aplica.

**Escrituras de turnos concurrentes:** `withAppointmentLocks` (`src/lib/db/appointments.ts`) toma advisory locks de Postgres por paciente y por profesional dentro de una transacción, y recién ahí valida y escribe. Además hay un índice único parcial por slot del profesional (migración SQL, Prisma no soporta índices parciales).

**Auth y permisos:** `src/middleware.ts` protege las páginas con el JWT (sin Prisma: corre en edge). En la API, `requireApiSession` / `requireApiPermission` (`src/lib/auth/require-session.ts`) revalidan el usuario contra la tabla `usuarios` en cada llamada (usuario desactivado → 401; el rol sale de la base, no del JWT). Perfiles (como en la tesis): `admin` (dueños y recepción: todo el consultorio), `profesional` (su agenda y asistencia) y `superadmin` (equipo de desarrollo: todo lo del admin). Matriz rol × permiso en `src/lib/auth/permissions.ts`. El rol `profesional` queda acotado a sus propios turnos (`getOwnProfessionalId`). `safeCallbackUrl` evita redirects externos después del login. Hay rate limit de login por email e IP persistido en `login_intentos`.

**Notificaciones por correo (RF05):** cada escritura de turno encola en la tabla `notificaciones`, **dentro de la misma transacción**, los correos que le corresponden (`getAppointmentNotificationEvents` en `src/lib/notifications/events.ts`: creación, confirmación, reprogramación, cancelación). Después de responder, `scheduleNotificationDispatch` los envía con `after()` vía Brevo (`src/lib/notifications/mailer.ts`). Los recordatorios los encola el cron `/api/cron/notificaciones` (GitHub Actions cada hora, `Authorization: Bearer CRON_SECRET`) para turnos activos que empiezan entre 2 y 24 h después; la `clave` única evita duplicados, y el mismo cron reintenta los fallidos (hasta 3 intentos). Sin `BREVO_API_KEY` no se envía nada: quedan `omitida` (así corren local, CI y previews).

**Sincronización desnormalizada:** los turnos guardan `paciente_nombre` y `profesional_nombre` (`src/lib/db/sync.ts` los propaga al renombrar). `pacientes.ultimo_turno` = último turno **atendido** con fecha ≤ hoy; se recalcula al escribir (`recomputePatientLastAppointment`) y al leer (`getPatientLastAppointmentDate`), con el mismo criterio.

## Reglas de dominio

- **Fechas** en la app y en la API: string `dd-MM-yyyy`; horas `HH:mm`. En la base son `DATE` / `TIME` (`src/lib/db/date-codec.ts` convierte). No comparar fechas como strings: usar `compareAppDates` / `areSameAppDay`.
- **"Hoy"** se calcula en `America/Argentina/Buenos_Aires` (`getTodayAppDate`, `getNowAppMinutes`), no con la hora del servidor (Vercel corre en UTC).
- **Turnos de 1 hora** y horario del consultorio común a todos los profesionales: `CLINIC_OPENING_TIME` / `CLINIC_CLOSING_TIME` en `src/lib/appointment-constants.ts` (08:00–18:00). Cada profesional solo define sus días de atención.
- **Estados** de turno: activos (`pendiente`, `confirmado`) y finales (`atendido`, `cancelado`, `ausente`). Solo se eliminan turnos finales; no se borra un paciente ni un profesional con turnos activos. `atendido`/`ausente` no se permiten en fechas futuras.

## Base de datos y deploy

- Esquema en `prisma/schema.prisma` (modelos en español vía `@map`). Cambios de esquema siempre con migración en `prisma/migrations/`.
- Vercel corre `prisma migrate deploy` **solo en producción** (`vercel.json`). Los previews **no migran**: un PR con migración necesita su propio branch de Neon migrado y una `DATABASE_URL` de Preview limitada a esa rama git; si no, el preview falla al escribir.
- `prisma migrate deploy` contra Neon va con el host **directo** (sin `-pooler`): el pooler no soporta los advisory locks de las migraciones.
- `db:seed` y `db:seed:minimal` abortan si la base tiene datos, salvo `--force` (`npx prisma db seed -- --force`, `npm run db:seed:minimal -- --force`). `db:seed:minimal` nunca borra datos: hace upsert de los usuarios iniciales.

## Tests y CI

- CI (`.github/workflows/ci.yml`) corre **solo en push a `main` y en PRs contra `main`**: lint, build, unitarios, *Verify DB + API* (Postgres efímero + `test:int`) y *E2E (Playwright)*. Un PR apilado sobre otra rama no dispara CI.
- Integración y E2E comparten fixtures (`tests/integration/helpers.ts`: `createProfessional`, `createPatient`, `createAppointmentInDb`, `createUser`, `cleanupTestData`). Los scripts destructivos (seeds, `purge-demo`) se prueban en una base descartable creada con `withScratchDatabase`.
- E2E: el setup inicia sesión por UI con cada rol y guarda la sesión en `e2e/.auth/`. Antes de interactuar con el login hay que llamar a `waitForLoginForm` (en frío, un click antes de la hidratación hace un submit nativo). Selectores por rol/label, no por clases.
- Convención para bugs: un commit "Test en rojo (…)" con el test que falla y otro "Fix (…)" con el arreglo, citando el id del hallazgo (A1–A4, M1–M9, B1–B9) del reporte de testing.

## Entorno Windows

- En PowerShell 5.1, `git commit -m` con comillas dobles dentro del mensaje rompe los argumentos: usar `git commit -F <archivo>` o un heredoc desde Git Bash.
- `tailwind.config.ts` debe usar `import` (no `require`): con Node 24 se carga como ES module.
