# impl_11-coaching

## Status: done

## Backend

### New files
- `backend/src/modules/coaching/application/dtos/coaching-daily.dto.ts` — CoachingDailyDto class + ActivityMixItem interface
- `backend/src/modules/coaching/application/use-cases/get-coaching-daily.use-case.ts` — IUseCase<string, CoachingDailyDto>, queries ActivityTypeormEntity + TaskTypeormEntity + SellerTypeormEntity in parallel

### Modified files
- `backend/src/modules/coaching/presentation/coaching.controller.ts` — added JwtAuthGuard, injected GetCoachingDailyUseCase, wired GET /coaching/seller/:id/daily
- `backend/src/modules/coaching/coaching.module.ts` — added TypeOrmModule.forFeature for 3 entities + AuthModule + GetCoachingDailyUseCase provider

## Frontend

### New files
- `frontend/src/modules/coaching/domain/coaching.types.ts` — CoachingDaily + ActivityMixItem interfaces
- `frontend/src/modules/coaching/infrastructure/coaching.api.ts` — coachingApi.getDailyReport(sellerId)
- `frontend/src/modules/coaching/application/hooks/useCoachingDaily.ts` — TanStack Query hook
- `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx` — admin selector + progress bar + quality score + activity mix table + chips + insights

### Modified files
- `frontend/src/routes/_app/coaching.tsx` — wired CoachingPage component

## Checks
- `tsc --noEmit` backend: pass
- `tsc --noEmit` frontend: pass
