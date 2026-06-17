# Feature 32 — Vista calendario mensual de tareas

## Status: DONE
## TypeScript: exit 0 (pnpm tsc --noEmit)

## Archivos creados/modificados

### Modificados
- `frontend/src/modules/tasks/infrastructure/tasks.api.ts`
  - Añadido método `getMonthTasks(sellerId, monthStart)` que llama `GET /tasks/seller/:id/today?date=YYYY-MM-01`

- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`
  - Toggle Lista/Calendario con persistencia en `localStorage` (key: `agenda_view_mode`)
  - Estado `calYear` / `calMonth` para navegación mensual
  - Hook `useMonthTasks` integrado
  - Render condicional: lista existente o `<CalendarView />`
  - Botón "Crear tarea" siempre visible en ambos modos

### Creados
- `frontend/src/modules/tasks/application/hooks/useMonthTasks.ts`
  - Hook TanStack Query, filtra client-side al mes/año específico
  - queryKey: `['tasks', 'month', sellerId, year, month]`

- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`
  - CSS Grid 7 columnas, semana empieza en lunes
  - Chips con formato `HH:MM · Tipo · Cliente`
  - Color de chip reutiliza clases `tag tag-navy/green/amber/gray`
  - Máximo 3 chips por día, muestra `+N más`
  - Día actual resaltado (fondo `#EFF6FF`, borde `#3B82F6`)
  - Navegación prev/next mes
  - Click en chip abre `EditTaskForm` (modal existente)
