# Plan 002: Migrar los 23 botones HTML nativos de módulos a shadcn `Button`

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta — no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat cc0b102..HEAD -- frontend/src/modules frontend/src/index.css`
> Si algún archivo in-scope cambió, compara los extractos de "Current state"
> contra el código vivo; si no coinciden, condición de STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-tracker-tokens-tailwind.md (usa clases `*-tracker-*`)
- **Category**: tech-debt
- **Planned at**: commit `cc0b102`, 2026-07-14

## Why this matters

`docs/conventions.md` exige shadcn/ui para todo control ("Botón → `Button` de
`@/components/ui/button`"), pero hay 23 `<button>` nativos en 7 archivos de
módulos. Cada uno reproduce a mano tamaños, radios, cursor y colores, y varios
pierden los estados de foco/disabled consistentes del design system. La crítica
de UI (`.impeccable/critique/2026-07-15T03-30-46Z__frontend-src.md`) lo marca
como problema P1 de consistencia y como barrera de accesibilidad por teclado.

## Current state

### El componente Button y sus variantes

`frontend/src/components/ui/button.tsx` — wrapper shadcn; renderiza `<button>`
nativo y hace spread de todas las props (en React 19 `ref` llega como prop
normal, así que `<Button ref={...}>` funciona sin `forwardRef`).

`frontend/src/components/ui/button-variants.ts` — variantes disponibles:

| variant | Apariencia |
|---|---|
| `default` | fondo `--tracker-blue` (#002b49), texto blanco |
| `success` | fondo `--tracker-green` (#82bc00), texto oscuro, bold |
| `ghost` / `secondary` | fondo slate-100, texto `--tracker-text-dim` |
| `destructive` | fondo red-100, texto `--tracker-danger-dark` |
| `outline` | borde `border-border`, fondo translúcido |
| `link` | texto `text-primary` con underline al hover |

Sizes: `default` (h-8), `xs` (h-6), `sm` (h-7), `lg` (h-10), `icon`, `icon-xs` (24px), `icon-sm` (32px), `icon-lg`.

Import: `import { Button } from "@/components/ui/button"`.

### Los 23 botones nativos (inventario completo, verificado en cc0b102)

`rg -c '<button' frontend/src/modules` produce exactamente:

| Archivo | Cant. | Líneas |
|---|---|---|
| `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx` | 4 | 408, 503, 774, 840 |
| `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx` | 4 | 104, 125, 148, 329 |
| `frontend/src/modules/activities/presentation/components/ActivityForm.tsx` | 5 | 597, 618, 629, 649, 764 |
| `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx` | 1 | 294 |
| `frontend/src/modules/tasks/presentation/components/CalendarView.tsx` | 7 | 173 y navegación de semana/mes (531, 557 y análogos) |
| `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx` | 1 | 190 |
| `frontend/src/modules/auth/presentation/pages/LoginPage.tsx` | 1 | 244 |

Extractos representativos (confirma contra el código antes de editar):

```tsx
// ClientesPage.tsx:408 — pills de filtro por etapa
<button
  key={s}
  disabled={disabled}
  onClick={() => handleStageChange(s)}
  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
    isActive ? "bg-[#002B49] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  } ${disabled && !isActive ? "opacity-40 cursor-not-allowed" : ""}`}
```

```tsx
// ClientDetailPage.tsx:104 — botón cerrar "×"
<button
  onClick={onBack}
  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', lineHeight: 1 }}
>
  ×
</button>
```

```tsx
// ClientDetailPage.tsx:329 — CTA "Registrar avance"
<button
  onClick={() => navigate({ to: "/actividades/nueva", search: { clientId: deal.clientId, clientName: deal.clientName } })}
  style={{
    width: '100%', padding: '10px 0', background: '#82bc00', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  }}
>
  Registrar avance
</button>
```

```tsx
// CreateTaskForm.tsx:294 — botón sugerencias IA (mismo patrón en ActivityForm.tsx:764)
<button
  type="button"
  onClick={fetchAiSuggestions}
  disabled={aiLoading}
  style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: 'none', border: '1px solid #c4b5fd', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}
>
  {aiLoading ? 'Cargando...' : 'Obtener sugerencias'}
</button>
```

```tsx
// CalendarView.tsx:531 — navegación semana anterior (análogo en 557 y en la vista mensual)
<button
  onClick={onPrevWeek}
  style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer", ... }}
```

```tsx
// CalendarView.tsx:173 — TaskChip arrastrable (caso especial, ver Step 6)
<button
  ref={taskRef}
  onClick={() => onEdit?.(task)}
  className="w-full max-w-full justify-start truncate border-0 text-[11px]"
  style={{ cursor: "grab", opacity: internalDragging || isDragging ? 0.5 : ... }}
```

```tsx
// MiDiaPage.tsx:190 — tarjeta selectora de vendedor (EXCEPCIÓN, ver Scope)
<button key={s.id} className="seller-pick-card" onClick={() => onSelect(s.id, s.name)}>
```

### CSS legacy relacionado

En `frontend/src/index.css` existen `.btn-primary`, `.btn-green`, `.btn-ghost`,
`.btn-danger`, `.btn-sm` (13 apariciones, TODAS dentro del propio index.css).
Ningún `.tsx` las usa → son CSS muerto y este plan las elimina.

## Commands you will need

Ejecutar desde `frontend/`:

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Lint      | `npm run lint`      | exit 0              |
| Build     | `npm run build`     | exit 0              |
| Dev       | `npm run dev`       | Vite sirve la app   |
| Conteo    | `rg -c '<button' frontend/src/modules` (desde raíz del repo) | ver Done criteria |

## Scope

**In scope** (únicos archivos a modificar):
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`
- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx`
- `frontend/src/index.css` (solo borrar las reglas `.btn-*` muertas)

**Excepción documentada**: `MiDiaPage.tsx:190` (`.seller-pick-card`) NO se
migra — es una tarjeta completa clickeable; forzarla dentro de `Button`
requiere pelear contra las clases base (`whitespace-nowrap`, altura fija) con
alto riesgo visual. Queda como único `<button>` nativo permitido en módulos.

**Out of scope** (NO tocar):
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`
- Los demás `style={{...}}` inline de estos archivos que no pertenezcan al
  botón que estás migrando — los eliminan los planes 003/004.
- `button-variants.ts` — no agregar variantes nuevas.
- Cualquier `onClick`, `disabled`, `type`, `title`, `aria-*` existente: se
  PRESERVA idéntico en el `Button` resultante.

## Git workflow

- Branch: `advisor/002-native-buttons-to-shadcn`
- Un commit por step o por archivo; conventional commits en inglés, ej.
  `refactor(clients): replace native buttons with shadcn Button`
- NO hacer push ni abrir PR.

## Steps

Regla general para TODOS los steps: importa `Button`, conserva todas las props
de comportamiento (`onClick`, `disabled`, `type`, `key`, `title`), y si el
botón original estaba dentro de un `<form>` y tenía `type="button"`, el nuevo
`Button` debe conservar `type="button"` (el default nativo es submit).

### Step 1: ClientesPage.tsx (4 botones)

- **Línea 408 (pills de etapa)**: reemplazar por
  `<Button key={s} size="sm" variant={isActive ? "default" : "secondary"} disabled={disabled} onClick={() => handleStageChange(s)}>`.
  `default` ya es fondo #002b49; eliminar el className condicional completo.
- **Línea 503 (nombre de cliente como link)**:
  `<Button variant="link" onClick={() => goToDetail(client.id)} className="h-auto p-0 text-sm font-bold text-tracker-blue">`.
- **Línea 774 (+ Agregar contacto)**:
  `<Button type="button" variant="link" onClick={...} className="h-auto p-0 text-[11px] text-[#00A8E8]">`.
- **Línea 840 (Quitar contacto)**:
  `<Button type="button" variant="link" onClick={...} className="h-auto p-0 text-[11px] text-red-600 hover:text-red-800">`.

**Verify**: `npm run typecheck` exit 0; `rg -c '<button' frontend/src/modules/clients` → sin coincidencias.

### Step 2: ClientDetailPage.tsx (4 botones)

- **Línea 104 (cerrar ×)**:
  `<Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Cerrar" className="bg-transparent text-[22px] leading-none text-tracker-text-muted hover:bg-slate-100">×</Button>`.
- **Líneas 125 y 148 (stepper circular de etapas)**: son círculos de 28px con
  color dinámico por etapa. Usar
  `<Button size="icon-xs" title={s} disabled={...} onClick={...} className="size-7 rounded-full border-none text-white" style={{ background: <expresión dinámica original>, color: <expresión dinámica original> }}>`.
  El color de fondo/texto es dato dinámico (depende de `STAGE_COLORS[s]`,
  `isCurrent`, `isPast`) — se queda en `style`; todo lo demás pasa a clases.
  Para el botón "Perdido" (148) conserva su borde: `className="... border border-[#FCA5A5]"`.
- **Línea 329 (Registrar avance)**:
  `<Button variant="success" size="lg" className="w-full" onClick={...}>Registrar avance</Button>`.
  Nota: el original era verde con texto blanco (contraste pobre); `success` usa
  texto oscuro sobre verde. Es un cambio visual intencional — no lo "arregles".

**Verify**: `npm run typecheck` exit 0; `rg -c '<button' frontend/src/modules/pipeline` → sin coincidencias.

### Step 3: ActivityForm.tsx (5 botones)

- **Líneas 597, 618, 629, 649 (toggles "+ Agregar descubrimiento/acuerdo",
  "- Ocultar")**: usan una const `TOGGLE_STYLE`. Reemplazar cada uno por
  `<Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={...}>`.
  Ajusta el color con clase si `TOGGLE_STYLE` definía uno (léelo primero).
  Si tras la migración `TOGGLE_STYLE` queda sin usos, elimínala.
- **Línea 764 (sugerencias IA)**:
  `<Button type="button" variant="outline" size="xs" disabled={aiLoading} onClick={fetchAiSuggestions} className="border-[#c4b5fd] text-tracker-purple">`.
  (El hex original #7c3aed se normaliza al token `--tracker-purple` #6d28d9 —
  cambio intencional.)

**Verify**: `npm run typecheck` exit 0; `rg -c '<button' frontend/src/modules/activities` → sin coincidencias; `rg -c 'TOGGLE_STYLE' frontend/src/modules/activities` → sin coincidencias (si la const quedó huérfana).

### Step 4: CreateTaskForm.tsx (1 botón)

- **Línea 294**: idéntico al de ActivityForm 764 — misma receta del Step 3.

**Verify**: `npm run typecheck` exit 0; `rg -c '<button' frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx` → sin coincidencias.

### Step 5: LoginPage.tsx (1 botón)

- **Línea 244 (reset del formulario)**:
  `<Button type="button" variant="link" onClick={() => reset()} className="mt-3 h-auto p-0 text-xs font-normal text-tracker-text-muted">`.

**Verify**: `npm run typecheck` exit 0; `rg -c '<button' frontend/src/modules/auth` → sin coincidencias.

### Step 6: CalendarView.tsx (7 botones)

- **Botones de navegación (531, 557 y sus análogos de vista mensual)**:
  `<Button variant="outline" size="icon-sm" onClick={onPrevWeek} aria-label="Semana anterior">` (ajusta el aria-label a cada dirección/vista; conserva el
  glyph o icono interno tal cual).
- **TaskChip (línea 173)**: es un `<button ref={taskRef}>` registrado como
  draggable con `@atlaskit/pragmatic-drag-and-drop`. Migrar a:
  `<Button ref={taskRef} variant="ghost" size="xs" onClick={() => onEdit?.(task)} className="<className original> h-auto cursor-grab bg-transparent px-1 py-0.5 hover:bg-slate-100" style={{ <solo las propiedades dinámicas del style original: opacity, etc.> }}>`.
  `Button` pasa `ref` al `<button>` nativo (React 19), así que el draggable
  sigue recibiendo el mismo elemento. Conserva las propiedades dinámicas del
  `style` original (opacity durante drag) y CUALQUIER borde/color dinámico.
- Después de migrar, prueba en `npm run dev`: arrastra una tarea entre días del
  calendario y verifica que (a) se mueve, (b) la opacidad baja durante el drag,
  (c) el click sigue abriendo la edición.

**Verify**:
- `npm run typecheck && npm run lint && npm run build` → exit 0
- `rg -c '<button' frontend/src/modules` → exactamente `frontend\src\modules\mi-dia\presentation\pages\MiDiaPage.tsx:1`
- Drag & drop del calendario funcional (manual, ver arriba).

### Step 7: Borrar CSS muerto `.btn-*`

En `frontend/src/index.css` elimina los bloques `.btn-primary`, `.btn-green`,
`.btn-ghost`, `.btn-danger` (con sus `:hover`), `.btn-sm`, y las referencias a
`.btn-green, .btn-primary, .btn-ghost` y `.btn-sm` dentro del media query
`@media (max-width: 767px)`.

**Verify**:
- `rg -c 'btn-(primary|green|ghost|danger|sm)' frontend/src` → sin coincidencias
- `npm run build` → exit 0

## Test plan

Sin infraestructura de tests de frontend en el repo. Gates: typecheck + lint +
build por step, más las dos verificaciones manuales (drag & drop del
calendario en Step 6; smoke visual de las páginas tocadas: /clientes,
/pipeline con un deal abierto, /actividades/nueva, /agenda, /login).

## Done criteria

- [ ] `rg -c '<button' frontend/src/modules` → única línea: `MiDiaPage.tsx:1`
- [ ] `rg -c 'btn-(primary|green|ghost|danger|sm)' frontend/src` → 0 coincidencias
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` → exit 0
- [ ] Drag & drop de tareas en CalendarView funciona (manual)
- [ ] `git status` sin archivos modificados fuera del in-scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

Detente y reporta si:

- Los extractos de "Current state" no coinciden con el código (drift).
- El drag & drop del TaskChip deja de funcionar tras migrar a `Button` y no se
  arregla conservando `ref` + estilos dinámicos — revierte SOLO ese chip a
  `<button>` nativo, documéntalo en el README de plans y repórtalo.
- Alguna migración exige cambiar `button-variants.ts` o crear una variante
  nueva — está fuera de alcance.
- Encuentras más `<button>` en módulos que los 23 inventariados (drift).

## Maintenance notes

- Tras este plan, la regla de `docs/conventions.md` ("Botón → Button") queda
  reflejada en el código; un reviewer debe rechazar cualquier `<button>` nuevo
  en `frontend/src/modules/` (excepción: `seller-pick-card`).
- El caso `seller-pick-card` merece un componente `PickCard` propio si aparece
  un segundo uso — deferido a propósito.
- Los `style={{...}}` restantes en estos archivos los eliminan los planes 003/004.
