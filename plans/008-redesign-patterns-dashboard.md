# Plan 008: Patrones compartidos + Dashboard y Mi día

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-008-patterns-dashboard.md`.
>
> **Drift check**: `git diff --stat 55b22e1 -- frontend/src/modules/dashboard frontend/src/modules/mi-dia frontend/src/shared/components`
> Solo se esperan los cambios de 006-007 (ver sus `progress/impl_81-*.md`).

## Status

- **Feature**: 81-visual-redesign (fase 3 de 7)
- **Priority**: P1 · **Effort**: L · **Risk**: MED
- **Depends on**: 006, 007

## Why this matters

Hoy no existen PageHeader, StatCard, EmptyState, DataTable ni un mapa único de
estados; cada página improvisa los suyos (5 estilos de título, 4 formas de
KPI, 3 mapas hex de etapas). Esta fase crea esas piezas una vez, con el
aspecto de la plantilla, y las valida en las dos páginas que más se parecen
al dashboard de la plantilla.

## Read first

- `DESIGN.md` → "Patrones de página" completo y "Estados".
- `progress/explore_redesign_template.md` §2, §3, §4 y "Patrones reutilizables".
- Capturas: `progress/redesign/template/home-1440.png`, `tables-1440.png`.
- Referencia (solo lectura): `.../template-src/app/components/dashboards/modern/*`,
  `.../app/components/shared/divider/index.tsx`,
  `.../app/components/tables/data-table/DataTable.tsx`.
- `progress/explore_redesign_current.md` §3, §4 (filas /dashboard y /mi-dia), §5.
- `docs/conventions.md`.

## Scope

**In scope**:
- Crear en `frontend/src/shared/components/`:
  - `layout/PageHeader.tsx`: `title`, `description?`, `actions?` (ReactNode).
  - `data/StatCard.tsx`: `label`, `value`, `delta?` (`{ value: string; trend: 'up' | 'down' | 'neutral' }`), `icon?`, `action?`.
  - `data/StatusBadge.tsx` + `frontend/src/shared/lib/status.ts`: mapa único
    significado → token (DESIGN.md "Estados"), con el mapeo de las etapas del
    pipeline y de los estados de tareas, ventas y deals que hoy existen.
  - `data/EmptyState.tsx`: `icon?`, `title`, `description?`, `action?`.
  - `data/DataTable.tsx` sobre `@tanstack/react-table` (ya instalado): orden,
    búsqueda opcional, paginación opcional (DESIGN.md "Tabla").
  - `layout/DottedDivider.tsx`.
- `frontend/src/index.css`: `@utility bento` (`grid grid-cols-12 p-px gap-px
  bg-border`, hijos `bg-background`) si simplifica; si no, clases inline.
- `frontend/src/shared/lib/chart.ts`: opciones base de chart.js con el estilo
  de DESIGN.md "Gráfico" (colores leídos de las CSS vars en runtime para
  respetar el modo oscuro).
- `frontend/src/modules/dashboard/**` y `frontend/src/modules/mi-dia/**`.
- Borrar `dashboard/components/KPICard.tsx` y `OverdueTasksList.tsx` (sin uso).

**Out of scope**: otras páginas, lámina, backend, lógica de datos (queries,
hooks, cálculos): solo presentación.

## Steps

1. Crear las piezas compartidas listadas arriba, sin hex ni clases
   `tracker-*`, solo tokens. Cada una pequeña y sin opciones que nadie use.
2. **Dashboard**: `PageHeader` ("Dashboard de ventas" + subtítulo con fecha
   de actualización; acciones existentes a la derecha). Debajo, bento como el
   de la plantilla: KPIs (`StatCard`, sustituye `KPIStrip` y su tooltip CSS por
   shadcn `Tooltip` si hace falta) · divisor · gráfico de actividad (card con
   header icono+título, `chart.ts`) + `AlertsPanel` · divisor ·
   `SellerSemaphoreTable` y `LeaderboardTable` · divisor · "Deals en riesgo"
   con `DataTable` y `StatusBadge`. Fuera `.card*`, `.page-*`, `.page-grid`,
   `.kpi-*`, `.seller-row`, `.alert-item`, `.prog*` y hex.
3. **Mi día**: `PageHeader` también en la vista de vendedor ("Mi día" + nombre
   y fecha). Picker de vendedor (A/D) como grid de cards clickeables con el
   estilo de la plantilla. Vista vendedor: fila de `StatCard` (sustituye
   `.seller-banner` + kpi-strip de 5 celdas), bento con termómetro, caja de IA
   (card con header icono+título, sin `.ai-box`), tareas y regla del día.
   `EmptyState` donde hoy hay `.empty-state`. Conservar el `AlertDialog` de
   completar tarea y la barra `scaleX` de puntos (estilo dinámico permitido).
4. Gates: `pnpm run typecheck && pnpm run lint && pnpm run build`.

## Done criteria

- [ ] Existen las 6 piezas compartidas y `status.ts`
- [ ] `rg -n "className=\"[^\"]*\b(card|slabel|kpi-|page-title|page-grid|empty-state|ai-box|seller-|prog)\b" frontend/src/modules/dashboard frontend/src/modules/mi-dia` → 0
- [ ] `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-" frontend/src/modules/dashboard frontend/src/modules/mi-dia` → 0
- [ ] `KPICard.tsx` y `OverdueTasksList.tsx` borrados
- [ ] typecheck, lint y build exit 0
- [ ] Impl con lista de piezas, props y decisiones

## STOP conditions

- Un componente de dashboard o mi-dia lo usa otro módulo y el cambio lo rompe:
  reporta antes de tocar el otro módulo.
- Hace falta cambiar un hook/query o un cálculo para mostrar un dato: reporta.
- chart.js no permite leer los colores de las CSS vars de forma limpia tras
  dos intentos: reporta (no añadas Recharts).

## Maintenance notes

- Las fases 009-011 reutilizan estas piezas; si una no encaja, se ajusta la
  pieza (una vez) en lugar de crear otra.
