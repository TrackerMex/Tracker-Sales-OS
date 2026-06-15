# Feature 26 — Wiring clientId a sugerencias IA

Tarea frontend-only: cablear `clientId` al endpoint `POST /api/coaching/suggestion`.
El backend ya acepta `clientId`/`sellerId` opcionales; `sellerId` se toma del JWT como
fallback, por lo que el frontend solo envía `clientId`.

## Archivos modificados

### 1. `frontend/src/modules/coaching/infrastructure/coaching.api.ts`
En el tipo del parámetro `dto` de `getSuggestion`, se agregaron dos campos opcionales al final:

```ts
    clientId?: string;
    sellerId?: string;
```

### 2. `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
Dentro de `fetchAiSuggestions`, en el objeto pasado a `coachingApi.getSuggestion({...})`:

```ts
        clientId: clientId || undefined,
```

### 3. `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
Dentro de `fetchAiSuggestions`, en el objeto pasado a `coachingApi.getSuggestion({...})`:

```ts
        clientId: clientId || undefined,
```

## Verificación

`cd frontend && pnpm exec tsc --noEmit` → exit code 0 (sin errores de tipos).
