#!/usr/bin/env bash

set -Eeuo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-tracker-sales-os-trackersales-hibdzn}"
DATABASE_NAME="${DATABASE_NAME:-}"
DATABASE_USER="${DATABASE_USER:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tracker-sales-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
MIN_FREE_MIB="${MIN_FREE_MIB:-512}"
LOCK_FILE="${LOCK_FILE:-/run/tracker-sales-db-backup/backup.lock}"

log() {
  printf '%s %s\n' "$(date --utc --iso-8601=seconds)" "$*"
}

fail() {
  log "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

is_non_negative_integer() {
  [[ "$1" =~ ^[0-9]+$ ]]
}

for command_name in awk chmod date df dirname docker find flock install ln mktemp rm sha256sum stat; do
  require_command "$command_name"
done

is_non_negative_integer "$RETENTION_DAYS" || fail "RETENTION_DAYS must be a non-negative integer"
is_non_negative_integer "$MIN_FREE_MIB" || fail "MIN_FREE_MIB must be a non-negative integer"

install -d -m 0700 "$BACKUP_DIR"
lock_directory="$(dirname "$LOCK_FILE")"
install -d -m 0750 "$lock_directory"
[[ ! -L "$LOCK_FILE" ]] || fail "refusing symlink lock file: $LOCK_FILE"
if [[ -e "$LOCK_FILE" && ! -f "$LOCK_FILE" ]]; then
  fail "lock path exists but is not a regular file: $LOCK_FILE"
fi

exec 9>>"$LOCK_FILE"
flock -n 9 || fail "another backup process already holds $LOCK_FILE"

if [[ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || true)" != "true" ]]; then
  fail "PostgreSQL container is not running: $CONTAINER_NAME"
fi

if [[ -z "$DATABASE_NAME" ]]; then
  DATABASE_NAME="$(docker exec "$CONTAINER_NAME" printenv POSTGRES_DB 2>/dev/null || true)"
fi
if [[ -z "$DATABASE_USER" ]]; then
  DATABASE_USER="$(docker exec "$CONTAINER_NAME" printenv POSTGRES_USER 2>/dev/null || true)"
fi
[[ -n "$DATABASE_NAME" ]] || fail "DATABASE_NAME is empty and POSTGRES_DB is not set in the container"
[[ -n "$DATABASE_USER" ]] || fail "DATABASE_USER is empty and POSTGRES_USER is not set in the container"

available_mib="$(df -Pm "$BACKUP_DIR" | awk 'NR == 2 { print $4 }')"
is_non_negative_integer "$available_mib" || fail "could not determine free space for $BACKUP_DIR"
if (( available_mib < MIN_FREE_MIB )); then
  fail "only ${available_mib} MiB free in $BACKUP_DIR; minimum is ${MIN_FREE_MIB} MiB"
fi

timestamp="$(date --utc +'%Y%m%dT%H%M%SZ')"
safe_database_name="${DATABASE_NAME//[^[:alnum:]_.-]/_}"
backup_name="${safe_database_name}_${timestamp}.dump"
backup_path="$BACKUP_DIR/$backup_name"
checksum_path="$backup_path.sha256"
temporary_backup="$(mktemp --tmpdir="$BACKUP_DIR" ".${backup_name}.XXXXXX.tmp")"
temporary_checksum="$temporary_backup.sha256"

cleanup() {
  if [[ ! -e "$backup_path" && ! -L "$backup_path" && -e "$checksum_path" \
    && "$checksum_path" -ef "$temporary_checksum" ]]; then
    rm -f -- "$checksum_path"
  fi
  rm -f -- "$temporary_backup" "$temporary_checksum"
}
trap cleanup EXIT

log "starting PostgreSQL backup database=$DATABASE_NAME container=$CONTAINER_NAME"
docker exec --user postgres "$CONTAINER_NAME" \
  pg_dump \
  --username "$DATABASE_USER" \
  --dbname "$DATABASE_NAME" \
  --format=custom \
  --compress=6 \
  --lock-wait-timeout=60s \
  --no-owner \
  --no-acl >"$temporary_backup"

[[ -s "$temporary_backup" ]] || fail "pg_dump produced an empty file"

docker exec --user postgres --interactive "$CONTAINER_NAME" \
  pg_restore --list <"$temporary_backup" >/dev/null

chmod 0600 "$temporary_backup"
checksum="$(sha256sum "$temporary_backup" | awk '{ print $1 }')"
printf '%s  %s\n' "$checksum" "$backup_name" >"$temporary_checksum"
chmod 0600 "$temporary_checksum"

if [[ -e "$backup_path" || -e "$checksum_path" ]]; then
  fail "refusing to overwrite an existing backup or checksum for timestamp=$timestamp"
fi

# Publish the checksum first, then atomically hard-link the dump into view. Consumers
# discover only *.dump, so an interruption cannot expose a dump without its sidecar.
ln -- "$temporary_checksum" "$checksum_path"
if ! ln -- "$temporary_backup" "$backup_path"; then
  fail "could not publish backup without overwriting: $backup_path"
fi
rm -f -- "$temporary_backup" "$temporary_checksum"

deleted_count=0
retention_minutes=$((RETENTION_DAYS * 1440))
while IFS= read -r -d '' expired_backup; do
  rm -f -- "$expired_backup" "$expired_backup.sha256"
  deleted_count=$((deleted_count + 1))
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -mmin "+$retention_minutes" -print0)

backup_bytes="$(stat --format='%s' "$backup_path")"
log "backup completed file=$backup_path bytes=$backup_bytes sha256=$checksum expired_deleted=$deleted_count"
