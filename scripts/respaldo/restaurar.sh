#!/usr/bin/env bash
# Restaura un respaldo cifrado en una base VACÍA (RNF09).
#
#   BACKUP_PASSPHRASE=... scripts/respaldo/restaurar.sh <kineturnos.sql.gz.gpg> <URL de la base destino>
#
# La base destino tiene que estar vacía (por ejemplo, una rama nueva de Neon creada
# para restaurar): si ya tiene la tabla de pacientes, el script no hace nada.
# Para Neon usá el host directo (sin -pooler).
set -euo pipefail

file="${1:?Indicá el archivo .sql.gz.gpg}"
target="${2:?Indicá la URL de la base destino}"
: "${BACKUP_PASSPHRASE:?Falta BACKUP_PASSPHRASE}"
image="${PG_IMAGE:-postgres:17-alpine}"

psql() {
  docker run --rm -i --network host -e PGCONNECT_TIMEOUT=30 "$image" psql "$@"
}

existing="$(psql --dbname="$target" -tAc "SELECT to_regclass('public.pacientes') IS NOT NULL")"
if [ "$existing" = "t" ]; then
  echo "La base destino ya tiene datos (tabla pacientes). Usá una base vacía." >&2
  exit 1
fi

gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$file" 3<<< "$BACKUP_PASSPHRASE" \
  | gunzip -c \
  | psql --quiet -v ON_ERROR_STOP=1 --dbname="$target" > /dev/null

echo "Restaurado. Pacientes: $(psql --dbname="$target" -tAc 'SELECT count(*) FROM pacientes'), turnos: $(psql --dbname="$target" -tAc 'SELECT count(*) FROM turnos')."
