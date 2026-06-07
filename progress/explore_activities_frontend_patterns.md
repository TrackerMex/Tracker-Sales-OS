# Explore: Patrones Frontend para Actividades

## 1. Estructura módulo clients (referencia)

```
frontend/src/modules/clients/
├── domain/clients.types.ts
├── infrastructure/clients.api.ts
├── application/hooks/
│   ├── useClients.ts         (useQuery)
│   ├── useCreateClient.ts    (useMutation)
│   ├── useUpdateClient.ts    (useMutation)
│   └── useAddContact.ts      (useMutation)
└── presentation/pages/ClientesPage.tsx
```

## 2. Zustand Store

**Path:** `frontend/src/shared/store/app.store.ts`

```typescript
interface AppState {
  currentUser: AuthUser | null
  accessToken: string | null
  sidebarOpen: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  toggleSidebar: () => void
}
```

- Persiste con middleware `persist`, nombre: `"tracker-sales-app"`
- Persiste solo `currentUser`; token en localStorage como `"accessToken"`
- Obtener sellerId: `const sellerId = currentUser?.sellerId`

## 3. Axios

**Path:** `frontend/src/shared/lib/axios.ts`

```typescript
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
  headers: { 'Content-Type': 'application/json' },
})
// Request: añade Authorization: Bearer {token} de localStorage
// Response: 401 → limpia localStorage y redirige a /login
```

Importar: `import { api } from "@/shared/lib/axios"`

## 4. Rutas en App.tsx

Ya existe placeholder: `nuevaActividadRoute` con path `/actividades/nueva`

Patrón de ruta:
```typescript
export const actividadesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/actividades',
  component: ActivitiesPage,
})
```

Rutas protegidas: `_app` verifica `localStorage.getItem('accessToken')` en `beforeLoad`.

## 5. Tipos core disponibles

**Path:** `frontend/src/core/domain/types/api-response.types.ts`
```typescript
ApiResponse<T>     → { data: T; message?: string }
PaginatedResponse<T> → { data: T[]; total: number; page: number; limit: number; totalPages: number }
ApiError          → { statusCode: number; message: string | string[]; error: string }
```

**Path:** `frontend/src/core/domain/types/common.types.ts`
```typescript
type ID = string
enum UserRole { Admin, Director, Seller }
interface AuthUser { id, username, name, role, sellerId }
```

## 6. Constants ya disponibles

**Path:** `frontend/src/shared/lib/constants.ts`
```typescript
TASK_POINTS = { Chat:1, WhatsApp:1, Correo:1, Llamada:3, Videoconferencia:6, ... Cierre:25 }
REQUIRES_NEXT_STEP = ['Llamada', 'Videoconferencia', 'Reunión virtual', 'Visita física', 'Reunión presencial', 'Propuesta']
DAILY_MIN_POINTS = 30
```

## 7. Patrón de hook (TanStack Query)

```typescript
// useQuery
export const useActivities = (filters) => useQuery({
  queryKey: ['activities', filters],
  queryFn: () => activitiesApi.getActivities(filters),
})

// useMutation
export const useCreateActivity = () => useMutation({
  mutationFn: activitiesApi.createActivity,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
})
```
