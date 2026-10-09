# Plan 009: Clientes y Pipeline

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-009-clients-pipeline.md`.
>
> **Drift check**: `git diff --stat 55b22e1 -- frontend/src/modules/clients frontend/src/modules/pipeline`
> No se espera ningún cambio previo de la feature 81 en estos módulos.

## Status

- **Feature**: 81-visual-redesign (fase 4 de 7)
- **Priority**: P1 · **Effort**: L · **Risk**: HIGH (drag-and-drop del pipeline sin tests)
- **Depends on**: 008

## Read first

- `DESIGN.md` (sobre todo "Tabla", "Formulario", "Estados", "Otros").
- `progress/explore_redesign_current.md` §2.3, §4 (filas /clientes y /pipeline) y §7 punto 3.
- Capturas: `progress/redesign/template/tables-1440.png`, `notes-1440.png`
  (maestro-detalle), `form-1440.png`, `user-profile-1440.png`.
- Piezas compartidas de la fase 008 (`shared/components/layout`, `shared/components/data`, `shared/lib/status.ts`).

## Scope

**In scope**: `frontend/src/modules/clients/**`, `frontend/src/modules/pipeline/**`.

**Out of scope**: unificar las dos UIs de detalle de cliente (ClientesPage y
ClientDetailPage): se rediseñan las dos con el mismo aspecto, la fusión es
otra feature. Lógica, hooks, queries, backend.

## Steps

1. **Clientes, lista**: `PageHeader` ("Clientes", contador, CTA primario
   "Nuevo cliente"). Toolbar de la plantilla (búsqueda con icono `pl-9` +
   toggles existentes). La rejilla de tarjetas pasa a cards del bento o a
   `DataTable`, la que respete mejor la información actual; elige y justifica
   en el impl. Quitar el `p-6` propio (padding doble).
2. **Clientes, detalle**: maestro-detalle tipo `notes-1440.png` o vista de
   perfil tipo `user-profile-1440.png`; responsive (hoy `grid-cols-[280px_1fr]`
   fijo). Sin panel navy: datos en secciones `bg-background p-6` con pares
   label `text-xs text-muted-foreground` / valor `text-sm`. Historial con
   `.log-card` sustituido por lista `divide-y`.
3. **Clientes, Dialog crear/editar**: formulario en secciones (DESIGN.md
   "Formulario"); fuera `.slabel` (usar `Label`), enlace cyan #00A8E8 a
   `text-primary underline`.
4. **Pipeline**: `PageHeader` ("Pipeline" + Total bruto y Forecast como
   `StatCard` compactos o texto `text-sm`; Select de vendedor A/D en acciones).
   Columnas del Kanban: `bg-muted/30` sin hex, header de columna `text-sm
   font-medium` + contador; drop target resaltado con `ring-1 ring-primary
   bg-primary/5` (hoy roto por la cascada). Mantén `.pipeline-scroll`/
   `.pipe-col` como clases-hook si el DnD las necesita, pero sin estilos de
   color propios; la altura y el ancho de columna (252px) no cambian.
5. **DealCard / DealPeek / ClientDetailPage (Sheet)**: card `border bg-background
   rounded-lg p-3`, hover `bg-muted/30`, etapa con `StatusBadge`
   (fuera los 3 mapas hex `STAGE_COLORS`; el stepper usa `status.ts`).
   Sheet con header `border-b`, botón cerrar `ghost size="icon"`, footer
   sticky `border-t`.
6. Gates: `pnpm run typecheck && pnpm run lint && pnpm run build`.

## Done criteria

- [ ] `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-" frontend/src/modules/clients frontend/src/modules/pipeline` → 0
- [ ] `rg -n "\bslabel\b|\blog-card\b|\bai-box\b|\bempty-state\b" frontend/src/modules/clients frontend/src/modules/pipeline` → 0
- [ ] Un solo mapa de colores de etapa (en `shared/lib/status.ts`)
- [ ] typecheck, lint y build exit 0
- [ ] Impl con la decisión lista vs tabla y cualquier clase-hook conservada

## STOP conditions

- Tocar `.pipeline-scroll`/`.pipe-col` rompe `autoScrollForElements` o
  `dropTargetForElements` y no se resuelve en dos intentos: reporta.
- El Popover peek deja de abrirse o abre también el Sheet (revisa el
  `stopPropagation` del trigger).
- Hace falta cambiar lógica de datos.

## Verificación manual (la hace el Líder con el runtime local)

Arrastrar un deal entre columnas (incluido a "Perdido" con su Dialog de
motivo), auto-scroll horizontal, peek, abrir y cerrar el Sheet; Clientes:
crear, editar, borrar, detalle y volver; en claro y oscuro; 1440 y 390.
