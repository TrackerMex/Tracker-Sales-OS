# Explore: Backend Tasks — Patrones del módulo activities

## Estructura de módulo (referencia: activities)

```
backend/src/modules/activities/
├── domain/
│   ├── entities/activity.entity.ts          ← entidad pura (extiende BaseEntity)
│   └── repositories/activity.repository.interface.ts
├── application/
│   ├── dtos/
│   │   ├── create-activity.dto.ts
│   │   ├── activity.dto.ts
│   │   └── get-activities-query.dto.ts
│   └── use-cases/
│       ├── create-activity.use-case.ts
│       ├── get-daily-activities.use-case.ts
│       └── create-activity.use-case.spec.ts
├── infrastructure/
│   ├── entities/activity.typeorm.entity.ts
│   └── repositories/activity.repository.impl.ts
├── presentation/activities.controller.ts
└── activities.module.ts
```

## Core types

**BaseEntity** (`backend/src/core/domain/base.entity.ts`):
```typescript
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**IRepository** (`backend/src/core/domain/repository.interface.ts`):
```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<{ data: T[]; total: number }>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}
```

**IUseCase** (`backend/src/core/domain/use-case.interface.ts`):
```typescript
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

## Patrón TypeORM entity

```typescript
@Entity('activities')
export class ActivityTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'seller_id' }) sellerId: string;
  @Column({ type: 'enum', enum: ActivityType }) type: ActivityType;
  @Column({ type: 'text' }) summary: string;
  @Column({ type: 'text', nullable: true }) discovery: string | null;
  @Column({ name: 'executed_at', type: 'timestamptz' }) executedAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
}
```

## Patrón de módulo

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ActivityTypeormEntity]), AuthModule],
  controllers: [ActivitiesController],
  providers: [
    { provide: ACTIVITY_REPOSITORY, useClass: ActivityRepositoryImpl },
    CreateActivityUseCase,
    GetDailyActivitiesUseCase,
  ],
  exports: [ACTIVITY_REPOSITORY],
})
export class ActivitiesModule {}
```

## app.module.ts ya importa TasksModule

```typescript
// backend/src/app.module.ts
imports: [
  ...,
  ActivitiesModule,
  TasksModule,   // <-- ya declarado
  PipelineModule,
  ...
]
```

## DB config

- `synchronize: true` en app.module.ts → no hay migrations, tablas se auto-crean
- Nombres tablas: snake_case plural (activities, tasks, clients, users)
- Nombres columnas: snake_case
- Soft delete: @DeleteDateColumn en todas las entidades
