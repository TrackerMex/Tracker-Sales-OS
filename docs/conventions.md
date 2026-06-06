# Convenciones — Tracker Sales OS

## Naming

### Backend
- Archivos: `kebab-case.ts` (ej: `create-activity.use-case.ts`)
- Clases: `PascalCase` (ej: `CreateActivityUseCase`)
- Interfaces: prefijo `I` (ej: `IActivityRepository`)
- Tokens de inyección: `SCREAMING_SNAKE_CASE` como const string (ej: `ACTIVITY_REPOSITORY`)
- Enums: `PascalCase` con valores en español cuando corresponda al dominio

### Frontend
- Archivos de componentes: `PascalCase.tsx` (ej: `LoginPage.tsx`)
- Archivos de hooks: `useNombre.ts` (ej: `useLogin.ts`)
- Archivos de API: `<module>.api.ts` (ej: `auth.api.ts`)
- Archivos de tipos: `<module>.types.ts` (ej: `auth.types.ts`)

---

## Estructura de módulo backend

```
modules/<name>/
├── domain/
│   ├── entities/<name>.entity.ts        ← Entidad pura (SIN TypeORM)
│   └── repositories/<name>.repository.interface.ts
├── application/
│   ├── use-cases/
│   │   └── create-<name>.use-case.ts   ← Implementa IUseCase<I,O>
│   └── dtos/
│       └── create-<name>.dto.ts        ← class-validator decorators
├── infrastructure/
│   ├── entities/<name>.typeorm.entity.ts ← @Entity TypeORM
│   └── repositories/<name>.repository.impl.ts ← Implementa IXRepository
├── presentation/
│   └── <name>.controller.ts            ← Solo llama use-cases
└── <name>.module.ts
```

**Regla de oro**: Las importaciones solo van "hacia adentro":
- `presentation` → `application` → `domain`
- `infrastructure` → `domain`
- NUNCA `domain` → `infrastructure`

---

## Estructura de módulo frontend

```
modules/<name>/
├── domain/<name>.types.ts               ← Interfaces TypeScript puras
├── application/hooks/use<Name>.ts       ← TanStack Query (useQuery/useMutation)
├── infrastructure/<name>.api.ts         ← Llamadas axios (solo aquí)
└── presentation/
    ├── pages/<Name>Page.tsx
    └── components/<ComponentName>.tsx
```

**Regla**: Las llamadas `api.*` solo van en `infrastructure/*.api.ts`. Los hooks importan de `infrastructure`. Los componentes importan de `application/hooks`.

---

## Módulo backend: cómo agregar una feature

1. Crear entidad en `domain/entities/`
2. Crear interface de repositorio en `domain/repositories/`
3. Crear DTOs en `application/dtos/` con `class-validator`
4. Crear use-cases en `application/use-cases/` implementando `IUseCase`
5. Crear TypeORM entity en `infrastructure/entities/`
6. Crear repository impl en `infrastructure/repositories/`
7. Crear controller en `presentation/`
8. Registrar todo en `<module>.module.ts`
9. Importar el módulo en `app.module.ts`

---

## Módulo frontend: cómo agregar una feature

1. Definir tipos en `domain/<name>.types.ts`
2. Crear función API en `infrastructure/<name>.api.ts`
3. Crear hook en `application/hooks/use<Name>.ts` con TanStack Query
4. Crear componente/página en `presentation/`
5. Crear/actualizar ruta en `routes/_app/<name>.tsx`
6. Registrar la ruta en `App.tsx` dentro del árbol de rutas

---

## Commits

Formato: `type(scope): description` en inglés

```
feat(auth): add JWT authentication guard
fix(activities): correct points calculation for Cierre type
refactor(clients): extract anti-duplicate check to repository
test(activities): add unit tests for quality calculation
chore: update docker-compose postgres healthcheck
```

---

## Tests

- **Unit tests**: en el mismo directorio del archivo a testear, sufijo `.spec.ts`
- **E2E tests**: en `backend/test/`, sufijo `.e2e-spec.ts`
- Cada use-case DEBE tener su spec
- Mockear SOLO el repositorio (no el DB directamente)

---

## Variables de entorno

Siempre documentar en `.env.example`. Nunca hardcodear valores en código.
Usar `process.env.NOMBRE` en backend, `import.meta.env.VITE_NOMBRE` en frontend.

---

## TypeORM

- Usar `softDelete` (campo `deletedAt`) en todas las entidades
- Migraciones en `backend/src/database/migrations/`
- `TYPEORM_SYNCHRONIZE=false` en producción — siempre usar migrations
- Nombres de tablas: `snake_case` plural (ej: `audit_logs`)
- Nombres de columnas: `snake_case` (ej: `seller_id`)
