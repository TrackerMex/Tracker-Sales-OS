# Arquitectura — Tracker Sales OS FullStack

**Versión**: 2.0 (actualizada con Clean Architecture + gaps corregidos)  
**Última actualización**: 2026-06-05

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  React 19 + TypeScript + Tailwind v4 + TanStack Router/Query    │
│  Clean Architecture: core/ → modules/ → shared/                 │
│  - Auth, Clients, Activities, Tasks, Pipeline, Sales            │
│  - Dashboard, Mi Día, Coaching, Reports, Settings               │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTPS / REST
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                    API GATEWAY / Reverse Proxy                   │
│  Nginx (puerto 80) — /api → backend:3000, / → frontend:5173     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│  Backend API — NestJS 11 + TypeScript + PostgreSQL               │
│  Puerto: 3000 — Prefix: /api                                     │
│                                                                   │
│  Clean Architecture por módulo:                                   │
│  domain/ → application/ → infrastructure/ → presentation/        │
│                                                                   │
│  Módulos: auth, sellers, clients, activities, tasks,             │
│           pipeline, sales, coaching, reports, settings, dashboard│
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│  PostgreSQL 15 (Docker)                                          │
│  Tablas: users, sellers, clients, contacts, activities, tasks,  │
│          deals, sales, settings, audit_logs                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Clean Architecture — Capas

### Backend (por módulo)

```
modules/<name>/
├── domain/           ← Entidades puras (sin TypeORM), interfaces de repo
├── application/      ← Use-cases (IUseCase<I,O>), DTOs (class-validator)
├── infrastructure/   ← TypeORM entities, repository implementations
└── presentation/     ← NestJS controllers (solo llaman use-cases)

core/
├── domain/
│   ├── base.entity.ts           ← id, createdAt, updatedAt, deletedAt
│   ├── repository.interface.ts  ← IRepository<T> genérico
│   └── use-case.interface.ts    ← IUseCase<I,O>
└── application/
    └── pagination.dto.ts        ← PaginationDto, PaginatedResult<T>
```

### Frontend (por módulo)

```
modules/<name>/
├── domain/       ← Interfaces TypeScript puras
├── application/  ← Hooks con TanStack Query
├── infrastructure/ ← Llamadas axios (SOLO aquí)
└── presentation/ ← Pages y componentes React

core/domain/types/
├── api-response.types.ts  ← ApiResponse<T>, PaginatedResponse<T>
└── common.types.ts        ← ID, UserRole, AuthUser

shared/
├── components/layout/     ← AppLayout, Sidebar, Header
├── lib/
│   ├── axios.ts           ← Instancia con interceptors JWT
│   └── constants.ts       ← TASK_POINTS, PIPELINE_STAGES, etc.
└── store/app.store.ts     ← Zustand: currentUser, token, sidebarOpen
```

---

## Tablas y Relaciones

```
users
  id (uuid PK)
  username (unique)
  password_hash
  name
  role: Admin | Director | Seller
  seller_id (FK → sellers, nullable)
  active: boolean
  created_at, updated_at, deleted_at

sellers
  id (uuid PK)
  name
  profile (text, nullable)
  user_id (FK → users, nullable)
  active: boolean
  created_at, updated_at, deleted_at

clients
  id (uuid PK)
  name
  domain (nullable)
  type: Nuevo | Existente | Prospecto
  person: Moral | Física
  seller_id (FK → sellers)
  source: enum
  stage: enum (7 etapas)
  expected_amount: decimal
  units: integer
  pain (text, nullable)
  provider (text, nullable)
  next_step (text, nullable)
  next_date (date, nullable)
  next_time (time, nullable)
  created_at, updated_at, deleted_at

contacts
  id (uuid PK)
  client_id (FK → clients)
  name
  role (text)
  phone
  email
  is_decision_maker: boolean
  created_at, updated_at, deleted_at

activities
  id (uuid PK)
  seller_id (FK → sellers)
  client_id (FK → clients)
  contact_id (FK → contacts, nullable)
  type: enum (11 tipos)
  result: enum (8 resultados)
  summary (text)
  discovery (text, nullable)
  agreement (text, nullable)
  next_step (text, nullable)
  next_date (date, nullable)
  next_time (time, nullable)
  points: integer
  quality: integer (0-100)
  executed_at: timestamp
  programmed_at: timestamp (nullable)
  captured_at: timestamp
  delay_minutes: integer
  created_at, updated_at, deleted_at

tasks
  id (uuid PK)
  seller_id (FK → sellers)
  client_id (FK → clients)
  type: enum (mismo que activities)
  objective (text)
  scheduled_at: timestamp
  completed: boolean
  completed_at: timestamp (nullable)
  ai_suggestion (text, nullable)
  source_activity_id (FK → activities, nullable)
  created_at, updated_at, deleted_at

deals
  id (uuid PK)
  client_id (FK → clients)
  seller_id (FK → sellers)
  stage: enum (7 etapas)
  amount: decimal
  probability: integer (0-100)
  stage_history: jsonb   ← [{ stage, changedAt, changedBy }]
  created_at, updated_at, deleted_at

sales
  id (uuid PK)
  seller_id (FK → sellers)
  client_id (FK → clients)
  client_name
  client_type: Nuevo | Existente
  product
  units: integer
  amount: decimal
  pay: enum
  source: enum
  date: date
  notes (text, nullable)
  type: seller | atc | direction
  created_at, updated_at, deleted_at

settings
  id (uuid PK)
  key (unique)
  value: jsonb
  updated_at

audit_logs
  id (uuid PK)
  user_id (FK → users)
  action (text)
  entity (text)
  entity_id (text)
  old_values: jsonb (nullable)
  new_values: jsonb (nullable)
  created_at
```

---

## Flujo de Autenticación

```
POST /api/auth/login { username, password }
  ↓
AuthService.validateUser()
  1. findByUsername() → user
  2. bcrypt.compare(password, user.passwordHash)
  3. Si OK → sign JWT { sub, username, role, sellerId }
  4. Si NO → throw UnauthorizedException
  ↓
Response: { accessToken: string }
  ↓
Frontend: localStorage.setItem('accessToken', token)
  + Zustand: setAuth(user, token)
  + Navigate → /dashboard
  ↓
Requests siguientes:
  axios interceptor → Authorization: Bearer {token}
  JwtAuthGuard.canActivate() → decode + verify
  RolesGuard.canActivate() → check @Roles() decorator
```

---

## Pipeline — Transiciones Permitidas

Solo avance secuencial + cualquier etapa puede ir a Perdido:

```
Prospecto → Contactado | Perdido
Contactado → Interesado | Perdido
Interesado → Propuesta | Perdido
Propuesta → Negociación | Perdido
Negociación → Cierre | Perdido
Cierre → (terminal)
Perdido → (terminal)
```

**Probability por etapa**:
```
Prospecto=5%, Contactado=15%, Interesado=30%,
Propuesta=50%, Negociación=70%, Cierre=90%, Perdido=0%
```

**stage_history** (JSONB append):
```json
[
  { "stage": "Prospecto", "changedAt": "2026-06-01T10:00:00Z", "changedBy": "seller-id" },
  { "stage": "Contactado", "changedAt": "2026-06-03T14:30:00Z", "changedBy": "seller-id" }
]
```

---

## Sistema de Puntos y Calidad

**TASK_POINTS**:
```
Chat / WhatsApp / Correo: 1 punto
Llamada / Seguimiento: 3 puntos
Videoconferencia / Reunión virtual: 6 puntos
Propuesta: 8 puntos
Visita física / Reunión presencial: 10 puntos
Cierre: 25 puntos
Meta diaria: 30 puntos mínimo
```

**Calidad de actividad (0-100%)**:
```
summary (>20 chars): +20%
discovery (>15 chars): +20%
agreement (>15 chars): +20%
nextStep (>8 chars): +20%
nextDate + nextTime definidos: +20%
```

**Score del vendedor (0-100%)**:
```
45% × (puntos_hoy / meta_diaria)
+ 35% × (calidad_promedio / 100)
+ 40% × min(volumen_puntos / 50, 1)
- 10 × seguimientos_vencidos
```

---

## Scoring y Semáforo

```
≥ 75%: Verde (en meta)
45-74%: Ámbar (atención)
< 45%: Rojo (urgente)
```

---

## Endpoints API (resumen)

### Auth
- `POST /api/auth/login`

### Users & Sellers
- `GET/POST /api/users`
- `PATCH /api/users/:id/block`
- `GET/POST /api/sellers`

### Clients
- `GET/POST /api/clients`
- `PATCH /api/clients/:id`
- `POST /api/clients/:id/contacts`

### Activities
- `POST /api/activities`
- `GET /api/activities/seller/:id/daily`
- `GET /api/activities/seller/:id`

### Tasks
- `POST /api/tasks`
- `GET /api/tasks/seller/:id/today`
- `PATCH /api/tasks/:id/complete`

### Pipeline
- `GET /api/pipeline/seller/:id`
- `PATCH /api/deals/:id/stage`

### Sales
- `POST /api/sales`
- `GET /api/sales`

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sellers-score`
- `GET /api/dashboard/overdue-tasks`
- `GET /api/dashboard/mi-dia/seller/:id`

### Coaching + IA
- `GET /api/coaching/seller/:id/daily`
- `POST /api/coaching/suggestion` ← Claude API

### Reports
- `GET /api/reports/monthly?month=YYYY-MM`
- `GET /api/reports/seller/:id?month=YYYY-MM`

### Settings
- `GET /api/settings`
- `PATCH /api/settings`

---

## RBAC (Roles)

| Endpoint | Admin | Director | Seller |
|----------|-------|----------|--------|
| Ver datos de todos los sellers | ✓ | ✓ | ✗ |
| Ver solo sus propios datos | ✓ | ✓ | ✓ |
| Crear usuarios | ✓ | ✗ | ✗ |
| Reportes ejecutivos | ✓ | ✓ | ✗ |
| Modificar settings | ✓ | ✗ | ✗ |
| Ver auditoría | ✓ | ✗ | ✗ |

---

## Decisiones Técnicas

| Decisión | Justificación |
|----------|---------------|
| **NestJS** | Arquitectura escalable, decorators, TypeORM natural |
| **Clean Architecture** | Separación clara, testeable, domain sin dependencias |
| **PostgreSQL** | ACID, relaciones, JSONB para stage_history |
| **JWT stateless** | Escalable, no requiere sesiones en servidor |
| **TanStack Router** | Type-safe, lazy loading, nested layouts |
| **TanStack Query** | Cache, invalidación, optimistic updates |
| **Zustand** | Estado global mínimo (auth + UI state) |
| **Tailwind v4** | CSS-first, mínimo overhead, utility-first |
| **shadcn/ui** | Componentes accesibles sobre Radix, no es dependencia externa |
| **JSONB para history** | Evita tabla extra, query simple, append-only |
| **Soft deletes** | Auditoría completa, recuperación de datos |
| **Docker Compose** | Reproducibilidad, deployment consistente |

---

## IA Coach — Integración Claude API

```
POST /api/coaching/suggestion
Body: {
  type: ActivityType,
  objective: string,
  contact: { name, role },
  client: { name, stage }
}

CoachingService.generateSuggestion():
  1. Construir prompt con contexto del vendedor
  2. POST https://api.anthropic.com/v1/messages
     model: claude-haiku-4-5
     max_tokens: 300
  3. Parse y retornar sugerencia
  4. Si API falla → retornar sugerencia por defecto según tipo de actividad

Response: { suggestion: string }
```
