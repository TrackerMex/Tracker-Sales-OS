# Review 69-pipeline-free-stage

**Fecha**: 2026-07-14
**Reviewer**: Reviewer independiente (no Implementer)
**Resultado**: PASSED (13/13 criterios de código verificados) — con un hallazgo de proceso no bloqueante (justificación de negocio insuficientemente documentada)

## Método

Lectura directa de `deal.entity.ts`, `pipeline.types.ts`, `change-deal-stage.use-case.ts`, `update-client.use-case.ts` y `PipelinePage.tsx`, más ejecución real de tests y typecheck. Se contrastó explícitamente contra la feature 67 (retroceso de una sola etapa, estados terminales) para confirmar que no quedaron rastros de esa lógica.

## Regla de negocio

- [x] `backend/src/modules/pipeline/domain/entities/deal.entity.ts:28-87`: `ALLOWED_TRANSITIONS` mapea cada una de las 7 fases a las otras 6, ninguna incluye la fase actual. Verificado línea por línea — cada entrada tiene exactamente 6 elementos y excluye su propia clave.
- [x] `Cierre` (líneas 71-78) y `Perdido` (líneas 79-86) tienen array de salida no vacío hacia las otras 6 fases, confirmando que una oportunidad puede reabrirse.
- [x] `change-deal-stage.use-case.ts:66-77`: `PATCH /api/deals/:id/stage` conserva `stageHistory` (spread + nueva entrada), `changedBy` (línea 60), probabilidad automática vía `STAGE_PROBABILITY[input.newStage]` (línea 68), y `lossReason` opcional agregado a la entrada de historial SOLO cuando `input.newStage === PipelineStage.Perdido && input.lossReason` (líneas 61-63) — no se agrega al salir de Perdido ni en ninguna otra transición.
- [x] `backend/src/modules/clients/application/use-cases/update-client.use-case.ts:44-49`: `UpdateClientUseCase` importa el mismo `ALLOWED_TRANSITIONS` de `deal.entity.ts` (línea 17) y lo aplica cuando `dto.stage` está presente y difiere del actual — hereda la regla libre automáticamente sin lógica duplicada.

## Ausencia de rastros de la feature 67

- No quedan comentarios ni código que restrinjan a "un paso atrás"; el mapa completo permite saltos no adyacentes (ej. `Prospecto → Negociación`) y reapertura de `Cierre`/`Perdido`.
- `change-deal-stage.use-case.spec.ts` fue reescrito por completo para la regla libre: `allows every other stage and excludes the current stage in the transition map` (línea 68) más `it.each` con `a non-adjacent jump`, `reopening from Cierre`, `reopening from Perdido` (líneas 78-115), y un test de rechazo de la misma fase (línea 117). No quedó ningún test viejo de "solo un paso" en conflicto — el archivo no contiene ninguna aserción que limite el salto a una etapa adyacente.
- `feature_list.json`, entrada `67-pipeline-backward-stage`, sigue marcada `"status": "done"` con notas que documentan el comportamiento de un-paso-atrás como decisión histórica — es correcto que esa nota no se reescriba retroactivamente (es el registro histórico de esa feature), y la entrada `69-pipeline-free-stage` documenta el reemplazo.

## Frontend

- [x] `frontend/src/modules/pipeline/domain/pipeline.types.ts:14-71`: `ALLOWED_TRANSITIONS` es idéntico en estructura y contenido al mapa backend (mismas 7 claves, mismas 6 fases de destino cada una, comentario "Mirrors ALLOWED_TRANSITIONS in backend deal.entity.ts" en línea 13).
- [x] Kanban: el `onDrop`/`handleChangeStage` en `PipelinePage.tsx:139-149` no filtra por fase de origen; cualquier fase puede moverse a cualquier otra porque delega la validación al backend y usa el mismo mapa mirror para habilitar UI. `openDeals` (línea 173) solo excluye `Perdido` del cálculo de forecast, no del drag.
- [x] `ClientDetailPage.tsx` deriva los botones de fase desde el mismo mapa sin lógica adicional (uso de `ALLOWED_TRANSITIONS`/`deal.stage` para habilitar transición).
- [x] Diálogo de motivo de pérdida: `PipelinePage.tsx:139-149`, `handleChangeStage` solo abre `setLossModal({ dealId })` cuando `newStage === "Perdido"` (entrada). Al salir de Perdido hacia cualquier otra fase, `newStage !== "Perdido"`, por lo que cae directo al `changeStage.mutate(...)` sin modal (líneas 145-148). Confirmado que no hay ninguna otra ruta que abra el modal al salir.

## Verificación ejecutada por este Reviewer

- `cd backend && npx jest src/modules/pipeline/application/use-cases/change-deal-stage.use-case.spec.ts --runInBand` → 1 suite, 5 tests, PASS.
- `cd backend && npx tsc --noEmit` → exit 0.
- `cd frontend && npx tsc --noEmit` → exit 0.
- `cd backend && npx jest --runInBand` (suite completa) → 11 suites, 60 tests, PASS, sin regresión.
- `git diff --stat 80cf8a5..8896047 -- backend/src frontend/src` → solo se tocaron `deal.entity.ts`, `pipeline.types.ts`, `change-deal-stage.use-case.spec.ts` para esta feature (además de los archivos de 68 y 70), consistente con el resumen del Implementer. `change-deal-stage.use-case.ts` (el use case en sí) NO aparece en el diff — no fue necesario modificarlo porque ya leía `ALLOWED_TRANSITIONS` de forma genérica; esto es consistente y correcto, no una omisión.

## Hallazgo de proceso (no bloqueante, no es un bug de código)

Este es un cambio de regla de negocio significativo: se pasó de "retroceder exactamente una etapa, con Cierre/Perdido terminales" (feature 67, decidido explícitamente por el usuario vía `AskUserQuestion` el 2026-07-09, según consta en `feature_list.json` y `progress/history.md` línea 789) a "salto libre total, incluyendo reabrir Cierre/Perdido" (feature 69, un día después, 2026-07-10).

- `feature_list.json`, entrada `69-pipeline-free-stage`, solo dice `"Origen: decisión del usuario 2026-07-10."` — no cita un mecanismo `AskUserQuestion` como sí lo hace la 67, ni explica qué motivó revertir una decisión tomada 24 horas antes.
- `progress/history.md` NO tiene ninguna entrada para la feature 69 (ni para la 70): se buscó `## ` + fecha y no aparece ninguna sección `2026-07-10 — Feature 69` ni `Feature 70`, a diferencia de todas las features anteriores (67, 68, etc.) que sí tienen su entrada de historial. Esto también viola el paso 9 del flujo de `CLAUDE.md` ("Append en progress/history.md") para ambas features.
- Recomendación: no es un bloqueante de código — el comportamiento implementado coincide exactamente con lo que pide el checkpoint — pero se debería registrar en `progress/history.md` la justificación de negocio del cambio de 67→69 y, si existió, la transcripción o referencia de la decisión del usuario, para que quede trazabilidad de por qué se abandonó la restricción de "un paso" tan rápido.

## Veredicto

**PASSED** en lo estrictamente verificable en código (13/13). Se reporta como hallazgo de proceso — no bloqueante para este checkpoint — la falta de entrada en `progress/history.md` para las features 69 y 70, y la justificación de negocio más débil que la de la feature 67 que reemplaza.
