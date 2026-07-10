# Implementación — 67-pipeline-backward-stage

## Resumen

Se agregó la capacidad de retroceder exactamente una etapa dentro del tramo activo del
pipeline (Prospecto→Contactado→Interesado→Propuesta→Negociación→Cierre). `Cierre` y
`Perdido` siguen siendo terminales (`[]`, sin transiciones de salida, no reabribles).
`Prospecto` no gana transición de retroceso por ser la primera etapa.

## Archivos modificados

### 1. `backend/src/modules/pipeline/domain/entities/deal.entity.ts`
Se actualizó `ALLOWED_TRANSITIONS` (líneas 23-31) agregando la transición de retroceso
de un paso a cada etapa intermedia:

```ts
export const ALLOWED_TRANSITIONS: Partial<Record<PipelineStage, PipelineStage[]>> = {
  [PipelineStage.Prospecto]: [PipelineStage.Contactado, PipelineStage.Perdido],
  [PipelineStage.Contactado]: [PipelineStage.Interesado, PipelineStage.Prospecto, PipelineStage.Perdido],
  [PipelineStage.Interesado]: [PipelineStage.Propuesta, PipelineStage.Contactado, PipelineStage.Perdido],
  [PipelineStage.Propuesta]: [PipelineStage.Negociacion, PipelineStage.Interesado, PipelineStage.Perdido],
  [PipelineStage.Negociacion]: [PipelineStage.Cierre, PipelineStage.Propuesta, PipelineStage.Perdido],
  [PipelineStage.Cierre]: [],
  [PipelineStage.Perdido]: [],
};
```

No se tocó `change-deal-stage.use-case.ts` — se verificó que ya usa
`ALLOWED_TRANSITIONS[deal.stage] ?? []` con `BadRequestException` si la transición
no está en la lista (líneas 50-55), por lo que hereda el nuevo comportamiento sin
cambios de código. Un intento de saltar más de una etapa (ej. `Negociacion → Prospecto`)
sigue devolviendo 400 porque esa combinación no está en el mapa.

### 2. `backend/src/modules/clients/application/use-cases/update-client.use-case.ts`
Se cerró el bypass de `PATCH /clients/:id`, que permitía cambiar `client.stage` a
cualquier valor sin validar transiciones (alcanzable desde `ClientesPage.tsx` cuando
el cliente no tiene deal activo).

- Se agregó el import `BadRequestException` de `@nestjs/common` (junto a los ya
  existentes `ConflictException`, `ForbiddenException`, `NotFoundException`).
- Se agregó el import `ALLOWED_TRANSITIONS` desde
  `../../../pipeline/domain/entities/deal.entity` (ruta relativa válida:
  `backend/src/modules/clients/application/use-cases/` → sube 3 niveles hasta
  `backend/src/modules/` y entra a `pipeline/domain/entities/deal.entity`).
- Se agregó la validación justo después de `assertCanAccess`, antes del chequeo de
  duplicados:

```ts
if (input.dto.stage && input.dto.stage !== current.stage) {
  const allowed = ALLOWED_TRANSITIONS[current.stage] ?? [];
  if (!allowed.includes(input.dto.stage)) {
    throw new BadRequestException(
      `Transición de ${current.stage} a ${input.dto.stage} no permitida`,
    );
  }
}
```

Si `dto.stage` es `undefined` o igual al `stage` actual, el bloque no se ejecuta —
no se agregan efectos secundarios nuevos en ese caso.

Se verificó `create-client.use-case.ts` (archivo separado, no fue tocado): la ruta de
creación no pasa por `UpdateClientUseCase` y no está afectada por este cambio.

### 3. `frontend/src/modules/pipeline/domain/pipeline.types.ts`
Se actualizó el mirror `ALLOWED_TRANSITIONS` (líneas 8-17) para que sea idéntico en
estructura al nuevo mapa del backend, manteniendo el comentario
`// Mirrors ALLOWED_TRANSITIONS in backend deal.entity.ts`:

```ts
export const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  Prospecto: ['Contactado', 'Perdido'],
  Contactado: ['Interesado', 'Prospecto', 'Perdido'],
  Interesado: ['Propuesta', 'Contactado', 'Perdido'],
  Propuesta: ['Negociación', 'Interesado', 'Perdido'],
  Negociación: ['Cierre', 'Propuesta', 'Perdido'],
  Cierre: [],
  Perdido: [],
}
```

No se tocaron `ClientesPage.tsx`, `KanbanColumn.tsx`, `DealCard.tsx` ni
`PipelinePage.tsx` — su comportamiento deriva automáticamente de este mapa.

## Fuera de alcance (confirmado, no tocado)

- Sin bloqueo de drag-and-drop preventivo en el Kanban.
- `Cierre` y `Perdido` siguen con `[]` — no reabribles.
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`
  no fue tocado (hereda el mapa sin cambios de código, tal como se esperaba).
- No se agregaron dependencias nuevas. `node_modules` no existía en el checkout
  (ni backend ni frontend); se corrió `npm install` en ambos usando los
  `package-lock.json` existentes únicamente para poder ejecutar `tsc --noEmit`
  (no se modificó ningún `package.json` ni lockfile).
- No se agregaron tests nuevos.

## Verificación

- `cd backend && npx tsc --noEmit` → exit 0, sin errores.
- `cd frontend && npx tsc --noEmit` → exit 0, sin errores.
