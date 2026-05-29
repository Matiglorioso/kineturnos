# Migraciones Prisma

El schema vive en `prisma/schema.prisma`. Los cambios versionados están en `prisma/migrations/`.

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run db:migrate` | Crear migración en desarrollo (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Aplicar migraciones en CI / producción |
| `npm run db:push` | Sync rápido sin historial (solo prototipos locales) |

## CI y Vercel

- **GitHub Actions:** el job Verify usa `db:migrate:deploy` sobre Postgres efímero.
- **Vercel:** `vercel.json` corre `prisma migrate deploy && next build` en cada deploy.

## Base Neon ya existente (baseline)

Si la DB se creó antes con `db:push`, marcá la migración inicial como aplicada **una sola vez**:

```powershell
npx prisma migrate resolve --applied 20260328120000_init
```

Luego `npm run db:migrate:deploy` no intentará recrear tablas.

## Nueva migración (desarrollo)

1. Editá `prisma/schema.prisma`
2. `npm run db:migrate` (genera SQL y aplica en local)
3. Commit de `prisma/migrations/*`
4. CI y Vercel aplican con `migrate deploy`
