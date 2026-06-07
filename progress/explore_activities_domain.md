# Explore: Dominio de Actividades

## 1. Campos de ActivityEntity

```
ActivityEntity extends BaseEntity {
  // FKs
  sellerId: string             [REQUIRED]
  clientId: string             [REQUIRED]
  contactId: string | null     [OPTIONAL]

  // Clasificación
  type: ActivityType           [REQUIRED] — enum 11 valores
  result: ActivityResult       [REQUIRED] — enum 8 valores

  // Contenido
  summary: string              [REQUIRED]
  discovery: string | null     [OPTIONAL]
  agreement: string | null     [OPTIONAL]
  nextStep: string | null      [OPTIONAL]
  nextDate: string | null      [OPTIONAL — ISO date]
  nextTime: string | null      [OPTIONAL — HH:MM]

  // Calculados
  points: number               [CALCULATED — TASK_POINTS[type]]
  quality: number              [CALCULATED — 0-100]
  capturedAt: Date             [CALCULATED — NOW() en create]
  delayMinutes: number         [CALCULATED — capturedAt - executedAt en minutos]

  // Timestamps de ejecución
  executedAt: Date             [REQUIRED — cuándo ocurrió]
  programmedAt: Date | null    [OPTIONAL — si viene de Task]
}
```

## 2. Enums

```typescript
enum ActivityType {
  Chat = 'Chat', WhatsApp = 'WhatsApp', Correo = 'Correo',
  Llamada = 'Llamada', Videoconferencia = 'Videoconferencia',
  ReunionVirtual = 'Reunión virtual', VisitaFisica = 'Visita física',
  ReunionPresencial = 'Reunión presencial', Propuesta = 'Propuesta',
  Seguimiento = 'Seguimiento', Cierre = 'Cierre'
}

enum ActivityResult {
  Interesado = 'Interesado', NoContesto = 'No contestó',
  SolicitudPropuesta = 'Solicita propuesta', SolicitudReunion = 'Solicita reunión',
  Negociacion = 'Negociación', CierreGanado = 'Cierre ganado',
  CierrePerdido = 'Cierre perdido', InformacionEnviada = 'Información enviada'
}
```

## 3. TASK_POINTS

```typescript
Chat=1, WhatsApp=1, Correo=1, Llamada=3,
Videoconferencia=6, ReunionVirtual=6, VisitaFisica=10, ReunionPresencial=10,
Propuesta=8, Seguimiento=3, Cierre=25
```

## 4. Tipos que requieren nextStep + nextDate + nextTime

```
REQUIRES_NEXT_STEP = {
  Llamada, Videoconferencia, Reunión virtual,
  Visita física, Reunión presencial, Propuesta
}
```

## 5. Cálculo de calidad (5 campos × 20%)

| # | Campo | Condición |
|---|-------|-----------|
| 1 | summary | length > 20 chars |
| 2 | discovery | length > 15 chars |
| 3 | agreement | length > 15 chars |
| 4 | nextStep | length > 8 chars |
| 5 | Planificación | nextDate AND nextTime ambos presentes |

Resultado: 0, 20, 40, 60, 80 o 100

## 6. Endpoints requeridos (CHECKPOINTS)

```
POST /api/activities
  Body: { sellerId, clientId, contactId?, type, result, summary,
          discovery?, agreement?, nextStep?, nextDate?, nextTime?,
          executedAt, programmedAt? }
  Calcula: points, quality, capturedAt, delayMinutes

GET /api/activities/seller/:id/daily
  Query: ?date=YYYY-MM-DD (default: hoy)
  Response: { activities: Activity[], totalPoints: number }

GET /api/activities/seller/:id
  Query: ?page, ?limit, ?type, ?result, ?startDate, ?endDate
  Response: PaginatedResponse<Activity>
```

## 7. Relaciones

- Activity → Seller: ManyToOne, FK sellerId
- Activity → Client: ManyToOne, FK clientId
- Activity → Contact: ManyToOne nullable, FK contactId

## 8. Archivos ya existentes en el módulo

- `backend/src/modules/activities/domain/entities/activity.entity.ts`
- `backend/src/modules/activities/domain/repositories/activity.repository.interface.ts`
- `backend/src/modules/activities/presentation/activities.controller.ts`
- `backend/src/modules/activities/activities.module.ts`

(Verificar su estado actual — pueden ser stubs vacíos)
