# Pipeline Drag & Drop — Implementación

## Archivos modificados

### DealCard.tsx
- Agregado `import { useState } from "react"`
- Estado `isDragging` (boolean) para controlar opacidad
- `draggable` en el div raíz
- `onDragStart`: `e.dataTransfer.setData("dealId", deal.id)` + `setIsDragging(true)`
- `onDragEnd`: `setIsDragging(false)`
- `opacity: isDragging ? 0.5 : 1` en el style del div
- `cursor: 'grab'` reemplaza `'pointer'`

### KanbanColumn.tsx
- Agregado `import { useRef, useState } from "react"`
- Estado `isDragOver` (boolean) para feedback visual
- `columnRef = useRef<HTMLDivElement>` aplicado al div raíz
- `onDragOver`: `e.preventDefault()` + `dropEffect = "move"`
- `onDragEnter`: `setIsDragOver(true)`
- `onDragLeave`: solo `setIsDragOver(false)` si `relatedTarget` no es descendiente (via `columnRef.current?.contains`)
- `onDrop`: lee `dealId` del dataTransfer, llama `onChangeStage(dealId, stage)`, reset `isDragOver`
- Style condicional cuando `isDragOver`: `borderColor: '#82bc00'`, `background: 'rgba(130, 188, 0, 0.05)'`

### PipelinePage.tsx
- Sin cambios — `handleChangeStage(dealId, newStage)` ya tenía la firma correcta

## TypeScript
`npx tsc --noEmit` — 0 errores

---

## Scroll horizontal con rueda del mouse

### PipelinePage.tsx
- Agregado `useRef` al import de react
- `scrollRef = useRef<HTMLDivElement>(null)` antes del estado del modal
- `handleWheel(e: React.WheelEvent<HTMLDivElement>)`: previene default si `deltaY !== 0`, suma `deltaY` a `scrollLeft`
- `ref={scrollRef}` y `onWheel={handleWheel}` en el div con `overflowX: 'auto'`

## TypeScript
`npx tsc --noEmit` — 0 errores
