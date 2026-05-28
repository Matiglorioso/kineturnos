# Lo que necesitás hacer vos (5 minutos)

El código ya está preparado. Solo falta **conectar tu base Neon**.

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

## 4. Ejecutar estos 3 comandos

```powershell
cd C:\Users\matias.aliaga\kineturnos
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run dev
```

> **Windows / PowerShell:** si `npm run ...` falla con *"la ejecución de scripts está deshabilitada"*, usá **`npm.cmd`** en lugar de `npm` (es lo mismo, evita el bloqueo de PowerShell).

**Orden importante:** primero `db:push` (crea tablas), después `db:seed` (carga datos). Si el seed dice que la tabla no existe, falta correr `db:push`.

## 5. Probar en el navegador

| URL | Resultado esperado |
|-----|-------------------|
| http://localhost:3000/api/health/db | `{ "ok": true, ... }` |
| http://localhost:3000/api/patients | Lista JSON de pacientes |
| http://localhost:3000/api/appointments | Lista JSON de turnos |

## 6. Vercel (producción)

1. Vercel → **kineturnos** → **Settings** → **Environment Variables**
2. Name: `DATABASE_URL`  
   Value: connection string **Pooled** de Neon
3. **Redeploy**

---

## Qué NO hace falta que me pases

**No me envíes la connection string por chat** (tiene tu contraseña).

Con que me digas *"listo, ya corrí db:push y health/db responde ok"* alcanza para seguir con la migración de la app a la base de datos.

## Si algo falla

Copiame el **mensaje de error exacto** del terminal (sin la URL completa de la base).
