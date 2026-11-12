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

**Escrituras de turnos concurrentes:** `withAppointmentLocks` (`src/lib/db/locks.ts`) toma advisory locks de Postgres por paciente y por profesional dentro de una transacción, y recién ahí valida y escribe. Además hay un índice único parcial por slot del profesional (migración SQL, Prisma no soporta índices parciales).

**Auth y permisos:** `src/middleware.ts` protege las páginas con el JWT (sin Prisma: corre en edge). En la API, `requireApiSession` / `requireApiPermission` (`src/lib/auth/require-session.ts`) revalidan el usuario contra la tabla `usuarios` en cada llamada (usuario desactivado → 401; el rol sale de la base, no del JWT). Perfiles (como en la tesis): `admin` (dueños y recepción: todo el consultorio), `profesional` (su agenda y asistencia) y `superadmin` (equipo de desarrollo: todo lo del admin). Matriz rol × permiso en `src/lib/auth/permissions.ts`. El rol `profesional` queda acotado a sus propios turnos (`getOwnProfessionalId`). `safeCallbackUrl` evita redirects externos después del login. Hay rate limit de login por email e IP persistido en `login_intentos`.

**Notificaciones por correo (RF05):** cada escritura de turno encola en la tabla `notificaciones`, **dentro de la misma transacción**, los correos que le corresponden (`getAppointmentNotificationEvents` en `src/lib/notifications/events.ts`: creación, confirmación, reprogramación, cancelación). Después de responder, `scheduleNotificationDispatch` los envía con `after()` vía Brevo (`src/lib/notifications/mailer.ts`). Los recordatorios los encola el cron `/api/cron/notificaciones` (GitHub Actions cada hora, `Authorization: Bearer CRON_SECRET`) para turnos activos que empiezan entre 2 y 24 h después, salvo que se hayan agendado o reprogramado con menos de 24 h de anticipación (ya recibieron ese correo); la `clave` única evita duplicados, y el mismo cron reintenta los fallidos (hasta 3 intentos). Sin `BREVO_API_KEY` no se envía nada: quedan `omitida` (así corren local, CI y previews).

**Historia clínica (RF11-RF13):** tabla `historia_clinica`, un registro por sesión (evolución obligatoria; diagnóstico y plan opcionales, la pantalla muestra los vigentes con `getClinicalSummary`), opcionalmente vinculado a un turno (uno por turno, ya ocurrido, no cancelado/ausente). Acceso: el Administrador a todas; el Profesional solo si tiene o tuvo un turno no cancelado con el paciente (`hasClinicalAccess` en `src/lib/db/clinical-history.ts`, permisos `clinical:*`). Solo el autor corrige un registro, dentro de las 24 h (`canEditClinicalEntry`). Cada lectura, alta y corrección queda en `accesos_historia_clinica` (RNF07), visible solo para Administración. Un paciente con historia clínica no se puede eliminar (`onDelete: Restrict`): se desactiva. Además, por paciente: `fichas_clinicas` (alertas, una por renglón, y antecedentes) y `objetivos_tratamiento` (checklist), con el mismo acceso y trazabilidad. Página: `/pacientes/[id]/historia` (encabezado con alertas, línea de tiempo con número de sesión y filtro por profesional, panel con diagnóstico, plan, objetivos y antecedentes, "Nueva evolución" en un panel lateral, vista de impresión), con acceso desde la lista de pacientes, la ficha y el menú de cada turno (`?turno=` abre el alta con ese turno).

**Obras sociales (RF07, RF14, RF15):** catálogo `obras_sociales` (nombre único normalizado con `normalizeInsuranceName`; "Particular" = sin obra social). El paciente tiene `obra_social_id`, `nro_afiliado` y `plan_obra_social`, y conserva `obra_social` (nombre) desnormalizado para listar y buscar; renombrar en el catálogo lo actualiza. `autorizaciones`: cantidad de sesiones, `fecha_desde`, vencimiento opcional y estado (pendiente, aprobada, rechazada). Cada turno que pasa a **atendido** se vincula (`turnos.autorizacion_id`) a la autorización aprobada vigente que vence primero (`pickAuthorizationForSession`, en `assignSessionForAppointment` dentro de la transacción del turno); crear, editar o borrar una autorización reasigna las sesiones atendidas sin autorización del período, con el lock del paciente (`src/lib/db/locks.ts`). `getCoverageStatus` / `summarizeCoverage` calculan el aviso (no bloquea) que se ve en la lista de pacientes, la ficha, el formulario de turno y la historia clínica. La planilla mensual por obra social sale de `getAttendanceReportFromDb`. Página `/obras-sociales` (solo Administración): catálogo y planilla.

**Indicadores del panel (RF16):** `src/lib/dashboard-indicators.ts` calcula todo del lado del cliente sobre los turnos ya cargados (el rol Profesional recibe solo los suyos): rango del período elegido y el anterior equivalente (`getPeriodRange`, `getPreviousRange`), tasa de cancelación = cancelados / turnos del período, tasa de ausentismo = ausentes / (atendidos + ausentes), evolución por día/semana/mes, turnos por profesional y sesiones atendidas por obra social. Los gráficos son barras CSS (sin librería de gráficos). Componente: `PeriodIndicators`. El resto del panel (`src/app/page.tsx`): accesos rápidos según `canAccessPage`, y "Hoy"/"Para hacer" con `src/lib/dashboard-today.ts` (asistencia por registrar = turnos activos ya terminados de los últimos 30 días; por confirmar = pendientes del próximo día hábil), con acciones que llaman a `updateAppointmentStatus`. `/pacientes?nuevo=1` y `/agenda?nuevo=1` abren el alta.

**Usuarios y contraseñas:** página `/usuarios` (permiso `users:manage`, solo Administración). Alta y restablecimiento generan una contraseña temporal (`generateTemporaryPassword`, solo servidor) que la API devuelve una única vez, y marcan `usuarios.debe_cambiar_password`. Con esa marca, el middleware lleva cualquier página a `/cambiar-contrasena` (el JWT trae `mustChangePassword`; después del cambio se limpia con `update()`), y `requireApiSession` responde 403 a todo salvo `POST /api/account/password` (`allowPendingPasswordChange`), leyendo la marca de la base. Reglas en `src/lib/user-form.ts`: solo un Superadmin asigna o gestiona Superadmin (`canManageUser`), nadie se desactiva ni se cambia el perfil a sí mismo (`selfEditError`), el perfil Profesional exige un profesional sin otro usuario. Los usuarios no se borran: se desactivan. `ultimo_ingreso` se registra en `authorize`. Política de contraseñas en `src/lib/auth/password-policy.ts` (8+ caracteres, letras y números).

**Agenda por profesional (RF03):** tercera vista de `/agenda` (solo Administración; el Profesional ya ve solo la suya). `buildProfessionalDayGrid` (`src/lib/agenda-professionals.ts`) arma una columna por profesional activo que atiende ese día (más cualquiera con turnos visibles ese día) y una celda por bloque de 1 h: `turnos` (con los filtros aplicados; los cancelados solo si se filtra por ese estado), `libre` (según `listHourlySlotOptions` sobre todos los turnos), `ocupado` u `pasado`. Un hueco libre abre `NewAppointmentDialog` con `defaultProfessionalId`/`defaultTime`. En celular (`AgendaProfessionalsView`), pestañas con un profesional a la vez.

**Listas paginadas:** las listas se cargan enteras y se paginan en el cliente con `usePagination` (`src/hooks/use-pagination.ts`, lógica en `src/lib/pagination.ts`) y el pie `ListPagination`: 10 por página por defecto (10/25/50/100, recordado por lista en `localStorage`) y vuelta a la página 1 al cambiar búsqueda o filtros (`resetKey`). Con 10 o menos no se muestra. La planilla de asistencia pagina en pantalla pero imprime completa. Las vistas de calendario (semana, por profesional) no se paginan.

**Sincronización desnormalizada:** los turnos guardan `paciente_nombre` y `profesional_nombre` (`src/lib/db/sync.ts` los propaga al renombrar). `pacientes.ultimo_turno` = último turno **atendido** con fecha ≤ hoy; se recalcula al escribir (`recomputePatientLastAppointment`) y al leer (`getPatientLastAppointmentDate`), con el mismo criterio.

## Reglas de dominio

- **Fechas** en la app y en la API: string `dd-MM-yyyy`; horas `HH:mm`. En la base son `DATE` / `TIME` (`src/lib/db/date-codec.ts` convierte). No comparar fechas como strings: usar `compareAppDates` / `areSameAppDay`.
- **Paciente (RF08):** DNI obligatorio y único; CUIL y fecha de nacimiento opcionales (los pacientes ya cargados no los tienen). El CUIL se guarda sin guiones y se valida en `cuilFormatValidationError` (prefijo de persona, dígito verificador módulo 11 y que el DNI coincida); la fecha de nacimiento acepta `/` o `.` y no puede ser futura (`src/lib/birth-date.ts`, que también calcula la edad).
- **"Hoy"** se calcula en `America/Argentina/Buenos_Aires` (`getTodayAppDate`, `getNowAppMinutes`), no con la hora del servidor (Vercel corre en UTC).
- **Turnos de 1 hora** y horario del consultorio común a todos los profesionales: `CLINIC_OPENING_TIME` / `CLINIC_CLOSING_TIME` en `src/lib/appointment-constants.ts` (08:00–18:00). Cada profesional solo define sus días de atención.
- **Estados** de turno: activos (`pendiente`, `confirmado`) y finales (`atendido`, `cancelado`, `ausente`). Solo se eliminan turnos finales; no se borra un paciente ni un profesional con turnos activos. `atendido`/`ausente` no se permiten en fechas futuras.

## Base de datos y deploy

- Esquema en `prisma/schema.prisma` (modelos en español vía `@map`). Cambios de esquema siempre con migración en `prisma/migrations/`.
- Vercel corre `prisma migrate deploy` **solo en producción** (`vercel.json`). Los previews **no migran**: un PR con migración necesita su propio branch de Neon migrado y una `DATABASE_URL` de Preview limitada a esa rama git; si no, el preview falla al escribir.
- `prisma migrate deploy` contra Neon va con el host **directo** (sin `-pooler`): el pooler no soporta los advisory locks de las migraciones.
- `db:seed` y `db:seed:minimal` abortan si la base tiene datos, salvo `--force` (`npx prisma db seed -- --force`, `npm run db:seed:minimal -- --force`). `db:seed:minimal` nunca borra datos: hace upsert de los usuarios iniciales.

## Tests y CI

- **Rendimiento (RNF03, RNF04):** `npm run perf` (`scripts/perf/`) crea una base descartable en el servidor de `DATABASE_URL`, carga ~6.600 turnos, compila en `.next-perf` (`NEXT_DIST_DIR`) y mide API y pantallas; resultados en `docs/RENDIMIENTO.md`. No traer "todos los turnos" en caminos calientes: la validación de solapamientos usa solo los del día del profesional o paciente, y el último turno de la lista de pacientes sale de un `groupBy`. Producción corre en `gru1` (`vercel.json`), al lado de Neon `sa-east-1`.
- **Respaldos (RNF09):** `.github/workflows/respaldo.yml` corre todos los días `scripts/respaldo/respaldar.sh` (pg_dump 17 por Docker, gzip y gpg AES-256 con `BACKUP_PASSPHRASE`) sobre `BACKUP_DATABASE_URL` (rol de solo lectura) y lo guarda 14 días como artifact `respaldo-<fecha>-<hash>`; si el hash no cambió y el último tiene menos de 7 días, no guarda otro. El job de CI *Respaldo y restauración* prueba respaldar, cifrar y restaurar (`restaurar.sh`, solo en una base vacía). Ver `docs/RESPALDOS.md`.
- **Disponibilidad (RNF08):** `.github/workflows/disponibilidad.yml` consulta cada 15 min `/login` y `/api/health/db` en `APP_URL` (3 intentos por la reactivación de Neon); `npm run disponibilidad` calcula el porcentaje con el historial de Actions (necesita `gh`). Ver `docs/DISPONIBILIDAD.md`.
- CI (`.github/workflows/ci.yml`) corre **solo en push a `main` y en PRs contra `main`**: lint, build, unitarios, *Verify DB + API* (Postgres efímero + `test:int`), *E2E (Playwright)* y *Respaldo y restauración*. Un PR apilado sobre otra rama no dispara CI.
- Integración y E2E comparten fixtures (`tests/integration/helpers.ts`: `createProfessional`, `createPatient`, `createAppointmentInDb`, `createUser`, `cleanupTestData`). Los scripts destructivos (seeds, `purge-demo`) se prueban en una base descartable creada con `withScratchDatabase`.
- E2E: el setup inicia sesión por UI con cada rol y guarda la sesión en `e2e/.auth/`. Antes de interactuar con el login hay que llamar a `waitForLoginForm` (en frío, un click antes de la hidratación hace un submit nativo). Selectores por rol/label, no por clases.
- Convención para bugs: un commit "Test en rojo (…)" con el test que falla y otro "Fix (…)" con el arreglo, citando el id del hallazgo (A1–A4, M1–M9, B1–B9) del reporte de testing.

## Entorno Windows

- En PowerShell 5.1, `git commit -m` con comillas dobles dentro del mensaje rompe los argumentos: usar `git commit -F <archivo>` o un heredoc desde Git Bash.
- `tailwind.config.ts` debe usar `import` (no `require`): con Node 24 se carga como ES module.
