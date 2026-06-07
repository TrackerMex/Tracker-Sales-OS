# explore_03-users-sellers-backend

Fecha: 2026-06-06

## Estado actual por módulo

### Auth Module (COMPLETO)
- `UserEntity`: id, username, passwordHash, name, role: UserRole, sellerId: string|null, active: boolean
- `IUserRepository`: findById, findByUsername, findAll, create, update, softDelete
- `UserRepositoryImpl`: PROBLEMA — findAll() no respeta paginación (ignora page/limit)
- `LoginUseCase`: PROBLEMA — no valida seller.active al hacer login
- AuthModule exports: USER_REPOSITORY, JwtAuthGuard, RolesGuard, JwtModule

### Sellers Module (DOMINIO OK, INFRA FALTA)
- `SellerEntity`: id, name, profile: string|null, userId: string|null, active: boolean
- `ISellerRepository`: findAllActive() + hereda IRepository
- FALTA: seller.typeorm.entity.ts, seller.repository.impl.ts
- sellers.controller.ts: esqueleto con throws (hay que reescribir)
- sellers.module.ts: vacío

### Users Module (NO EXISTE)
- No existe backend/src/modules/users/

## Archivos a CREAR (19)

### Users Module (10)
1. users/domain/entities/user.entity.ts — reexport desde auth
2. users/domain/repositories/user.repository.interface.ts — reexport token + interfaz desde auth
3. users/application/dtos/user.dto.ts — UserDto (sin passwordHash), PaginatedUsersDto
4. users/application/dtos/create-user.dto.ts — CreateUserDto (username, password, name, role, sellerId?)
5. users/application/dtos/block-user.dto.ts — (solo usa id via param)
6. users/application/use-cases/get-users.use-case.ts
7. users/application/use-cases/create-user.use-case.ts
8. users/application/use-cases/block-user.use-case.ts
9. users/presentation/users.controller.ts
10. users/users.module.ts

### Sellers Module (9)
11. sellers/infrastructure/entities/seller.typeorm.entity.ts
12. sellers/infrastructure/repositories/seller.repository.impl.ts
13. sellers/application/dtos/seller.dto.ts — SellerDto, CreateSellerDto
14. sellers/application/use-cases/get-sellers.use-case.ts
15. sellers/application/use-cases/create-seller.use-case.ts
16. sellers/application/use-cases/deactivate-seller.use-case.ts
17. sellers/presentation/sellers.controller.ts (REESCRIBIR)
18. sellers/sellers.module.ts (COMPLETAR)

## Archivos a MODIFICAR (3)
1. auth/infrastructure/repositories/user.repository.impl.ts — agregar paginación real
2. auth/application/use-cases/login.use-case.ts — validar seller.active
3. app.module.ts — importar UsersModule y SellersModule

## Relación entidades
- UserEntity.sellerId → SellerEntity.id (FK opcional)
- SellerEntity.userId → UserEntity.id (FK inverso opcional)
- "Seller bloqueado" = SellerEntity.active === false
