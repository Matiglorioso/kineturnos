# CI y verificaciones automáticas

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/ci.yml`) que corre en cada push y pull request a `main`.

## Jobs

| Job | Qué valida |
|-----|------------|
| **Lint** | `npm run lint` |
| **Build** | `npm run build` (con `DATABASE_URL` y `AUTH_SECRET` de prueba) |
| **Verify DB + API** | PostgreSQL efímero → `db:migrate:deploy` → `db:seed` → `dev` → `verify:migration` |

No hace falta configurar secrets en GitHub: el job **Verify** levanta Postgres 16 como servicio del workflow.

El workflow usa `actions/checkout@v6` y `actions/setup-node@v6` con Node.js 24 (sin warnings de deprecación de Node 20).

---

## Verificación local

Con Neon (o Postgres local) y el dev server activo:

```powershell
# .env debe incluir DATABASE_URL, AUTH_SECRET y VERIFY_SECRET
npm.cmd run dev
```

En otra terminal:

```powershell
npm.cmd run verify:migration
```

### Qué prueba el script

- Integridad de DB (pacientes, profesionales, turnos, usuarios, DNI/matrícula)
- CRUD API de pacientes, profesionales y turnos
- Validaciones (DNI duplicado, solapamiento de horarios)
- Sync de dominio (`ultimo_turno`, `paciente_nombre`)
- Protección de API sin sesión (401)

Si `VERIFY_SECRET` no está en `.env`, las pruebas API pueden fallar por auth. Ver `env.example`.

---

## Badge (opcional)

En el README podés agregar:

```markdown
![CI](https://github.com/Matiglorioso/kineturnos/actions/workflows/ci.yml/badge.svg)
```

Reemplazá el usuario/repo si corresponde.
