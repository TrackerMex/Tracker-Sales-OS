# impl: sales edit/delete

Date: 2026-06-16

## Files created (backend)

- `backend/src/modules/sales/application/dtos/update-sale.dto.ts`
  All fields optional; uses `@IsIn` for clientType (matching create-sale.dto.ts), `@IsInt` for units.

- `backend/src/modules/sales/application/use-cases/update-sale.use-case.ts`
  Injects `SALE_REPOSITORY` with `@Inject`. Finds sale, applies partial updates, returns `SaleResponseDto.fromEntity`.

- `backend/src/modules/sales/application/use-cases/delete-sale.use-case.ts`
  Injects `SALE_REPOSITORY`. Finds sale, calls `saleRepo.softDelete(saleId)`.

## Files modified (backend)

- `backend/src/modules/sales/presentation/sales.controller.ts`
  Added `PATCH /sales/:id` and `DELETE /sales/:id` endpoints.
  Both guarded by `@Roles(UserRole.Admin, UserRole.Director)`.
  Injected `UpdateSaleUseCase` and `DeleteSaleUseCase` in constructor.

- `backend/src/modules/sales/sales.module.ts`
  Added `UpdateSaleUseCase` and `DeleteSaleUseCase` to `providers` array.

## Files modified (frontend)

- `frontend/src/modules/sales/domain/sales.types.ts`
  Added `UpdateSaleInput` interface.

- `frontend/src/modules/sales/infrastructure/sales.api.ts`
  Added `updateSale(id, input)` and `deleteSale(id)` methods.

## Files created (frontend)

- `frontend/src/modules/sales/application/hooks/useUpdateSale.ts`
  Mutation hook, invalidates `['sales']` on success.

- `frontend/src/modules/sales/application/hooks/useDeleteSale.ts`
  Mutation hook, invalidates `['sales']` on success.

- `frontend/src/modules/sales/presentation/components/EditSaleModal.tsx`
  Modal with pre-filled form. Shows fields by `sale.type`:
  - `direction`: date, clientName, units, amount, notes
  - `atc`: date, units, amount, notes
  - `seller`: all fields including product, pay, source
  Uses `useApiFormErrors` + `FormErrorSummary`. Calls `onClose` on success.

## Files modified (frontend)

- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
  Added `editingSale` state, `useDeleteSale` import, `EditSaleModal` import.
  Each sale row shows Editar/Eliminar buttons when `isAdminOrDirector`.
  Modal renders at bottom of JSX when `editingSale` is set.

## TypeScript check results

- Backend: 0 errors
- Frontend: 0 errors
