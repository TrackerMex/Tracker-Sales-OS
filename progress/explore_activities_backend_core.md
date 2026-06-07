# Explore: Backend Core Contracts + Patrón Módulo Clients

## 1. BaseEntity

**Path:** `backend/src/core/domain/base.entity.ts`

```typescript
export abstract class BaseEntity {
  id: string;           // UUID
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // soft delete
}
```

## 2. IRepository<T>

**Path:** `backend/src/core/domain/repository.interface.ts`

```typescript
export interface FindAllOptions {
  page?: number;
  limit?: number;
  where?: Record<string, unknown>;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<{ data: T[]; total: number }>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}
```

## 3. IUseCase<TInput, TOutput>

**Path:** `backend/src/core/domain/use-case.interface.ts`

```typescript
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

## 4. Patrón Módulo Clients (referencia)

### Estructura de archivos
```
clients/
├── domain/
│   ├── entities/client.entity.ts          (ClientEntity, ContactEntity extienden BaseEntity)
│   └── repositories/client.repository.interface.ts  (IClientRepository + CLIENT_REPOSITORY token)
├── application/
│   ├── dtos/client.dto.ts
│   └── use-cases/
│       ├── create-client.use-case.ts
│       ├── get-clients.use-case.ts
│       ├── update-client.use-case.ts
│       └── add-contact.use-case.ts
├── infrastructure/
│   ├── entities/
│   │   ├── client.typeorm.entity.ts
│   │   └── contact.typeorm.entity.ts
│   └── repositories/client.repository.impl.ts
├── presentation/clients.controller.ts
└── clients.module.ts
```

### Patrón de inyección (token string)
```typescript
// domain/repositories/
export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';
export interface IClientRepository extends IRepository<ClientEntity> { ... }

// application/use-cases/
@Injectable()
export class CreateClientUseCase implements IUseCase<CreateClientInput, ClientDto> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}
}

// clients.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([ClientTypeormEntity, ContactTypeormEntity]), AuthModule],
  controllers: [ClientsController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: ClientRepositoryImpl },
    GetClientsUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    AddContactUseCase,
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
```

## 5. App.module.ts

`ActivitiesModule` ya está importado en `app.module.ts` (placeholder vacío por implementar).
`autoLoadEntities: true` — detecta entidades @Entity automáticamente.

## Resumen de patrones clave

| Aspecto | Patrón |
|---------|--------|
| Entidades | Extienden BaseEntity |
| Repositorios | Interface + token string para inyección |
| Use Cases | IUseCase<Input, Output> + @Injectable() |
| DTOs | class-validator decorators |
| Módulo | forFeature() + binding token en providers |
| Soft delete | @DeleteDateColumn en TypeORM entity |
