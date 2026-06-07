# impl_03-users-sellers

Date: 2026-06-06
Status: DONE — pnpm tsc --noEmit passes on both backend and frontend

## Files created / modified

### Backend — Sellers module
- `backend/src/modules/sellers/infrastructure/entities/seller.typeorm.entity.ts` (NEW)
- `backend/src/modules/sellers/infrastructure/repositories/seller.repository.impl.ts` (NEW)
- `backend/src/modules/sellers/application/dtos/seller.dto.ts` (NEW)
- `backend/src/modules/sellers/application/use-cases/get-sellers.use-case.ts` (NEW)
- `backend/src/modules/sellers/application/use-cases/create-seller.use-case.ts` (NEW)
- `backend/src/modules/sellers/application/use-cases/deactivate-seller.use-case.ts` (NEW)
- `backend/src/modules/sellers/presentation/sellers.controller.ts` (REWRITTEN)
- `backend/src/modules/sellers/sellers.module.ts` (REWRITTEN)

### Backend — Users module (new)
- `backend/src/modules/users/application/dtos/user.dto.ts` (NEW)
- `backend/src/modules/users/application/use-cases/get-users.use-case.ts` (NEW)
- `backend/src/modules/users/application/use-cases/create-user.use-case.ts` (NEW)
- `backend/src/modules/users/application/use-cases/block-user.use-case.ts` (NEW)
- `backend/src/modules/users/presentation/users.controller.ts` (NEW)
- `backend/src/modules/users/users.module.ts` (NEW)

### Backend — Fixes
- `backend/src/modules/auth/infrastructure/repositories/user.repository.impl.ts` — fixed findAll() with pagination + arrow function in map
- `backend/src/app.module.ts` — added UsersModule

### Frontend — Equipo module
- `frontend/src/modules/equipo/domain/equipo.types.ts` (NEW)
- `frontend/src/modules/equipo/infrastructure/equipo.api.ts` (NEW)
- `frontend/src/modules/equipo/application/hooks/useUsers.ts` (NEW)
- `frontend/src/modules/equipo/application/hooks/useSellers.ts` (NEW)
- `frontend/src/modules/equipo/application/hooks/useBlockUser.ts` (NEW)
- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx` (NEW)
- `frontend/src/routes/_app/equipo.tsx` (UPDATED — imports EquipoPage)

## Key decisions
- axios.ts exports named `api`, not default — equipo.api.ts uses named import
- UserRole imported from auth entity in backend DTOs (not duplicated)
- DeactivateSellerUseCase injects USER_REPOSITORY to block linked user login
- BlockUserUseCase toggles active (not forced to false) — reusable for both block and unblock
- IUseCase path: `../../../../core/domain/use-case.interface` (relative from use-cases/ to src/core/)

## Type errors fixed
- Path depth for IUseCase import was initially one level too deep (5 vs 4 `../`)
