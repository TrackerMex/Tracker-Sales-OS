# impl_47-hardening-menor

## B6 — defensivo, update() sin 500 en id inexistente

Archivos modificados:
- `backend/src/modules/tasks/infrastructure/repositories/task.repository.impl.ts`
  - `update()`: si `!existing`, lanza `NotFoundException('Task ${id} not found')` en lugar de `Object.assign(existing!, ...)`.
- `backend/src/modules/activities/infrastructure/repositories/activity.repository.impl.ts`
  - `update()`: mismo fix, `NotFoundException('Activity ${id} not found')`.

Decisión: solo se tocó el guard clause dentro de `update()`. No se modificó ningún use-case (todos ya validaban `findById` + `NotFoundException` antes de llamar a `update()`), así que el comportamiento de los endpoints existentes no cambia — el fix cierra la ventana TOCTOU y protege a callers futuros.

## B7 — backend enriquece TaskDto con clientName/contactName

Archivos modificados:
- `backend/src/modules/tasks/domain/entities/task.entity.ts`: agregado `clientName?: string | null` y `contactName?: string | null`.
- `backend/src/modules/tasks/application/dtos/task.dto.ts`: agregados los mismos campos al DTO, poblados en `fromEntity` con `entity.clientName ?? null` / `entity.contactName ?? null`.
- `backend/src/modules/tasks/infrastructure/repositories/task.repository.impl.ts`: `findTodayBySeller` y `findMonthAllSellers` ahora usan `leftJoin` a `clients` y `contacts` + `addSelect` + `getRawAndEntities()`, mapeando igual que `findDailyBySeller` de activities.

Detalle importante: a diferencia de `activities.client_id` (tipo `uuid`), la columna `tasks.client_id` es `varchar` (ver `task.typeorm.entity.ts`), así que el join contra `clients.id` (uuid) requiere cast `c.id::text = task.client_id::text` (igual que ya se hacía para `contact_id`, que también es varchar en ambos módulos). Sin el cast el join fallaría por mismatch de tipos.

No se tocaron `get-today-tasks.use-case.ts` ni `get-team-tasks.use-case.ts` — ya usaban `entities.map(TaskDto.fromEntity)`, heredan los campos nuevos automáticamente.

## B7 — frontend deja de resolver client-side

Archivos modificados:
- `frontend/src/modules/tasks/domain/tasks.types.ts`: agregado `clientName?: string | null` y `contactName?: string | null` a `Task`.
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`:
  - Vista lista: reemplazado `clients.find()` + `client?.contacts.find()` por `task.clientName ?? null` / `task.contactName ?? null` directo.
  - Quitado `useClients({ limit: 200 })`, la constante `clients` y el prop `clients={clients}` en `<CalendarView>` (ya no lo necesita, ver abajo). `CreateTaskForm` no se tocó (su propio `useClients` es un uso distinto, fuera de alcance).
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`:
  - Los 3 bloques con `clients.find((c) => c.id === task.clientId)` (en `MonthDayCell`, `WeekDayColumn`, `DayHourRow`) se eliminaron; `TaskChip` ahora usa `task.clientName` directamente en vez de recibir un prop `client: Client`.
  - Se quitó el prop `clients: Client[]` de todas las interfaces que lo tenían: `CalendarViewProps`, `MonthViewProps`, `MonthDayCellProps`, `WeekViewProps`, `WeekDayColumnProps`, `DayViewProps`, `DayHourRowProps`, y de `TaskChipProps` se quitó `client: Client | undefined`.
  - Se quitó el import `Client` de `@/modules/clients/domain/clients.types` (ya no se usa en el archivo).
  - Se siguió la cadena completa de props en cascada (`CalendarView` -> `MonthView`/`WeekView`/`DayView` -> `MonthDayCell`/`WeekDayColumn`/`DayHourRow` -> `TaskChip`) quitando `clients={clients}` en cada punto de paso.
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`:
  - Reemplazado `const client = clients.find(...); const contact = client?.contacts.find(...)` por `const clientName = task.clientName ?? null; const contactName = task.contactName ?? null`. En el JSX solo se usaba `.name` de ambos, así que fue un reemplazo directo.
  - Quitado `useClients({ limit: 200 })`, la constante `clients` y el import de `useClients` (sin más usos en el archivo).
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`: sin cambios (ya aceptaba `clientName`/`contactName` como props opcionales); confirmado que compila.

## Resultado tsc

- Backend (`npx tsc --noEmit` en `backend/`): 0 errores.
- Frontend (`npx tsc --noEmit` en `frontend/`): 0 errores (con `noUnusedLocals`/`noUnusedParameters` activos, confirma que no quedaron imports/variables residuales de `clients`/`Client`).

## Reviewer

16/16 criterios PASSED. Único hallazgo (de proceso, no de código): el Implementer generó `backend/CHECKPOINTS.md` suelto (cwd incorrecto al correr el heredoc) en vez de escribir en el `CHECKPOINTS.md` raíz. Corregido por el Líder: archivo suelto eliminado, sección `## 47-hardening-menor` re-agregada en el `CHECKPOINTS.md` correcto (raíz), ya marcada [x] en los 16 criterios tras la verificación del Reviewer.

Nota interna: al corregir esto, un primer intento con `awk`/gsub sin scoping correcto marcó `[x]` erróneamente en secciones históricas no relacionadas (features 05 a 27). Detectado antes de guardar nada vía `git diff`, revertido con `git checkout HEAD -- CHECKPOINTS.md` (el usuario ya había commiteado feature 46 como `c0586d7`, así que HEAD era un punto limpio) y reaplicado solo el bloque de la sección 47.
