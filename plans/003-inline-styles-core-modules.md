# Plan 003: Eliminar estilos inline en módulos núcleo (pipeline, tasks, dashboard, activities)

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta — no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat cc0b102..HEAD -- frontend/src/modules/pipeline frontend/src/modules/tasks frontend/src/modules/dashboard frontend/src/modules/activities`
> Nota: los planes 001 y 002 deben estar DONE antes de empezar; sus cambios en
> estos archivos son esperados. Cualquier otro cambio: compara los extractos de
> "Current state" y trata un desajuste como STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-tracker-tokens-tailwind.md (obligatorio), plans/002-native-buttons-to-shadcn.md (recomendado, toca los mismos archivos)
- **Category**: tech-debt
- **Planned at**: commit `cc0b102`, 2026-07-14

## Why this matters

Los 4 módulos núcleo concentran ~197 de los 461 `style={{...}}` del frontend.
Cada uno duplica a mano tipografía, colores hex y spacing que ya existen como
tokens (`--tracker-*`) y utilidades Tailwind, generando radios, tamaños y
grises inconsistentes entre pantallas (problema P1 de la crítica de UI). La
migración convierte estilos estáticos a clases y deja `style` solo para
valores calculados en runtime.

## Current state

### Reglas del sistema (memorízalas, aplican a cada archivo)

1. **Estático → clase Tailwind.** Todo `style` cuyos valores son literales se
   convierte a clases. Valores no estándar usan corchetes: `text-[13px]`,
   `min-h-[90px]`, `rounded-[10px]`.
2. **Condición binaria → clases condicionales**, no `style` ternario:
   `className={cn("...", isDragging && "opacity-50")}` (helper `cn` en
   `@/lib/utils`, ya usado por `components/ui/*`).
3. **Valor realmente dinámico** (color según dato, porcentaje calculado) → se
   queda en `style`, pero SOLO esa propiedad; el resto pasa a clases.
4. **Hover con onMouseEnter/onMouseLeave que solo cambia estilos → clases
   `hover:*`** y se eliminan los handlers.
5. **Barras de progreso**: nunca animar `width`; ancho dinámico via
   `style={{ transform: `scaleX(${pct / 100})` }}` con `className="origin-left transition-transform"`,
   o si no está animado, `style={{ width: ... }}` sin `transition`.
6. **Consts de estilo huérfanas** (`const XXX_STYLE = {...}`) se eliminan
   cuando pierden su último uso.

### Tabla de mapeo hex → clase (tras el plan 001)

| Hex encontrado | Clase |
|---|---|
| `#001524` | `*-tracker-dark` |
| `#002B49` / `#002b49` | `*-tracker-blue` |
| `#82bc00` | `*-tracker-green` |
| `#EEF2F7` | `*-tracker-bg` |
| `#F8FAFC` | `*-tracker-surface-alt` |
| `#E2E8F0` / `#e2e8f0` | `*-tracker-border` |
| `#0F172A` | `*-tracker-text` |
| `#475569` | `*-tracker-text-dim` |
| `#64748B` | `*-tracker-text-secondary` |
| `#94A3B8` | `*-tracker-text-muted` |
| `#DC2626` | `*-tracker-danger` |
| `#B91C1C` | `*-tracker-danger-dark` |
| `#16A34A` | `*-tracker-success` |
| `#4a7c00` | `*-tracker-success-dark` |
| `#D97706` | `*-tracker-warning` |
| `#B45309` | `*-tracker-warning-dark` |
| `#6d28d9` / `#7C3AED` | `*-tracker-purple` |
| `#EF4444` | `*-red-500` |
| `#F59E0B` | `*-amber-500` |
| `#334155` | `*-slate-700` |
| `#CBD5E1` | `*-slate-300` |
| `#3B82F6` / `#2563EB` | `*-blue-500` / `*-blue-600` |
| `#FEF2F2` / `#EFF6FF` / `#F0FDF4` / `#FFFBEB` | `*-red-50` / `*-blue-50` / `*-green-50` / `*-amber-50` |
| blanco `#fff`/`#FFFFFF` | `*-white` |
| otro hex sin equivalente | clase arbitraria `bg-[#XXXXXX]` (último recurso) |

(`*-` = prefijo según propiedad: `text-`, `bg-`, `border-`.)

### Inventario y presupuesto por archivo

Conteo de `style={{` en cc0b102 y máximo permitido al terminar (los restantes
deben contener al menos una expresión dinámica, no solo literales):

| Archivo | Hoy | Máx. final |
|---|---:|---:|
| `modules/pipeline/presentation/pages/PipelinePage.tsx` | 9 | 2 |
| `modules/pipeline/presentation/pages/ClientDetailPage.tsx` | 41 | 6 |
| `modules/pipeline/presentation/components/KanbanColumn.tsx` | 2 | 1 |
| `modules/pipeline/presentation/components/DealCard.tsx` | 13 | 2 |
| `modules/tasks/presentation/pages/AgendaPage.tsx` | 2 | 0 |
| `modules/tasks/presentation/components/TaskCard.tsx` | 11 | 2 |
| `modules/tasks/presentation/components/EditTaskForm.tsx` | 4 | 1 |
| `modules/tasks/presentation/components/CreateTaskForm.tsx` | 11 | 2 |
| `modules/tasks/presentation/components/CalendarView.tsx` | 34 | 4 |
| `modules/dashboard/presentation/pages/DashboardPage.tsx` | 13 | 2 |
| `modules/dashboard/presentation/components/SellerSemaphoreTable.tsx` | 4 | 2 |
| `modules/dashboard/presentation/components/LeaderboardTable.tsx` | 6 | 2 |
| `modules/dashboard/presentation/components/KPICard.tsx` | 1 | 1 |
| `modules/dashboard/presentation/components/AlertsPanel.tsx` | 3 | 1 |
| `modules/activities/presentation/pages/ActivitiesPage.tsx` | 14 | 2 |
| `modules/activities/presentation/components/ActivityHistoryModal.tsx` | 6 | 1 |
| `modules/activities/presentation/components/ActivityForm.tsx` | 23 | 2 |
| **Total** | **197** | **≤ 33** |

### Ejemplar completo: DealCard.tsx (antes → después)

Estado actual de `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
(líneas 66–106, verificado):

```tsx
<div
  ref={ref}
  onClick={() => onClick(deal)}
  className="card"
  style={{
    padding: '14px',
    marginBottom: '8px',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'box-shadow 0.2s, opacity 0.15s',
    opacity: isDragging ? 0.5 : 1,
  }}
  onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
>
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '13px', lineHeight: '1.3', fontWeight: 700, color: '#002B49', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {deal.clientName}
      </p>
      ...
  <span
    style={{
      flexShrink: 0, fontSize: '10px', fontWeight: 700, color: '#fff',
      background: badgeColor, borderRadius: '10px', padding: '2px 8px', textTransform: 'uppercase',
    }}
  >
    {deal.stage}
  </span>
```

Forma objetivo (patrón a producir — mismo DOM, estilos en clases):

```tsx
<div
  ref={ref}
  onClick={() => onClick(deal)}
  className={cn(
    "card mb-2 p-3.5 transition-[box-shadow,opacity]",
    isDragging ? "cursor-grabbing opacity-50" : "cursor-grab hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
  )}
>
  <div className="mb-1 flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] leading-[1.3] font-bold text-tracker-blue">
        {deal.clientName}
      </p>
      ...
  <span
    className="shrink-0 rounded-[10px] px-2 py-0.5 text-[10px] font-bold text-white uppercase"
    style={{ background: badgeColor }}   // dinámico: depende de deal.stage
  >
    {deal.stage}
  </span>
```

Los dos `style` que sobreviven en DealCard: el `background: badgeColor` del
badge de etapa y el `background: showRed ? ... : ...` del badge de días
estancado — este último conviértelo a clases condicionales
(`showRed ? "bg-red-500" : "bg-amber-500"`), así que en realidad puede quedar 1.

## Commands you will need

Ejecutar desde `frontend/`:

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Lint      | `npm run lint`      | exit 0              |
| Build     | `npm run build`     | exit 0              |
| Format    | `npx prettier --write <archivo>` | ordena clases |
| Conteo por archivo (raíz repo) | `rg -c 'style=\{\{' <archivo>` | ≤ presupuesto de la tabla |

## Scope

**In scope** (únicos archivos a modificar): los 17 archivos de la tabla de
inventario.

**Out of scope** (NO tocar):
- `frontend/src/index.css` — sin clases nuevas globales; todo se resuelve con
  utilidades Tailwind en el componente.
- Módulos reports, mi-dia, clients, auth, sales, settings, equipo,
  import-export, coaching y `src/components/*` — plan 004.
- Cualquier cambio de DOM, textos, lógica, handlers o jerarquía de componentes:
  esta migración es SOLO de estilos (excepto eliminar onMouseEnter/Leave de
  hover puro, regla 4).
- Las clases legacy `.card`, `.tag-*`, `.kpi-*` etc. que ya usan los
  componentes: se conservan tal cual.

## Git workflow

- Branch: `advisor/003-inline-styles-core-modules`
- Un commit por step (módulo); ej. `refactor(pipeline): replace inline styles with tailwind classes`
- NO hacer push ni abrir PR.

## Steps

Para CADA archivo: (1) léelo completo; (2) clasifica cada `style={{...}}` con
las reglas 1–6; (3) migra; (4) `npx prettier --write`; (5) verifica presupuesto
y typecheck. Trabaja módulo por módulo:

### Step 1: pipeline (DealCard → KanbanColumn → PipelinePage → ClientDetailPage)

Empieza por DealCard usando el ejemplar de arriba. En ClientDetailPage la
mayoría de los 41 son tipografía/spacing estáticos; los ~6 dinámicos legítimos
son los colores por etapa (`STAGE_COLORS[s]`) del stepper y similares.

**Verify**: `npm run typecheck` exit 0 y conteos:
`rg -c 'style=\{\{' frontend/src/modules/pipeline` → cada archivo dentro de su presupuesto.

### Step 2: tasks (AgendaPage → TaskCard → EditTaskForm → CreateTaskForm → CalendarView)

En CalendarView los dinámicos legítimos son: opacidad durante drag (si no la
convertiste a clase condicional en el plan 002), fondo de celda con
`isDragOver`, y cualquier color derivado de datos de la tarea. `isToday` es
binario → clases condicionales (`border-2 border-blue-500`, `text-blue-600 font-bold`).

**Verify**: typecheck + conteos de `frontend/src/modules/tasks` dentro de presupuesto. Manual: drag & drop del calendario sigue funcionando.

### Step 3: dashboard (DashboardPage → KPICard → LeaderboardTable → SellerSemaphoreTable → AlertsPanel)

Dinámicos legítimos esperables: ancho/escala de barras de progreso (KPICard) y
colores de semáforo por vendedor (SellerSemaphoreTable). Aplica la regla 5 a
toda barra de progreso animada.

**Verify**: typecheck + conteos de `frontend/src/modules/dashboard` dentro de presupuesto.

### Step 4: activities (ActivitiesPage → ActivityHistoryModal → ActivityForm)

ActivityForm es el más grande (23); tras el plan 002 ya no tiene botones
nativos. Elimina consts de estilo huérfanas (regla 6).

**Verify**: typecheck + conteos de `frontend/src/modules/activities` dentro de presupuesto.

### Step 5: verificación global

```
npm run typecheck && npm run lint && npm run build
```

y smoke visual en `npm run dev` de: /pipeline (tarjetas, drag, detalle de
deal), /agenda (lista y calendario), /dashboard, /actividades/nueva.

**Verify**: exit 0 en los tres comandos; páginas visualmente equivalentes a `main`.

## Test plan

Sin tests de frontend en el repo. Gates: typecheck + lint + build por step,
presupuestos de conteo por archivo, y el smoke visual del Step 5 comparando
contra `main` (puedes correr `git stash && npm run dev` para ver el antes, y
`git stash pop` para volver).

## Done criteria

- [ ] Cada archivo de la tabla cumple su presupuesto: `rg -c 'style=\{\{' <archivo>` ≤ máx.
- [ ] Todo `style={{...}}` restante en los 17 archivos contiene al menos una
      expresión con identificador (dato dinámico), verificable con
      `rg -n 'style=\{\{' <in-scope>` + inspección de cada coincidencia listada
      en la nota de estado del README de plans.
- [ ] `rg -c 'onMouseEnter' frontend/src/modules/pipeline/presentation/components/DealCard.tsx` → 0
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` → exit 0
- [ ] `git status` sin archivos fuera del in-scope
- [ ] Fila actualizada en `plans/README.md` (incluye la lista de `style` dinámicos que sobrevivieron)

## STOP conditions

Detente y reporta si:

- DealCard.tsx no coincide con el extracto (drift).
- Un archivo no puede cumplir su presupuesto porque tiene más estilos
  dinámicos legítimos de los estimados — NO lo fuerces convirtiendo dinámicos
  a clases incorrectas; reporta archivo + lista de los dinámicos reales.
- Migrar un estilo exige cambiar DOM o lógica (p. ej. un cálculo de layout en
  JS) — fuera de alcance, repórtalo.
- El drag & drop de pipeline o calendario deja de funcionar tras un step.

## Maintenance notes

- Los `style` sobrevivientes son la lista blanca de estilos dinámicos; un
  reviewer debe cuestionar cualquier `style={{` nuevo con solo literales.
- Si el pipeline agrega etapas nuevas, `STAGE_BADGE_COLORS`/`STAGE_COLORS`
  siguen siendo la fuente de color dinámico — considerar moverlos a tokens por
  etapa si crece.
- Follow-up deferido: reducir la cantidad de contenedores `.card` equivalentes
  (problema de jerarquía P1 de la crítica) — es rediseño, no migración.
