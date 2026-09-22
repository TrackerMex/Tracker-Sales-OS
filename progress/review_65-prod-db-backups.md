# Review — Feature 65: backups automatizados de PostgreSQL en producción

**Veredicto:** FAILED — CHECKPOINT incompleto por falta de evidencia real en producción.

## Resultado

- Criterios versionables: 8/8 aprobados.
- Criterios de producción: 0/3 verificados.
- `backup.sh` y `restore-test.sh`: sintaxis Bash aprobada.
- No quedan bloqueantes estáticos conocidos en Bash, systemd, seguridad, restauración o retención.

## Hallazgos corregidos durante la revisión

- Se eliminó la posibilidad de sobrescribir silenciosamente un backup con el mismo timestamp.
- El checksum se publica antes que el dump y el cleanup decide mediante estado e inode reales, evitando un dump visible sin sidecar incluso ante señales.
- El lock dejó de modificar `/run/lock`; usa un `RuntimeDirectory` dedicado, con validación anti-symlink.
- Restore de prueba y restore real transmiten el dump `0600` por stdin; ya no dependen de permisos de bind mount o `docker cp`.
- La documentación exige revisar la configuración antes de habilitar el timer o iniciar el servicio.

## Pendiente obligatorio

1. Instalar y habilitar las unidades en el VPS.
2. Ejecutar el primer backup y restaurarlo en PostgreSQL 18 efímero, guardando evidencia.
3. Confirmar una segunda corrida sin sobrescritura y estado systemd limpio.

El acceso SSH falló con `Permission denied (publickey,password)`, por lo que estos criterios no se marcaron como cumplidos.

