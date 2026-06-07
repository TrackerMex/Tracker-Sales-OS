# impl_07-pipeline-backend

## Status
tsc --noEmit: PASS (0 errors)

## Archivos creados

- `backend/src/modules/pipeline/infrastructure/entities/deal.typeorm.entity.ts`
  TypeORM entity con tabla `deals`, campos: id (uuid), client_id, seller_id, stage (enum PipelineStage), amount (decimal), probability (int), stage_history (jsonb), timestamps con softDelete.

- `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts`
  Implementa IDealsRepository. Mapper toDomain() convierte amount a Number() ya que TypeORM devuelve decimals como string.

- `backend/src/modules/pipeline/infrastructure/interceptors/audit.interceptor.ts`
  Loguea request body y stage resultante en cada cambio de etapa.

- `backend/src/modules/pipeline/application/dtos/create-deal.dto.ts`
  clientId (IsUUID), sellerId (IsUUID), amount (IsNumber, Min 0, opcional), stage (IsEnum, opcional).

- `backend/src/modules/pipeline/application/dtos/change-stage.dto.ts`
  newStage (IsEnum PipelineStage), changedBy (IsString).

- `backend/src/modules/pipeline/application/dtos/deal.dto.ts`
  DTO de respuesta con static fromEntity(entity: DealEntity): DealDto.

- `backend/src/modules/pipeline/application/use-cases/create-deal.use-case.ts`
  Crea deal con stage=Prospecto por defecto, probability desde STAGE_PROBABILITY, stageHistory=[].

- `backend/src/modules/pipeline/application/use-cases/get-pipeline-by-seller.use-case.ts`
  Retorna Record<PipelineStage, DealDto[]> con todos los deals del seller agrupados por etapa.

- `backend/src/modules/pipeline/application/use-cases/change-deal-stage.use-case.ts`
  Valida transición via ALLOWED_TRANSITIONS, lanza BadRequestException si no permitida, append StageHistoryEntry, actualiza probability, guarda.

## Archivos modificados

- `backend/src/modules/pipeline/presentation/pipeline.controller.ts`
  PipelineController: GET /pipeline/seller/:id, POST /pipeline/deals.
  DealsController: PATCH /deals/:id/stage con AuditInterceptor.

- `backend/src/modules/pipeline/pipeline.module.ts`
  Registra TypeOrmModule, AuthModule, DealRepositoryImpl, 3 use cases, 2 controllers. Exporta DEAL_REPOSITORY.

## Decisiones

- TypeORM decimal se convierte a Number en toDomain() para evitar strings en el DTO.
- PipelineStage importado de clients/domain para no duplicar el enum.
- AuditInterceptor en infrastructure/interceptors siguiendo separación de capas.
- ChangeStageDtoBody como nombre de clase para evitar conflicto con ChangeStageDto futuro.
