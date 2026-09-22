# Implementación 75-pipeline-client-phone-in-drawer

## Cambios

- Se muestra `contact.phone` debajo del rol y la marca `Principal` de cada contacto en `Información del cliente > Contactos`.
- El valor se normaliza con `trim()` y usa el fallback `Sin teléfono` cuando está vacío o contiene solo espacios.
- El teléfono se presenta como texto, sin enlaces ni cambios de API.

## Archivos

- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`

## Verificación

- Comando: `npx tsc --noEmit` desde `frontend`.
- Resultado: exitoso, exit code 0.
- Observación: npm mostró advertencias existentes sobre las opciones `node-linker` y `shamefully-hoist`; no hubo errores de TypeScript.
