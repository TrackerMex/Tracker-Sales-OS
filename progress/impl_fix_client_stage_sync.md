# Fix: sync de stage entre Clientes y Pipeline

## Problema
El card "Actualizar stage" en el detalle de cliente solo actualizaba `clients.stage`, pero el Kanban del pipeline lee `deals.stage`. No existía sync en ninguna dirección.

## Archivos modificados

### Backend
- `backend/src/modules/pipeline/application/use-cases/change-deal-stage.use-case.ts`
  - Inyecta `CLIENT_REPOSITORY` / `IClientRepository` (ya exportado por ClientsModule, que PipelineModule importa — no se tocó el module).
  - Tras `dealRepo.update(...)`, ejecuta `clientRepo.update(deal.clientId, { stage: input.newStage })` con guard `if (deal.clientId)`.
  - Sync deal → client: el drag en Kanban ahora actualiza también `clients.stage`.

### Frontend
- `frontend/src/modules/pipeline/domain/pipeline.types.ts`
  - Nuevo export `ALLOWED_TRANSITIONS` (espejo exacto del map del backend en `deal.entity.ts`).
- `frontend/src/modules/pipeline/application/hooks/useChangeStage.ts`
  - `onSuccess` invalida ahora `['pipeline']`, `['clients']` y `['client-deals']`.
- `frontend/src/modules/clients/application/hooks/useUpdateClient.ts`
  - `onSuccess` invalida también `['pipeline']` (el modal de edición permite cambiar stage).
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
  - Llama `useClientDeals(selectedClient?.id ?? null, selectedClient?.sellerId ?? null)` top-level (el hook ya tiene `enabled`).
  - `activeDeal` = último elemento del array (el repo devuelve deals ordenados por `createdAt ASC`, por lo que el último es el más reciente).
  - Con deal: los botones llaman `changeStage.mutate({ dealId, input: { newStage, changedBy: currentUser?.username ?? "" } })`; el stage activo mostrado es el del deal (fuente de verdad del pipeline); se deshabilitan el botón del stage actual y las transiciones no permitidas por `ALLOWED_TRANSITIONS` (estilo `opacity-40 cursor-not-allowed`).
  - Sin deal: conserva `updateClient.mutate({ stage })` con todos los botones habilitados.
  - Ambas rutas manejan `toast.success("Stage actualizado")` / `toast.error(...)` siguiendo el patrón del archivo.

## Decisiones
- El guard `if (deal.clientId)` es defensivo: la entidad tipa `clientId: string` no-nullable, pero protege contra datos legacy.
- No se creó helper compartido para el map de transiciones frontend/backend (viven en repos distintos de tipos); se documentó con comentario que es espejo del backend.

## Verificación
- Backend: `npx tsc --noEmit` — OK, sin errores.
- Frontend: `npx tsc --noEmit` — OK, sin errores.
- Tests: no existe spec para `ChangeDealStageUseCase` ni para el módulo clients (solo hay specs de auth/login y activities), así que no hubo mocks que actualizar ni tests relevantes que correr.

## Riesgos
- **Múltiples deals por cliente**: se toma el más reciente (`createdAt` mayor). Si un cliente tiene varias oportunidades abiertas, el card de detalle solo mueve la última; los demás deals se gestionan desde el Kanban. `clients.stage` reflejará el último deal movido (desde cualquiera de las dos vistas).
- Las dos escrituras (deal + client) no van en una transacción DB; si la segunda falla, el deal queda actualizado y el client no. Riesgo bajo (mismo request, update simple).
- Sin deal, el card sigue permitiendo cualquier salto de stage sobre `clients.stage` (comportamiento previo, intencional).
