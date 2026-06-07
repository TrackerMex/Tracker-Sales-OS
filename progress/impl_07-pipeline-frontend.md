# impl_07-pipeline-frontend

## Archivos creados

- `frontend/src/modules/pipeline/domain/pipeline.types.ts` — Reemplazado. Agrega `CreateDealInput`, `ChangeStageInput`, `PipelineGrouped`. Re-exporta `PipelineStage` de clients.types.
- `frontend/src/modules/pipeline/infrastructure/pipeline.api.ts` — `getPipelineBySeller`, `createDeal`, `changeStage`
- `frontend/src/modules/pipeline/application/hooks/usePipeline.ts` — useQuery con sellerId del store
- `frontend/src/modules/pipeline/application/hooks/useCreateDeal.ts` — useMutation, invalida ['pipeline']
- `frontend/src/modules/pipeline/application/hooks/useChangeStage.ts` — useMutation con variables {dealId, input}
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx` — Muestra clientName, amount (MXN), probability (badge), dropdown + botón Mover según ALLOWED_TRANSITIONS
- `frontend/src/modules/pipeline/presentation/components/KanbanColumn.tsx` — Header con color por stage, lista de DealCards, botón "+" para crear
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx` — 7 columnas Kanban scrollables, modal inline para crear deal, loading skeleton

## Archivos modificados

- `frontend/src/routes/_app/pipeline.tsx` — Reemplazado stub con import de PipelinePage

## Decisiones tomadas

- `PipelineStage` se reutilizó desde `clients/domain/clients.types.ts` (union type, no enum) — consistente con el resto del proyecto
- `ALLOWED_TRANSITIONS` definido localmente en DealCard.tsx (simple, sin over-engineering)
- Modal para crear deal usa clientId como texto libre (UUID); no hay lookup de clientes para mantener simplicidad
- `changedBy` toma `currentUser.username` del store
- sellerId resuelto con `currentUser?.sellerId ?? currentUser?.id ?? ''` (patrón existente en tasks)

## TypeScript

`pnpm tsc --noEmit` — PASÓ sin errores
