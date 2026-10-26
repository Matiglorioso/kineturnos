#!/usr/bin/env bash
# Respaldo de la base (RNF09): pg_dump en texto plano, comprimido y cifrado con AES-256.
#
#   DATABASE_URL=... BACKUP_PASSPHRASE=... scripts/respaldo/respaldar.sh <carpeta-de-salida>
#
# Deja en la carpeta:
#   kineturnos.sql.gz.gpg   el respaldo cifrado (sin la frase no se puede leer)
#   hash                    sha256 del SQL sin cifrar (iguales = la base no cambió)
#   tamano                  tamaño del archivo cifrado, legible
#
# Usa pg_dump 17 desde Docker (Neon corre Postgres 17; también sirve para 16).
set -euo pipefail

out="${1:?Indicá la carpeta de salida}"
: "${DATABASE_URL:?Falta DATABASE_URL}"
: "${BACKUP_PASSPHRASE:?Falta BACKUP_PASSPHRASE}"
image="${PG_IMAGE:-postgres:17-alpine}"

mkdir -p "$out"
sql="$(mktemp)"
trap 'rm -f "$sql"' EXIT

# Neon suspende la base sin uso y tarda unos segundos en despertar: hasta 3 intentos.
for attempt in 1 2 3; do
  if docker run --rm --network host -e PGCONNECT_TIMEOUT=30 "$image" \
    pg_dump --no-owner --no-privileges --dbname="$DATABASE_URL" > "$sql"; then
    break
  fi
  if [ "$attempt" -eq 3 ]; then
    echo "pg_dump falló después de 3 intentos." >&2
    exit 1
  fi
  echo "pg_dump falló (intento $attempt); reintento en 20 s."
  sleep 20
done

sha256sum "$sql" | cut -c1-64 > "$out/hash"

gzip -9 -n -c "$sql" \
  | gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 \
      --symmetric --cipher-algo AES256 -o "$out/kineturnos.sql.gz.gpg" \
      3<<< "$BACKUP_PASSPHRASE"

du -h "$out/kineturnos.sql.gz.gpg" | cut -f1 > "$out/tamano"
echo "Respaldo listo: $(cat "$out/tamano"), sha256 $(cut -c1-12 "$out/hash")…"
