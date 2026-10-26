# Respaldos de la base (RNF09)

> **RNF09:** debe contemplarse un mecanismo de respaldo (backup) periódico de la base de datos.

## Cómo funciona

| | |
|---|---|
| **Qué** | Copia completa de la base de producción (`pg_dump`): estructura y datos |
| **Cuándo** | Todos los días a las 03:30 (Buenos Aires), con el workflow [`respaldo.yml`](../.github/workflows/respaldo.yml) de GitHub Actions. También se puede correr a mano: *Actions* → *Respaldo* → *Run workflow* |
| **Seguridad** | Comprimido y **cifrado con AES-256**. El repositorio es público y la base tiene historias clínicas: sin la frase de cifrado, el archivo no se puede leer |
| **Dónde** | Como archivo del workflow (*artifact*), con nombre `respaldo-<fecha>-<huella>` |
| **Cuánto tiempo** | **14 días**; después GitHub lo borra solo |
| **Espacio** | Lo mínimo. Si la base no cambió desde el último respaldo, no se guarda otro, salvo que ese tenga 7 días o más, así siempre queda uno vigente. Un respaldo de la base actual pesa unos pocos KB |
| **Si falla** | El workflow queda en rojo y GitHub avisa por correo |

Además, Neon permite volver la base a cualquier momento de las **últimas 6 horas** (plan gratuito). Sirve para un error que se nota enseguida; para algo que se descubre días después están los respaldos diarios.

**Verificado en cada cambio:** el CI (job *Respaldo y restauración*) hace todo esto:
1. respalda la base de prueba con el mismo script;
2. comprueba que el archivo esté cifrado y que una frase incorrecta no lo abra;
3. restaura en una base vacía y compara la cantidad de filas de todas las tablas;
4. comprueba que no restaure encima de una base con datos.

## Puesta en marcha (una sola vez)

Los pasos con contraseñas los hace la persona responsable del proyecto. No se comparten por chat.

1. **Usuario de solo lectura en Neon:** así el respaldo no puede modificar nada. En la consola de Neon abrí **SQL Editor**, elegí la rama **production** y ejecutá lo siguiente, poniendo una contraseña nueva:
   ```sql
   CREATE ROLE respaldo WITH LOGIN PASSWORD '<contraseña nueva>';
   GRANT pg_read_all_data TO respaldo;
   ```
2. **URL de conexión de ese usuario:** en **Connect**, elegí la rama **production**, el rol **respaldo**, y **desmarcá Connection pooling**. La URL correcta no tiene `-pooler`.
3. **Secrets en GitHub:** en *Settings* → *Secrets and variables* → *Actions* → *New repository secret*, cargá:
   - `BACKUP_DATABASE_URL`: la URL del paso 2.
   - `BACKUP_PASSPHRASE`: una frase larga, por ejemplo cuatro o cinco palabras al azar. **Guardala en un lugar seguro** (un gestor de contraseñas): si se pierde, los respaldos no se pueden abrir.
4. **Probarlo:** *Actions* → *Respaldo* → *Run workflow*. En el resumen de la ejecución tiene que decir "Se guarda: ✅ sí".

Sin los dos secrets, el workflow avisa y termina sin hacer nada.

## Restaurar un respaldo

Se restaura en una base **vacía**. Nunca encima de producción: el script se niega si la base ya tiene datos.

1. **Descargá el respaldo:** en *Actions* → *Respaldo*, abrí la ejecución del día que querés y, en *Artifacts*, descargá `respaldo-…`. Viene en un `.zip` con `kineturnos.sql.gz.gpg` adentro.
2. **Creá una base vacía en Neon:**
   - En la rama de pruebas (por ejemplo **preview**), abrí **SQL Editor** y ejecutá `CREATE DATABASE kineturnos_restaurada;`.
   - Copiá la URL de esa rama sin `-pooler` y cambiá el nombre de la base del final por `kineturnos_restaurada`.
3. **Restaurá** con Git Bash y Docker:
   ```bash
   BACKUP_PASSPHRASE='<la frase>' scripts/respaldo/restaurar.sh kineturnos.sql.gz.gpg '<URL de la base vacía>'
   ```
   Al terminar informa cuántos pacientes y turnos restauró.
4. **Revisá los datos** en esa base. Si hace falta volver a producción, hay dos opciones:
   - restaurar en una rama nueva, que luego se marca como principal (*Set as default*), y actualizar `DATABASE_URL` en Vercel;
   - o copiar los datos que falten.

Para un error de las últimas 6 horas es más simple usar *Restore* de Neon sobre la rama production, que vuelve a un momento exacto.
