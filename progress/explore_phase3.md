# Explore — Fase 3 (Hardening) — verificación previa

**Fecha**: 2026-06-11
**Origen**: progress/improve_plan.md, Fase 3

## 3.1 AuditInterceptor — EXISTE, cerrar bug #3

- `backend/src/modules/pipeline/infrastructure/interceptors/audit.interceptor.ts` — guarda `oldValues`/`newValues` (stage) en `audit_logs` vía `AuditLogTypeormEntity`, con userId del JWT.
- Entidad: `backend/src/core/infrastructure/entities/audit-log.typeorm.entity.ts`.
- Aplicado en `pipeline.controller.ts`.
- **Pendiente solo verificación runtime** (cambiar stage → row en audit_logs) — cubrir en smoke 3.5.

## 3.2 dailyCallsGoal hardcoded — CONFIRMADO

- `backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts:134` → `dailyCallsGoal: 10` literal.
- `dailyMinPoints` ya es dinámico (bug #1 cerrado); mismo patrón a replicar.
- Settings actual: `backend/src/modules/settings/domain/entities/setting.entity.ts` (default `dailyMinPoints: 30`), DTO `update-settings.dto.ts` con `@IsOptional() @IsNumber() @Min(1)`.
- Falta: campo `dailyCallsGoal` en entity + DTO + default (10) + uso en get-mi-dia + input en SettingsPage frontend.

## 3.3 403s con rol Seller — CONFIRMADO, hooks sin gating

- `frontend/src/modules/equipo/application/hooks/useSellers.ts` — `useQuery` sin `enabled`; `GET /sellers` es Admin/Director-only.
- `frontend/src/modules/settings/application/hooks/useSettings.ts` — igual con `GET /settings`.
- Consumidores que un Seller visita:
  - `clients/presentation/pages/ClientesPage.tsx:125` → useSellers
  - `coaching/presentation/pages/CoachingPage.tsx:167,170` → useSettings + useSellers
  - (`equipo/EquipoPage.tsx` y `settings/SettingsPage.tsx` ya ocultos del nav por RBAC, pero gating igual aplica)
- Rol disponible en `frontend/src/shared/store/app.store.ts` → `useAppStore((s) => s.currentUser?.role)`. Tipo `UserRole` en `frontend/src/core` (const object tras fix erasableSyntaxOnly).
- Fix: `enabled: role === 'Admin' || role === 'Director'` en ambos hooks (o parámetro), y que las páginas toleren `data === undefined` (ya tienen fallbacks según qa_smoke).
- Nota CoachingPage: usa settings para `minDaily` — para Seller el dato viene del endpoint de coaching report, verificar fallback.

## 3.4 Error feedback en forms — IMPLEMENTADO

- `progress/impl_error_feedback.md`: parser `api-errors.ts` + `FormErrorSummary` + `FieldError` integrados en ClientesPage, ActivityForm, CreateTaskForm, SalesPage (3 forms), SettingsPage, LoginPage. Build PASS 2026-06-09.
- Falta: marcar estado done + verificación E2E en smoke 3.5 (criterios: 400 visible, 401 login, red caída).

## 3.5 Smoke E2E

- Seed `progress/seed_test_users.sql` ya corregido (UUIDs v4, commit ef43d83).
- Tras fixes 3.2 + 3.3: correr qa-tester (3 roles) validando: sin 403 en consola como Seller, error feedback visible, audit_logs poblado al mover deal, dailyCallsGoal dinámico.

## Plan de delegación

1. Implementer: 3.2 (backend settings + mi-dia + SettingsPage) y 3.3 (gating hooks) en un solo lote — cambios chicos, sin conflicto.
2. Reviewer: validar build + criterios.
3. qa-tester: smoke 3.5 cierra todo (incl. 3.1 runtime y 3.4 E2E).
