# Feature 59 - shadcn tooltips

## Archivos modificados

- `frontend/src/App.tsx`
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`

## Tooltips agregados

- Se envolvio la app con `TooltipProvider` global de shadcn.
- Se agregaron tooltips shadcn a triggers icon-only de menus de acciones:
  - Clientes: acciones del cliente.
  - Tareas: acciones de tarea.
  - Actividades: acciones de actividad.
  - Pipeline detalle: acciones de actividad.
  - Ventas: acciones de venta.
  - Equipo: acciones de usuario y vendedor.
  - Reportes: acciones del informe.
- Se mantuvieron `aria-label` en botones icon-only.
- No se agregaron tooltips a botones con texto visible.
- Los items de `DropdownMenu` conservan texto visible.

## Verificacion

- `cd frontend && npx tsc --noEmit`
- Resultado: PASSED sin errores de TypeScript.
- Observacion: npm mostro warnings sobre config `node-linker` y `shamefully-hoist`, sin fallar la verificacion.
