# Implementacion 04-clients

## Files changed
- backend/src/modules/clients/domain/repositories/client.repository.interface.ts
- backend/src/modules/clients/application/dtos/client.dto.ts
- backend/src/modules/clients/application/use-cases/create-client.use-case.ts
- backend/src/modules/clients/application/use-cases/get-clients.use-case.ts
- backend/src/modules/clients/application/use-cases/update-client.use-case.ts
- backend/src/modules/clients/application/use-cases/add-contact.use-case.ts
- backend/src/modules/clients/infrastructure/entities/client.typeorm.entity.ts
- backend/src/modules/clients/infrastructure/entities/contact.typeorm.entity.ts
- backend/src/modules/clients/infrastructure/repositories/client.repository.impl.ts
- backend/src/modules/clients/presentation/clients.controller.ts
- backend/src/modules/clients/clients.module.ts
- frontend/src/modules/clients/domain/clients.types.ts
- frontend/src/modules/clients/infrastructure/clients.api.ts
- frontend/src/modules/clients/application/hooks/useClients.ts
- frontend/src/modules/clients/application/hooks/useCreateClient.ts
- frontend/src/modules/clients/application/hooks/useUpdateClient.ts
- frontend/src/modules/clients/application/hooks/useAddContact.ts
- frontend/src/modules/clients/presentation/pages/ClientesPage.tsx
- frontend/src/routes/_app/clientes.tsx

## Behavior implemented
- Added protected clients API endpoints with JwtAuthGuard and RolesGuard for Admin, Director, and Seller.
- POST /api/clients creates clients/prospects with contact creation and anti-duplicate checks by company name, domain, contact phone, and contact email.
- GET /api/clients supports stage, type, seller, q, page, and limit filters. Seller users are restricted to their own sellerId.
- PATCH /api/clients/:id updates client fields including stage and nextStep, with seller access control and duplicate checks for name/domain changes.
- POST /api/clients/:id/contacts adds contacts with duplicate validation by phone/email and seller access control.
- Added TypeORM clients and contacts tables with snake_case names/columns and soft delete timestamps.
- Added frontend clients API, TanStack Query hooks, and /clientes page with cards, full-text search, filters, create form, stage/nextStep updates, and add-contact form.

## Verification
- Backend: `npm.cmd exec tsc -- --noEmit` from backend passed. npm printed warnings for unknown project config `node-linker` and `shamefully-hoist`.
- Frontend: `npm.cmd exec tsc -- --noEmit` from frontend passed. npm printed the same config warnings.

## Caveats
- No tests were edited or added because this Implementer scope explicitly forbids test file edits.
- Admin/Director client creation requires a sellerId in the request because no seller picker endpoint was added in this scope.
- Existing unrelated working-tree changes were observed in feature_list.json and progress/current.md; they were not modified by this implementation.
