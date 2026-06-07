# impl_14-settings

## Archivos creados

### Backend
- `backend/src/modules/settings/infrastructure/entities/setting.typeorm.entity.ts` — tabla `settings` con id, key (unique), value (jsonb), updated_at
- `backend/src/modules/settings/application/dtos/update-settings.dto.ts` — DTO con class-validator para los 4 campos numéricos
- `backend/src/modules/settings/application/use-cases/get-settings.use-case.ts` — OnModuleInit pre-carga; cache en memoria; crea row con DEFAULT_SETTINGS si no existe
- `backend/src/modules/settings/application/use-cases/update-settings.use-case.ts` — upsert por key, invalida cache y re-fetch

### Backend modificados
- `backend/src/modules/settings/presentation/settings.controller.ts` — reemplazado stub; GET (Admin+Director), PATCH (Admin only)
- `backend/src/modules/settings/settings.module.ts` — TypeOrmModule + AuthModule + providers + exports GetSettingsUseCase

### Frontend
- `frontend/src/modules/settings/domain/settings.types.ts` — AppSettings, UpdateSettingsInput
- `frontend/src/modules/settings/infrastructure/settings.api.ts` — GET/PATCH usando `{ api }` de @/shared/lib/axios
- `frontend/src/modules/settings/application/hooks/useSettings.ts` — useQuery queryKey ['settings']
- `frontend/src/modules/settings/application/hooks/useUpdateSettings.ts` — useMutation + invalidateQueries
- `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx` — formulario 4 campos, modo readonly para no-Admin, feedback "Configuración guardada"

### Frontend modificados
- `frontend/src/routes/_app/configuracion.tsx` — reemplazado placeholder con SettingsPage

## Decisiones
- Cache en memoria en GetSettingsUseCase (OnModuleInit + invalidate pattern) — evita DB round-trip por cada GET
- upsert por columna `key` en UpdateSettingsUseCase
- axios: import nombrado `{ api }` (consistente con otros módulos del proyecto)
- Rol: solo UserRole.Admin puede hacer PATCH; Admin y Director pueden GET

## Resultado tsc
- Backend: sin errores
- Frontend: sin errores
