# Explore: Frontend Tasks — Patrones del módulo activities

## Estructura de módulo (referencia: activities)

```
frontend/src/modules/activities/
├── domain/activities.types.ts
├── infrastructure/activities.api.ts
├── application/hooks/
│   ├── useCreateActivity.ts
│   └── useDailyActivities.ts
└── presentation/
    ├── pages/ActivitiesPage.tsx
    └── components/ActivityForm.tsx
```

## Patrón de tipos (domain)

```typescript
// activities.types.ts
export type ActivityResult = "Interesado" | "No contestó" | ...

export interface Activity {
  id: string
  sellerId: string
  clientId: string
  type: ActivityType
  result: ActivityResult
  summary: string
  points: number
  quality: number
  executedAt: string
  createdAt: string
}

export interface CreateActivityInput {
  clientId: string
  type: ActivityType
  result: ActivityResult
  summary: string
  executedAt: string
}
```

## Patrón de API (infrastructure)

```typescript
// activities.api.ts
import api from '@/shared/lib/axios'

export const activitiesApi = {
  createActivity: (sellerId: string, input: CreateActivityInput) =>
    api.post<Activity>('/activities', { ...input, sellerId }).then(r => r.data),
  
  getDailyActivities: (sellerId: string, date?: string) =>
    api.get<DailyActivitiesResponse>(`/activities/seller/${sellerId}/daily`, 
       { params: { date } }).then(r => r.data),
}
```

## Patrón de hook (application)

```typescript
// useCreateActivity.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/shared/store/app.store'
import { activitiesApi } from '../../infrastructure/activities.api'

export const useCreateActivity = () => {
  const queryClient = useQueryClient()
  const currentUser = useAppStore(s => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''

  return useMutation({
    mutationFn: (input: CreateActivityInput) => 
      activitiesApi.createActivity(sellerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

## Sistema de rutas (TanStack Router)

```
frontend/src/routes/
├── __root.tsx
├── index.tsx
├── login.tsx
└── _app.tsx               ← layout protegido con AppLayout + auth check
    ├── dashboard.tsx
    ├── mi-dia.tsx
    ├── actividades.nueva.tsx
    ├── clientes.tsx
    ├── agenda.tsx          ← AQUÍ va la página de tareas
    ├── pipeline.tsx
    └── ...
```

Patrón de ruta:
```typescript
// routes/_app/agenda.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AgendaPage } from '@/modules/tasks/presentation/pages/AgendaPage'

export const Route = createFileRoute('/_app/agenda')({
  component: AgendaPage,
})
```

## Store Zustand

```typescript
// shared/store/app.store.ts
interface AppState {
  currentUser: { id: string; sellerId?: string; role: string } | null
  accessToken: string | null
  // ...
}
const useAppStore = create<AppState>(...)
```

Obtener sellerId en hooks:
```typescript
const currentUser = useAppStore(s => s.currentUser)
const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''
```

## Axios config (shared/lib/axios.ts)

```typescript
// Base: ${import.meta.env.VITE_API_URL}/api
// Interceptor: agrega Authorization: Bearer {token}
// 401: logout + redirect /login
```

## Colores de marca

- trackerBlue: `#002B49`
- trackerGreen: `#82bc00`
- execPurple: `#5b21b6`

## Componentes shared disponibles

- AppLayout (sidebar + header + outlet)
- shadcn/ui: Button, Input, Textarea, Select, Badge, Card
- Tailwind v4
