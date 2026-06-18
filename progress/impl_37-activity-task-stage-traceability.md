# Feature 37 — Trazabilidad tarea→actividad + stage snapshot en pipeline

## Estado: COMPLETADO

## Archivos modificados

### Backend
- `backend/src/modules/activities/infrastructure/entities/activity.typeorm.entity.ts`
  - Columna `task_id` (varchar, nullable) añadida
- `backend/src/modules/activities/domain/entities/activity.entity.ts`
  - Campo `taskId: string | null` añadido a `ActivityEntity`
- `backend/src/modules/activities/application/dtos/activity.dto.ts`
  - Campos `stage: string | null` y `taskId: string | null` expuestos en el DTO
  - Mapeados en `fromEntity()`
- `backend/src/modules/activities/application/dtos/create-activity.dto.ts`
  - `@IsOptional() @IsUUID() taskId?: string` añadido
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`
  - Reemplazado bloque `if (input.stage && input.clientId)` por lógica condicional:
    - Sin `input.stage`: auto-snapshot del stage actual del deal
    - Con `input.stage` igual al deal: solo snapshot, sin avanzar
    - Con `input.stage` distinto al deal: avanzar pipeline
    - Sin deal existente: crear nuevo deal
  - `taskId` incluido en la creación de la entidad

### Frontend
- `frontend/src/modules/activities/domain/activities.types.ts`
  - `Activity`: añadidos `stage?: string | null` y `taskId?: string | null`
  - `CreateActivityInput`: añadido `taskId?: string`
- `frontend/src/routes/_app/actividades.nueva.tsx`
  - `validateSearch` incluye `taskId?: string`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`
  - Lee `clientId` y `taskId` del search
  - `showForm` se abre automáticamente si vienen `clientId` o `taskId`
  - Pasa `initialClientId` y `taskId` al `ActivityForm`
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
  - Props: `initialClientId` y `taskId` añadidas
  - Usa `usePipeline` para obtener el deal actual del cliente seleccionado
  - `useEffect` auto-llena el stage cuando cambia el deal (sin loop)
  - `clientId` inicializado desde `initialClientId`
  - `taskId` incluido en el submit
  - Indicador visual del stage actual del deal encima del select
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`
  - `handleComplete` pasa `taskId` en el navigate a `/actividades/nueva`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
  - Botón "Registrar avance" pasa `clientId` en el navigate
  - Historial de actividades muestra badge del stage junto al tipo/resultado

## Verificación
- `pnpm tsc --noEmit` en backend: exit 0
- `pnpm tsc --noEmit` en frontend: exit 0
- La columna `task_id` se creará automáticamente via `TYPEORM_SYNCHRONIZE=true` en dev
