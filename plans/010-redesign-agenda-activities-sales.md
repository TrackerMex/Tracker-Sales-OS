# Plan 010: Agenda, Actividades y Ventas

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-010-agenda-activities-sales.md`.
>
> **Drift check**: `git diff --stat 55b22e1 -- frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales`
> No se espera ningún cambio previo de la feature 81 en estos módulos.

## Status

- **Feature**: 81-visual-redesign (fase 5 de 7)
- **Priority**: P1 · **Effort**: L · **Risk**: MED (formularios grandes: ActivityForm 781 l., SalesPage 902 l., CalendarView 877 l.)
- **Depends on**: 008 (puede ir en paralelo con 009: módulos disjuntos)

## Read first

- `DESIGN.md` ("Formulario", "Tabla", "KPI", "Estados", "Otros").
- `progress/explore_redesign_current.md` §2.3 y §4 (filas /agenda, /actividades/nueva, /ventas).
- Capturas: `progress/redesign/template/form-1440.png`, `form-390.png`,
  `tickets-1440.png` (tiles de estado + lista), `tables-1440.png`.
- Piezas compartidas de la fase 008.

## Scope

**In scope**: `frontend/src/modules/tasks/**`, `frontend/src/modules/activities/**`,
`frontend/src/modules/sales/**`. Borrar `sales/components/SaleFormBase.tsx`
(sin uso; confirmar con `rg`).
También `frontend/src/shared/components/forms/DatePickerField.tsx` y
`TimePickerField.tsx` (estilo legacy `tracker-*`; los usan tareas y
actividades): mismo aspecto que `Input` de Lyra, sin cambiar props.
De la review 009: `ActivityForm.tsx` conserva un error local `text-red-500`
(`clientError`) y `.slabel`; pasan a `FieldError` y `Label`. `FieldError` falla
AA sobre el panel navy de Ventas (3.89 en claro) y la `.card` blanca de
Actividades en oscuro (2.89): se resuelve al migrar esas superficies a tokens.

**Out of scope**: lógica, validaciones, hooks, backend.

## Steps

1. **Agenda**: `PageHeader` ("Agenda" / "Compromisos comerciales"; Tabs
   Lista/Calendario y Select de vendedor como acciones). TaskCard sin `.card`:
   fila de lista `divide-y` estilo tickets o card del bento; estado con
   `StatusBadge`. CalendarView: tokens en vez de hex y `text-[Npx]`
   (12px = `text-xs`, 14px = `text-sm`); HoverCard con estilo Lyra. Create/Edit
   TaskForm en secciones de formulario. Skeleton de `components/ui`.
2. **Actividades**: `PageHeader` ("Registrar actividad", píldora de puntos con
   `DAILY_MIN_POINTS` en vez de "30" fijo). Tarjeta de progreso como
   `StatCard` + barra `h-1.5 rounded-full bg-foreground/10` con relleno
   `bg-foreground` (o `chart-2`/`chart-4`/`destructive` según
   `getPointsBarColor`, ahora con tokens). ActivityForm en secciones; `.slabel`
   a `Label`. Lista del día como lista `divide-y`; ActivityHistoryModal con
   estilo Lyra.
3. **Ventas**: `PageHeader` ("Ventas" + CTA). Formularios (Vendedor /
   Dirección / ATC) en el bento de 2 columnas de la plantilla, sin panel
   navy. Las 4 cifras de "Ventas registradas" como `StatCard`. Lista de ventas
   a `DataTable` con `StatusBadge` y menú `…` por fila. Monto en
   `text-foreground font-medium` (hoy verde sobre blanco sin contraste).
   `formatCurrency` local (SalesPage:81) sustituido por `shared/lib/format.ts`.
   Quitar el `p-6` propio. EditSaleModal con estilo de formulario.
4. Sustituir la variante `success` de Button por `default` en estos módulos.
5. Gates: `pnpm run typecheck && pnpm run lint && pnpm run build`.

## Done criteria

- [ ] `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales` → 0
- [ ] `rg -n "\bslabel\b|\bcard\b|\bkl\b|\bprog\b|\blog-card\b|\bai-box\b|\bempty-state\b|variant=\"success\"" frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales` → 0 (en `className`)
- [ ] `SaleFormBase.tsx` borrado
- [ ] typecheck, lint y build exit 0

## STOP conditions

- Un cambio de presentación exige tocar validación (`FieldError`,
  `FormErrorSummary`, schemas): reporta.
- La vista de Dirección/ATC pierde el seller interno "Dirección Comercial"
  (feature 74): reporta.

## Verificación manual (Líder)

Crear y editar tarea (lista y calendario), registrar actividad y ver los
puntos, registrar venta de cada tipo, editar y borrar venta; Admin y Seller;
claro/oscuro; 1440 y 390.
