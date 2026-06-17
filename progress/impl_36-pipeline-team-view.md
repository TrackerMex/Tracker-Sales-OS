# impl_36 — Pipeline vista equipo completo para Admin/Director

**Estado**: completado
**Fecha**: 2026-06-17

## Cambios backend

### `backend/src/modules/pipeline/domain/repositories/deal.repository.interface.ts`
- Añadido método `findDetailedAllSellers()` al interface `IDealsRepository`

### `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts`
- Importado `IsNull` de typeorm
- Implementado `findDetailedAllSellers()`: igual a `findDetailedBySellerId` pero sin filtro `sellerId` en el query; usa `where: { deletedAt: IsNull() }`

### `backend/src/modules/pipeline/application/use-cases/get-pipeline-team.use-case.ts` (nuevo)
- `GetPipelineTeamUseCase`: llama `findDetailedAllSellers()` y agrupa por stage

### `backend/src/modules/pipeline/presentation/pipeline.controller.ts`
- Inyectado `GetPipelineTeamUseCase`
- Nuevo endpoint `GET /pipeline/team` con roles Admin/Director, colocado antes de `GET /pipeline/seller/:id`

### `backend/src/modules/pipeline/pipeline.module.ts`
- Registrado `GetPipelineTeamUseCase` en `providers` y `exports`

### `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`
- Añadido `findDetailedAllSellers: jest.fn()` al mock de `IDealsRepository` para satisfacer el interface actualizado

## Cambios frontend

### `frontend/src/modules/pipeline/infrastructure/pipeline.api.ts`
- Añadido `getPipelineTeam()` apuntando a `GET /pipeline/team`

### `frontend/src/modules/pipeline/application/hooks/useTeamPipeline.ts` (nuevo)
- Hook `useTeamPipeline(enabled: boolean)` — query con key `['pipeline', 'team']`

### `frontend/src/modules/pipeline/application/hooks/usePipeline.ts`
- Modificado para aceptar `sellerIdOverride?: string | null`
- Si `null` → query deshabilitado; si `undefined` → usa sellerId del store (backward compat)

### `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- Detecta `isAdminOrDirector` via `currentUser.role`
- Estado `selectedSeller` persistido en `localStorage`
- `isTeamMode = isAdminOrDirector && selectedSeller === 'all'`
- Selector dropdown de vendedores visible solo para Admin/Director
- `activeGrouped/activeLoading/activeError` unifica ambos queries
- `KanbanBoard` recibe `teamMode` prop

### `frontend/src/modules/pipeline/presentation/components/KanbanColumn.tsx`
- Añadido `teamMode?: boolean` en props; propagado a `DealCard`

### `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
- Añadido `teamMode?: boolean` en props
- En teamMode: muestra `sellerName` como `<span class="tag tag-navy">`; en modo normal: texto gris sutil

## Resultado TS
- `backend pnpm tsc --noEmit`: exit 0
- `frontend pnpm tsc --noEmit`: exit 0
