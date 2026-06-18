# Review: Feature 38 — Activity Lifecycle

**Fecha:** 2026-06-17
**Rama:** fix/clients
**Reviewer:** Subagente Reviewer

---

## Resultado: FAIL (2 bugs menores, sin issues críticos de seguridad)

**Score de checklist: 19/19 PASS**

Los 19 items del checklist pasan. Los 2 bugs fueron encontrados fuera del checklist durante la lectura completa.

---

## Checklist detallado

### Backend (10/10 PASS)

| # | Check | Estado |
|---|-------|--------|
| 1 | `ActivityStatus` y `ActivityHistoryEntry` exportados desde `activity.entity.ts` | PASS |
| 2 | Columna `status` default `'Pendiente'` en TypeORM entity | PASS |
| 3 | Columna `activity_history` tipo `jsonb` con default `[]` | PASS |
| 4 | `updateStatus()` usa spread para append (no reemplaza el array) | PASS |
| 5 | `UpdateActivityStatusUseCase` valida transición antes de persistir, lanza `BadRequestException` | PASS |
| 6 | `PATCH /activities/:id/status` requiere JWT (guard a nivel de clase) | PASS |
| 7 | `GET /activities/:id` requiere JWT (guard a nivel de clase) | PASS |
| 8 | `changedBy` toma `req.user.username` del JWT, no del body | PASS |
| 9 | `UpdateActivityStatusUseCase` registrado en `providers` de `activities.module.ts` | PASS |
| 10 | Spec file: mocks incluyen `updateStatus` y `findByClientId` (compila correctamente) | PASS |

### Frontend (7/7 PASS)

| # | Check | Estado |
|---|-------|--------|
| 11 | `ActivityStatus` y `ActivityHistoryEntry` tipados correctamente en `activities.types.ts` | PASS |
| 12 | `useUpdateActivityStatus` invalida queries `['activity', activityId]` y `['activities']` al éxito | PASS |
| 13 | `ActivityHistoryModal` no muestra botones si estado es terminal (`NEXT_TRANSITIONS` no tiene entradas para `Completada`/`Cancelada`) | PASS |
| 14 | Modal fetcha por `activityId` con `useActivityById` — historial es individual, no mezclado | PASS |
| 15 | Badge de status con clases correctas: yellow=Pendiente, blue=En curso, green=Completada, sin clase=Cancelada | PASS |
| 16 | Click "Ver historial" llama `setSelectedActivityId(activity.id)` correctamente | PASS |
| 17 | `activityHistory` vacío muestra `"Sin actualizaciones aún"` sin crash | PASS |

### Seguridad (2/2 PASS)

| # | Check | Estado |
|---|-------|--------|
| 18 | `newStatus` validado con `@IsIn(['En curso', 'Completada', 'Cancelada'])` en `UpdateActivityStatusDto` del controller | PASS |
| 19 | `changedBy` no acepta valor del body; solo viene del JWT `req.user.username` | PASS |

---

## Bugs encontrados

### BUG 1 — HTTP 500 en lugar de 404 cuando actividad no existe

**Archivo:** `backend/src/modules/activities/presentation/activities.controller.ts:61`

```ts
// Actual (incorrecto):
if (!activity) throw new Error('Activity not found');

// Correcto:
if (!activity) throw new NotFoundException('Activity not found');
```

`Error` genérico no es interceptado por el filtro de excepciones de NestJS y retorna 500. `NotFoundException` retornaría 404. El frontend que maneja errores esperando 404 recibirá en cambio un 500, lo que puede romper el manejo de errores del cliente.

**Severidad:** Media. No es un crash en producción (la respuesta sí llega), pero el código HTTP es incorrecto.

---

### BUG 2 — Método `getClientActivities` en frontend sin ruta backend correspondiente

**Archivo:** `frontend/src/modules/activities/infrastructure/activities.api.ts:22`

```ts
getClientActivities: (clientId: string): Promise<Activity[]> =>
  api.get(`/activities/client/${clientId}`).then((r) => r.data),
```

El controller de activities no tiene ninguna ruta `GET /activities/client/:clientId`. El repositorio tiene `findByClientId` implementado pero no está expuesto por ningún endpoint. Cualquier llamada a `getClientActivities` fallará con 404.

**Severidad:** Media. La función es código muerto por ahora. Si está planeada para usarse en client profile, el backend no está completo.

---

## Puntos positivos

- Las transiciones terminales (`Completada`, `Cancelada`) están correctamente bloqueadas a nivel de use-case y a nivel de UI.
- Defense-in-depth: `@IsIn` en el DTO + validación de transiciones en el use-case.
- `changedBy` correctamente protegido contra spoofing.
- El append al historial JSONB es correcto (spread del array existente).
- El modal maneja correctamente el estado vacío sin crashes.

---

## Veredicto

**FAIL** — requiere fixes menores antes de marcar como done:

1. `activities.controller.ts:61` → cambiar `throw new Error(...)` por `throw new NotFoundException(...)`
2. Decidir si `getClientActivities` necesita ruta backend (`GET /activities/client/:clientId`) o remover el método del API si no está en scope de esta feature.

No hay bugs críticos de seguridad, no hay transiciones inválidas permitidas, no hay posibilidad de crash en el flujo principal.
