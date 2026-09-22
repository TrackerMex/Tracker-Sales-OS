#!/usr/bin/env bash

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tracker-sales-postgres}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:18}"
RESTORE_DATABASE="${RESTORE_DATABASE:-restore_verify}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-60}"

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

for command_name in awk basename date dirname docker find readlink sha256sum sleep sort; do
  require_command "$command_name"
done

[[ "$STARTUP_TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] \
  || fail "STARTUP_TIMEOUT_SECONDS must be a positive integer"

if [[ $# -gt 1 ]]; then
  fail "usage: $0 [backup.dump]"
fi

if [[ $# -eq 1 ]]; then
  backup_path="$1"
else
  backup_path="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -printf '%T@ %p\n' | sort -nr | awk 'NR == 1 { sub(/^[^ ]+ /, ""); print; exit }')"
fi

[[ -n "${backup_path:-}" ]] || fail "no backup file found in $BACKUP_DIR"
[[ -f "$backup_path" ]] || fail "backup file does not exist: $backup_path"
backup_path="$(readlink -f "$backup_path")"

if [[ -f "$backup_path.sha256" ]]; then
  backup_parent="$(dirname "$backup_path")"
  backup_filename="$(basename "$backup_path")"
  (cd "$backup_parent" && sha256sum --check --status "$backup_filename.sha256") \
    || fail "checksum validation failed: $backup_path.sha256"
  log "checksum validated file=$backup_path"
else
  log "WARNING: checksum sidecar not found for $backup_path"
fi

container_name="tracker-sales-restore-$RANDOM-$(date --utc +'%s')"
container_started=false

cleanup() {
  if [[ "$container_started" == "true" ]]; then
    docker rm --force "$container_name" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

log "starting isolated restore container image=$POSTGRES_IMAGE"
docker run \
  --detach \
  --rm \
  --name "$container_name" \
  --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  "$POSTGRES_IMAGE" >/dev/null
container_started=true

for ((second = 1; second <= STARTUP_TIMEOUT_SECONDS; second++)); do
  if docker exec --user postgres "$container_name" pg_isready --username postgres >/dev/null 2>&1; then
    break
  fi
  if (( second == STARTUP_TIMEOUT_SECONDS )); then
    docker logs "$container_name" >&2 || true
    fail "temporary PostgreSQL did not become ready within ${STARTUP_TIMEOUT_SECONDS}s"
  fi
  sleep 1
done

docker exec --user postgres "$container_name" createdb --username postgres "$RESTORE_DATABASE"
docker exec --interactive --user postgres "$container_name" \
  pg_restore \
  --username postgres \
  --dbname "$RESTORE_DATABASE" \
  --no-owner \
  --no-acl \
  --exit-on-error <"$backup_path"

public_table_count="$(docker exec --user postgres "$container_name" \
  psql --username postgres --dbname "$RESTORE_DATABASE" --tuples-only --no-align \
  --command "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
users_table_present="$(docker exec --user postgres "$container_name" \
  psql --username postgres --dbname "$RESTORE_DATABASE" --tuples-only --no-align \
  --command "SELECT CASE WHEN to_regclass('public.users') IS NULL THEN 0 ELSE 1 END;")"

[[ "$public_table_count" =~ ^[1-9][0-9]*$ ]] || fail "restore has no public tables"
[[ "$users_table_present" == "1" ]] || fail "expected table public.users is missing after restore"

log "restore verified file=$backup_path public_tables=$public_table_count expected_table=public.users"
