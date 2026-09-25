# CI y verificaciones automáticas

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/ci.yml`) que corre en cada push y pull request a `main`.

## Jobs

| Job | Qué valida |
|-----|------------|
| **Lint** | `npm run lint` |
| **Build** | `npm run build` (con `DATABASE_URL` y `AUTH_SECRET` de prueba) |
| **Verify DB + API** | PostgreSQL efímero → `db:migrate:deploy` → `db:seed` → `dev` → `test:int` |
| **E2E (Playwright)** | PostgreSQL efímero → `db:migrate:deploy` → `db:seed` → `test:e2e` (levanta `dev`). Si falla, sube el reporte HTML y los traces como artifact `playwright-report` |

No hace falta configurar secrets en GitHub: el job **Verify** levanta Postgres 16 como servicio del workflow.

El workflow usa `actions/checkout@v6` y `actions/setup-node@v6` con Node.js 24 (sin warnings de deprecación de Node 20).

---

## Tests E2E (Playwright)

`e2e/` recorre la UI real en Chromium: login por rol (incluido `callbackUrl` externo y rate limit), agendar turnos (horarios ocupados deshabilitados, paciente con dos turnos a la vez), cambios de estado y eliminación, permisos del rol profesional y la vista mobile (390 px).

```powershell
# Base migrada y sembrada con db:seed (usuarios demo), nunca la de producción
npx playwright install chromium   # una sola vez
npm.cmd run test:e2e
```

Playwright levanta `npm run dev` (o reutiliza el que esté corriendo en el puerto 3000). Las sesiones por rol se guardan en `e2e/.auth/` (ignorado por git) y al final se borran los datos `it-…` que crearon los tests.

## Verificación local

Con Neon (o Postgres local) y el dev server activo:

```powershell
# .env debe incluir DATABASE_URL, AUTH_SECRET y VERIFY_SECRET
npm.cmd run dev
```

En otra terminal:

```powershell
npm.cmd run test:int
```

> **Nunca contra producción.** `test:int` crea y borra datos (con ids `it-…`) y usuarios de prueba. Usalo solo con Postgres local, el de CI o un branch de Neon aparte.

### Qué prueban los tests de integración (`tests/integration/`)

- Integridad de DB (pacientes, profesionales, turnos, usuarios, DNI/matrícula)
- CRUD API de pacientes, profesionales y turnos
- Validaciones (DNI y matrícula duplicados, solapamiento de horarios)
- Sync de dominio (`ultimo_turno`, nombres en turnos)
- Autenticación con login real por rol, permisos y scope del rol profesional
- Protección de API sin sesión (401)

Corren con `node:test` de a un archivo por vez (`--test-concurrency=1`), porque comparten la base. Cada archivo limpia lo que creó.

Si `VERIFY_SECRET` no está en `.env`, las pruebas API pueden fallar por auth. Ver `env.example`.

---

## Badge (opcional)

En el README podés agregar:

```markdown
![CI](https://github.com/Matiglorioso/kineturnos/actions/workflows/ci.yml/badge.svg)
```

Reemplazá el usuario/repo si corresponde.
