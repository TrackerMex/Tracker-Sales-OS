# explore_03-users-sellers-frontend

Fecha: 2026-06-06

## Patrón auth (referencia)
```
frontend/src/modules/auth/
├── domain/auth.types.ts               (LoginRequest, LoginResponse)
├── application/hooks/useLogin.ts      (useMutation)
├── infrastructure/auth.api.ts         (axios)
└── presentation/pages/LoginPage.tsx   (react-hook-form + zod)
```

## TanStack Router
- Rutas protegidas en `frontend/src/routes/_app.tsx` con beforeLoad + redirect
- Archivo de ruta de equipo: `frontend/src/routes/_app/equipo.tsx` (stub vacío, hay que reemplazar)

## Estado módulo equipo
- frontend/src/modules/equipo/ NO EXISTE — crear desde cero
- frontend/src/routes/_app/equipo.tsx tiene stub que retorna "Pendiente"

## Shared disponible
- `Button` en `frontend/src/components/ui/button.tsx`
- Store Zustand: `useAppStore` → { currentUser, accessToken, setAuth, clearAuth }
- Axios interceptor ya envía Bearer token automáticamente
- `UserRole` enum en `frontend/src/core/domain/types/common.types.ts`
- `PaginatedResponse<T>` en `frontend/src/core/domain/types/api-response.types.ts`

## Dependencias disponibles
- @tanstack/react-table (headless table)
- react-hook-form + zod
- @radix-ui/primitives

## Archivos a CREAR
```
frontend/src/modules/equipo/
├── domain/equipo.types.ts
├── application/hooks/
│   ├── useUsers.ts
│   ├── useSellers.ts
│   └── useBlockUser.ts
├── infrastructure/equipo.api.ts
└── presentation/
    ├── pages/EquipoPage.tsx
    └── components/
        ├── UsersTable.tsx
        └── SellersTable.tsx
```

## Archivo a MODIFICAR
- `frontend/src/routes/_app/equipo.tsx` — reemplazar stub con EquipoPage real

## Protección de ruta
- beforeLoad: verificar token (redirect /login si no hay)
- En componente: verificar role Admin|Director (mostrar "Acceso denegado" si es Seller)
