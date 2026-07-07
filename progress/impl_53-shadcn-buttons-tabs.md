# Feature 53-shadcn-buttons-tabs

## Archivos modificados

- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx`
- `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`
- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- `frontend/src/modules/sales/presentation/components/SaleFormBase.tsx`
- `frontend/src/modules/sales/presentation/components/EditSaleModal.tsx`
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`
- `frontend/src/modules/import-export/presentation/pages/ImportExportPage.tsx`
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`
- `frontend/src/shared/components/layout/Header.tsx`
- `progress/impl_53-shadcn-buttons-tabs.md`

## Botones migrados

- Reemplace usos legacy `btn-primary`, `btn-green`, `btn-ghost`, `btn-danger` y `btn-sm` por `Button` de `@/components/ui/button`.
- Mapeos aplicados:
  - `btn-primary` -> `Button` default.
  - `btn-green` -> `Button variant="success"`.
  - `btn-ghost` -> `Button variant="ghost"`.
  - `btn-danger` -> `Button variant="destructive"`.
  - `btn-sm` -> `Button size="sm"`.
- Conserve handlers, `disabled`, `aria-*`, `className` de layout (`w-full`, `ml-3`, `flex-1`, `col-span-2`, `whitespace-nowrap`, `justify-center`) y estilos inline solo cuando eran parte del layout o estado especial existente.

## Tabs migrados

- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`: el switch `Lista` / `Calendario` usa `Tabs`, `TabsList`, `TabsTrigger` controlado por `viewMode`. Mantiene `handleToggleView` y persistencia en `localStorage`.
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`: el selector `Mes` / `Semana` / `Dia` usa `Tabs`, `TabsList`, `TabsTrigger` controlado por `viewMode`. Mantiene `onViewModeChange` y el estado interno existente.

## Residuos intencionales de `<button>`

Quedan `<button>` sin clases `btn-*` porque no son botones legacy de accion o dependen de estilos custom:

- Cierres de modal con `x` en `LoginPage`, `CreateTaskForm`, `EditTaskForm`, `ClientDetailPage` y `ClientesPage`.
- Text-links o toggles internos: expand/collapse en `ActivityForm`, agregar/quitar contacto en `ClientesPage`, reset de formulario en `LoginPage`.
- Selectores/cards clicables custom: vendedor en `MiDiaPage`, nombre de cliente en `ClientesPage`.
- Steppers y controles circulares de pipeline en `ClientDetailPage`.
- Celdas, chips arrastrables y navegacion de calendario en `CalendarView`; se mantienen por interaccion de grid, drag/drop y layout especifico.
- Acciones inline de activar/bloquear en `EquipoPage`; son text-actions custom sin clase legacy.

## Verificacion

- `cd frontend && npx tsc --noEmit`: PASSED.
  - Warnings npm existentes: `Unknown project config "node-linker"` y `Unknown project config "shamefully-hoist"`.
- `rg -n "btn-primary|btn-green|btn-ghost|btn-danger|btn-sm" frontend/src/modules frontend/src/routes`: sin coincidencias.
- Revision Lider adicional: `frontend/src/shared/components/layout/Header.tsx` tambien migrado a `Button`.
- `rg -n "btn-primary|btn-green|btn-ghost|btn-danger|btn-sm" frontend/src`: solo quedan las definiciones legacy en `frontend/src/index.css`.
- `rg -n "<button\\b" frontend/src/modules`: quedan residuos intencionales listados arriba.

## Nota de worktree

Antes de implementar ya existian cambios en archivos fuera del alcance directo de esta feature, como `feature_list.json`, `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/tabs.tsx` y `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`. No los reverti.
