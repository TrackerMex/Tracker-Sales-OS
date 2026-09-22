# Feature 65 — Backups automatizados de PostgreSQL en producción

**Estado:** implementación versionada lista; instalación y prueba real bloqueadas por acceso SSH.

## Implementación

- `ops/postgres-backup/backup.sh`: dump custom comprimido dentro del contenedor PostgreSQL, autodetección no secreta de DB/usuario, escritura atómica, validación con `pg_restore --list`, SHA-256, lock, umbral de espacio y retención de 30 días.
- `ops/postgres-backup/restore-test.sh`: restore completo con `--exit-on-error` en un contenedor `postgres:18` efímero y sin red; valida tablas públicas y `public.users`.
- `ops/postgres-backup/tracker-sales-db-backup.service`: servicio oneshot con hardening y logs en journal.
- `ops/postgres-backup/tracker-sales-db-backup.timer`: ejecución diaria a las 03:15 UTC, `Persistent=true` y demora aleatoria de hasta 15 minutos.
- `ops/postgres-backup/backup.conf.example`: configuración operativa sin credenciales.
- `docs/verification.md`: instalación, observabilidad, checksum, prueba aislada y procedimiento de recuperación real con rollback.
- `CHECKPOINTS.md`: criterios de aceptación de la feature 65, separando lo verificable en repo de la evidencia pendiente en producción.

## Bloqueo de producción

El 2026-07-18 se intentó una conexión SSH de sólo lectura al único host registrado en `known_hosts`, usando `C:\Users\alex\.ssh\id_ed25519`. El servidor respondió `Permission denied (publickey,password)`; no se instaló ni modificó nada en el VPS.

## Decisión operativa 2026-07-19

Se confirmó desde el panel de Dokploy que la base `tracker-sales` soporta backups nativos, pero no tiene backups ni destinos S3 configurados. El usuario eligió dejar la feature pendiente mientras configura un bucket Cloudflare R2. La estrategia objetivo pasa a ser Dokploy + R2 para conservar copias fuera del VPS; no se creó ningún destino ni se transmitieron credenciales durante la inspección.

Al retomar: agregar Cloudflare R2 en `Settings > S3 Destinations`, probar la conexión, crear el backup diario con retención acordada, ejecutar un backup inmediato, restaurarlo de forma controlada y registrar dos corridas exitosas antes de marcar la feature como `done`.

## Verificación local

- `bash -n ops/postgres-backup/backup.sh`: PASS.
- `bash -n ops/postgres-backup/restore-test.sh`: PASS.
- La revisión independiente detectó y provocó correcciones en publicación sin sobrescritura, orden checksum/dump, directorio seguro del lock, orden de habilitación del timer y lectura de archivos `0600` durante restore.
- Review estático final: 8/8 criterios versionables aprobados; ver `progress/review_65-prod-db-backups.md`.
- Docker Desktop no está activo en este equipo, por lo que el restore con PostgreSQL real forma parte de la evidencia de producción pendiente y no se simuló como si fuera una verificación real.

## Evidencia pendiente

Completar esta sección después de recuperar acceso SSH:

- Fecha/hora UTC de la primera corrida:
- Archivo de backup (nombre, no contenido):
- Tamaño en bytes:
- SHA-256 abreviado:
- Resultado de `pg_restore --list`:
- Resultado de restore aislado y número de tablas públicas:
- Resultado de `systemctl is-failed tracker-sales-db-backup.service`:
- Próxima corrida reportada por `systemctl list-timers`:
- Evidencia de segunda corrida sin sobrescritura:
