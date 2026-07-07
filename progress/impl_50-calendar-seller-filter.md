# Implementación — Feature 50: calendar-seller-filter

## Resumen

Fix del dropdown de vendedor en AgendaPage (vista Calendario). Para Admin/Director,
el calendario ahora parte siempre de `enrichedTeamTasks` (endpoint GET /api/tasks/team)
y aplica el filtro por `sellerId` cuando se elige un vendedor específico. Antes, con
un seller específico `isTeamMode` era `false` y el calendario caía a `monthTasksRaw`
(tareas del usuario logueado), por lo que el filtro nunca se aplicaba.

Seller (rol normal) no ve el dropdown y sigue usando `monthTasksRaw` — sin cambios.

## Archivo modificado

- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx` (único archivo tocado)

## Diff relevante

Antes (líneas 87 y 103):

```ts
const isTeamMode = isAdminOrDirector && selectedSeller === 'all'
...
const monthTasks = isTeamMode ? enrichedTeamTasks : monthTasksRaw
```

Después:

```ts
const monthTasks = isAdminOrDirector
  ? selectedSeller === 'all'
    ? enrichedTeamTasks
    : enrichedTeamTasks.filter((t) => t.sellerId === selectedSeller)
  : monthTasksRaw
```

La variable `isTeamMode` quedó sin usos en el archivo y fue eliminada. Los usos de
`isTeamMode` en `PipelinePage.tsx` pertenecen a otro módulo y no fueron tocados.

## Verificación

- `cd frontend && npx tsc --noEmit` → exit 0.
- `git diff` de código solo toca `AgendaPage.tsx`.
- Sin cambios en hooks, backend ni otros componentes.
