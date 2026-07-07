# Implementación 57-shadcn-badges-tags

## Resumen

- Actualicé `frontend/src/components/ui/badge.tsx` para preservar la densidad visual de `.tag` legacy: `text-[10px]`, uppercase, `rounded-[5px]`, `px-[7px]`, `py-[2px]` y tracking `0.03em`.
- Agregué variantes Tracker a `Badge`: `navy`, `green`, `amber`, `red`, `gray`, `purple`, `blue` y `yellow`.
- Exporté `BadgeVariant` para tipar mapas de estados y evitar strings de clases legacy.
- Reemplacé usos autorizados de `<span className="tag ...">` por `<Badge variant="...">`.
- Migré mapas que devolvían `tag-green`, `tag-red`, etc. a variantes tipadas de `Badge`.
- Mantuve clases puntuales como `text-[9px]` y `text-[11px]` sobre `Badge` donde ya existía una densidad especial.
- En `CalendarView`, el chip draggable sigue siendo un `button` mediante `Badge asChild`, para conservar semántica e interacción.

## Archivos modificados

- `frontend/src/components/ui/badge.tsx`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx`
- `frontend/src/modules/dashboard/presentation/components/SellerSemaphoreTable.tsx`
- `frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx`
- `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
- `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`

## Verificación

- `npx tsc --noEmit` en `frontend/`: PASSED.
- El comando emitió warnings existentes de npm sobre `node-linker` y `shamefully-hoist`, sin errores de TypeScript.
- Búsqueda de legacy en paths autorizados: sin resultados.
- Búsqueda global solicitada todavía encuentra usos reales en `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`, pero ese archivo no estaba en los paths autorizados para esta implementación y no fue modificado.

## Nota sobre cambios previos

- `frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx` y `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx` ya tenían cambios sin commit asociados a la feature 56 de tablas. No los revertí ni los reformateé; solo agregué la migración de badges donde correspondía.

## Fix-pass SalesPage

- Reemplacé los dos `<span className="tag ...">` restantes en `frontend/src/modules/sales/presentation/pages/SalesPage.tsx` por `Badge` desde `@/components/ui/badge`.
- Mapeé `sale.clientType`: `Nuevo` a `blue` y `Existente` a `gray`.
- Mapeé `sale.type`: `seller` a `navy`, `atc` a `amber` y dirección/otros a `purple`.
- Verificación legacy solicitada en `frontend/src/modules`, `frontend/src/shared` y `frontend/src/routes`: PASSED, sin resultados.
- `npx tsc --noEmit` en `frontend/`: PASSED. Emitió warnings existentes de npm sobre `node-linker` y `shamefully-hoist`, sin errores de TypeScript.
