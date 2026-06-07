# Review — Feature 07: Pipeline

Fecha: 2026-06-07
Reviewer: Agente Reviewer

---

## Criterios del CHECKPOINT

### ✅ PASS — GET /api/pipeline/seller/:id retorna deals agrupados por stage

- `pipeline.controller.ts:33-39`: `@Get('seller/:id')` bajo `@Controller('pipeline')` → ruta `GET /pipeline/seller/:id` (prefijo `/api` configurado a nivel app).
- `get-pipeline-by-seller.use-case.ts:25-33`: Inicializa `grouped` con los 7 stages del enum y distribuye los deals por stage.
- Tipo de retorno `PipelineGrouped = Record<PipelineStage, DealDto[]>` — todos los stages siempre presentes aunque estén vacíos.

---

### ✅ PASS — PATCH /api/deals/:id/stage cambia stage con validación de transición permitida

- `pipeline.controller.ts:56-62`: `@Patch(':id/stage')` bajo `@Controller('deals')` → ruta `PATCH /deals/:id/stage`.
- `change-deal-stage.use-case.ts:33-38`: Consulta `ALLOWED_TRANSITIONS[deal.stage]` y lanza `BadRequestException` si la transición no está permitida.
- `deal.entity.ts:20-28`: `ALLOWED_TRANSITIONS` define las transiciones válidas para los 7 stages.

---

### ✅ PASS — stageHistory actualizado en cada cambio (JSONB append)

- `change-deal-stage.use-case.ts:40-49`: Construye `historyEntry: StageHistoryEntry` con `stage`, `changedAt` (ISO string) y `changedBy`, luego hace spread `[...deal.stageHistory, historyEntry]` en el update.
- `deal.typeorm.entity.ts:26-27`: Columna `stage_history` con `type: 'jsonb'` y `default: []`.

---

### ✅ PASS — probability actualizado automáticamente según stage

- `change-deal-stage.use-case.ts:47`: `probability: STAGE_PROBABILITY[input.newStage]` incluido en el update del deal.
- `create-deal.use-case.ts:17-18`: Al crear, `probability = STAGE_PROBABILITY[stage]` calculado antes del `create`.
- `deal.entity.ts:10-18`: `STAGE_PROBABILITY` cubre los 7 stages (5, 15, 30, 50, 70, 90, 0).

---

### ❌ FAIL — AuditInterceptor registra old_values y new_values

**Problema:** `audit.interceptor.ts:8-18` captura `req.body` como `requestBody` y lo loguea como `oldStage`. Sin embargo, `req.body` contiene el `ChangeStageDtoBody` (`{ newStage, changedBy }`), que es el stage NUEVO, no el stage anterior del deal.

```typescript
// audit.interceptor.ts:8-9
const req = context.switchToHttp().getRequest<{ body: unknown }>();
const requestBody = req.body;  // { newStage: "Contactado", changedBy: "user" }

// audit.interceptor.ts:12-16
tap((data: { stage?: string } | null) => {
  console.log('[Audit] stage change', {
    oldStage: requestBody,  // INCORRECTO: es el DTO con newStage, no el stage previo
    newStage: data?.stage,  // stage del response — correcto
  });
}),
```

**Consecuencias:**
1. `old_values` no refleja el estado anterior del deal — el interceptor nunca consulta la DB para obtener el stage previo.
2. El log de `oldStage` contendrá `{ newStage: "X", changedBy: "Y" }` (el body del request), lo cual es semánticamente incorrecto.
3. No hay persistencia de los registros de auditoría — solo `console.log`.

**Lo que se necesita:**
- El interceptor necesita acceder al deal ANTES de la mutación (pre-handler) para capturar `old_values.stage`, o bien el use-case debe retornar el stage previo en la respuesta para que el interceptor pueda comparar.

---

### ✅ PASS — Frontend: vista Kanban con 7 columnas (click-based sin DnD library)

- `PipelinePage.tsx:10-18`: `ALL_STAGES` tiene exactamente 7 valores: `['Prospecto', 'Contactado', 'Interesado', 'Propuesta', 'Negociación', 'Cierre', 'Perdido']`.
- `PipelinePage.tsx:99-113`: Renderiza un `KanbanColumn` por cada stage.
- `DealCard.tsx:34-81`: Implementa cambio de stage mediante `<select>` + botón "Mover" (click-based). Sin importaciones de librerías DnD.
- `KanbanColumn.tsx`: columna con header coloreado, contador de deals y botón "+" para crear deals.
- Consistencia de strings: backend enum `PipelineStage.Negociacion = 'Negociación'` coincide con el tipo union del frontend `"Negociación"`.

---

## Resumen

| # | Criterio | Resultado |
|---|----------|-----------|
| 1 | GET /api/pipeline/seller/:id agrupado por stage | ✅ PASS |
| 2 | PATCH /api/deals/:id/stage con validación de transición | ✅ PASS |
| 3 | stageHistory JSONB append en cada cambio | ✅ PASS |
| 4 | probability automático según stage | ✅ PASS |
| 5 | AuditInterceptor registra old_values y new_values | ❌ FAIL |
| 6 | Frontend Kanban 7 columnas click-based | ✅ PASS |

## Archivo con el defecto

`backend/src/modules/pipeline/infrastructure/interceptors/audit.interceptor.ts` — líneas 8-18.

VEREDICTO: FAILED
