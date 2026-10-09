# Plan 006: Fundación del rediseño (tokens, Geist, modo oscuro, primitivos ui)

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificación y confirma el resultado esperado antes de avanzar. Si ocurre
> algo de la sección "STOP conditions", detente y reporta, no improvises.
> Al terminar, actualiza la fila de este plan en `plans/README.md` y escribe
> `progress/impl_81-006-foundation.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat 55b22e1 -- frontend/src/index.css frontend/src/main.tsx frontend/src/components/ui frontend/package.json`
> Solo se esperan cambios de docs (DESIGN.md, PRODUCT.md, feature_list.json,
> plans/, progress/). Si alguno de estos archivos cambió, STOP.

## Status

- **Feature**: 81-visual-redesign (fase 1 de 7)
- **Priority**: P1 · **Effort**: M · **Risk**: MED (cambia todos los componentes ui/* a la vez)
- **Depends on**: —
- **Planned at**: rama `81-visual-redesign`, base `55b22e1`, 2026-10-09

## Why this matters

El usuario pidió copiar la plantilla shadcn-dashboard tal cual. Todo lo demás
(shell, páginas) se apoya en que los tokens, la fuente y los primitivos de
`components/ui` ya tengan el aspecto Lyra/neutral. Además, las clases legacy de
`index.css` están fuera de `@layer` y vencen a las utilities de Tailwind: hoy
hay 7 bugs silenciosos por eso y cualquier utility nueva que se añada en las
fases siguientes podría fallar igual.

## Read first

- `DESIGN.md` (fuente de verdad, sobre todo "Color", "Tipografía", "Radio",
  "Botones", "Formulario").
- `progress/explore_redesign_template.md` §5 y §6.
- `progress/explore_redesign_current.md` §2 y §3.
- Referencia de clases Lyra (solo lectura, NO ejecutar nada de ahí):
  `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/template-src/app/css/styles/style-lyra.css`
  (reglas `.cn-<componente>-*` = class list exacta de cada slot) y
  `.../template-src/app/globals.css` (tokens y overrides de input/card).
- `docs/conventions.md`.

## Commands you will need

Ejecutar desde `frontend/` (pnpm, nunca npm ni bun; ver `docs/verification.md`):

| Purpose | Command | Expected |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 (falta `reicon-react` en node_modules) |
| Add font | `pnpm add @fontsource-variable/geist` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| Build | `pnpm run build` | exit 0 |

## Scope

**In scope**:
- `backend/src/main.ts` (Step 0, una línea)
- `frontend/package.json`, `frontend/pnpm-lock.yaml`
- `frontend/src/main.tsx`
- `frontend/src/index.css`
- `frontend/src/components/ui/*` excepto `sidebar.tsx` y `sidebar-context.ts`
- `frontend/src/components/theme-provider.tsx` (borrar)
- `THIRD_PARTY_NOTICES.md` (crear, raíz del repo)

**Out of scope** (NO tocar):
- `frontend/src/modules/**`, shell (`AppLayout`, `Header`, `app-sidebar`,
  `nav-*`, `ui/sidebar.tsx`): fases 007+.
- `ExecutiveSlide.tsx`, `LaminaPage.tsx`, el popup de `ReportsPage.tsx`.
- Borrar clases legacy de `index.css` (fase 012) o tokens `--color-tracker-*`
  (los siguen usando módulos sin migrar y la lámina).
- `components.json`.

## Git workflow

- Rama `81-visual-redesign` (ya existe). Sin commits: los cambios quedan en el
  árbol de trabajo y el usuario decide cuándo commitear (aplica a 006-012).
- NO commit, NO push, NO merge, NO tocar Docker.

## Steps

### Step 0: Backend escucha en el host indicado (YA HECHO por el Líder)

Hecho antes de este plan para poder arrancar el runtime local de capturas
"antes": `backend/src/main.ts` usa `process.env.HOST` si existe
(`app.listen(port, HOST)`) y si no, `app.listen(port)` como siempre. Producción
no define `HOST`, así que no cambia. Solo verifica que sigue ahí; no lo toques.

### Step 1: Fuente Geist

- `pnpm add @fontsource-variable/geist`.
- `main.tsx`: importar `@fontsource-variable/geist`; quitar el import de
  `@fontsource-variable/noto-sans-arabic` y su dependencia en package.json.
  **Conservar** `@fontsource-variable/montserrat` (la usa la lámina).
- `index.css` `@theme inline`: `--font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;`.

### Step 2: Tokens

En `index.css` reemplaza los valores de `:root` y `.dark` de shadcn por la
tabla "Color" de `DESIGN.md` (copiados de la plantilla; incluye `--chart-*`,
`--sidebar-*` y `--radius: 0.625rem`). Añade a `@theme` las sombras
`--shadow-sm/md/lg` de DESIGN.md. Elimina el override navy del sidebar del
segundo `:root` (index.css ~187-195). Cambia `body{background:var(--tracker-bg)}`
por `bg-background text-foreground` en `@layer base`, y añade
`h1,h2,h3,h4,h5,h6 { @apply font-semibold; }`. El foco de base pasa a
`outline-ring/50` (sin outline verde).

Los tokens `--tracker-*` / `--color-tracker-*` se quedan tal cual (los siguen
usando módulos sin migrar y la lámina).

### Step 3: Cascada legacy dentro de una capa

Envuelve todas las clases legacy de `index.css` (`.card`, `.slabel`, `.kpi-*`,
`.prog*`, `.empty-state`, `.ai-box`, `.page-*`, `.pipe-col*`,
`.pipeline-scroll`, `.seller-*`, `.task-item`, `.alert-item`, `.log-card`,
etc.) en `@layer components { … }`. Así las utilities ganan. No cambies sus
reglas. La regla móvil `main{padding…!important}` y el reduced-motion quedan
fuera de la capa por ahora (la fase 007 quita la primera).

### Step 4: Primitivos `components/ui` al estilo Lyra

Para cada componente, sustituye las clases de sus slots por las de la regla
`.cn-*` equivalente de `style-lyra.css`, adaptadas a nuestro markup Radix
(mismos `data-slot`). Mínimo:

- `button-variants.ts`: base, variantes `default/outline/secondary/ghost/destructive/link`
  y tamaños `xs/sm/default/lg/icon*` según DESIGN.md "Botones". La variante
  `success` que usan módulos se conserva como alias visual de `default`
  (la quitan las fases de páginas). `ghost` debe ser transparente en reposo.
- `input.tsx`, `textarea.tsx`, `select.tsx` (trigger y content): h-8,
  rounded-md (8px, como `.cn-input` de Lyra), text-xs, foco `focus-visible:border-primary` sin ring.
- `card.tsx`: `rounded-none border shadow-none bg-background`; `CardTitle`
  `text-sm font-medium` sin color de marca; conservar la prop `size`.
- `badge-variants.ts`: base pill `rounded-full px-2 py-0.5 text-xs font-normal`;
  las variantes tracker en hex pasan a tokens (`bg-chart-2/10 text-chart-2`,
  `bg-destructive/10 text-destructive`, `bg-chart-4/10 text-chart-4`,
  `bg-chart-1/10 text-chart-1`, `bg-primary/10 text-primary`). Mismos nombres
  de variante para no romper módulos.
- `table.tsx`: `text-xs`, head `h-10 px-2 font-medium`, celda `p-2`, fila
  `hover:bg-muted/50 border-b`, header sin fondo de color.
- `tabs.tsx` / `tabs-list-variants.ts`: activo según `.cn-tabs-*` (no navy).
- `dropdown-menu.tsx`, `popover.tsx`, `hover-card.tsx`, `command.tsx`: quitar
  vidrio/blur; `bg-popover border shadow-md`, radio Lyra.
- `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`: `rounded-none`, según Lyra.
- `checkbox.tsx` (`rounded-none`), `tooltip.tsx`, `accordion.tsx`,
  `calendar.tsx`, `label.tsx` (`text-xs font-medium`), `skeleton.tsx`,
  `avatar.tsx`, `separator.tsx`, `breadcrumb.tsx`, `collapsible.tsx`,
  `time-picker.tsx`: lo que tenga regla Lyra equivalente.

No cambies APIs públicas (props, exports, nombres de variantes).

### Step 5: Modo oscuro cableado

- `main.tsx`: envolver la app con `ThemeProvider` de `next-themes`
  (`attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange`).
- `components/ui/sonner.tsx`: tema desde `useTheme()` de next-themes en vez de
  `theme="light"` fijo.
- Borrar `components/theme-provider.tsx` (no montado, sustituido por
  next-themes). Verifica antes con `rg -n "theme-provider" frontend/src` que
  nadie lo importa.
- El toggle visible lo añade la fase 007.

### Step 6: Licencia de la plantilla

Crear `THIRD_PARTY_NOTICES.md` en la raíz con: nombre y URL de la plantilla,
nota "el sistema visual de frontend/ está basado en ella" y el texto completo
de su MIT License (copiar de `.../template-src/LICENSE`).

### Step 7: Verificación

`pnpm run typecheck && pnpm run lint && pnpm run build` → exit 0.

## Done criteria

- [ ] `rg -n "noto-sans-arabic" frontend/src frontend/package.json` → 0
- [ ] `rg -n "0.508 0.118" frontend/src/index.css` → 0 (sin teal)
- [ ] `rg -n "backdrop-blur" frontend/src/components/ui` → 0
- [ ] Clases legacy dentro de `@layer components`
- [ ] `theme-provider.tsx` borrado; `ThemeProvider` de next-themes montado
- [ ] `THIRD_PARTY_NOTICES.md` con la MIT completa
- [ ] typecheck, lint y build exit 0
- [ ] `progress/impl_81-006-foundation.md` con lista de archivos y decisiones

## STOP conditions

- El drift check muestra cambios en archivos in-scope.
- `pnpm install --frozen-lockfile` falla (lockfile desincronizado): reporta, no regeneres.
- Algún módulo usa una variante o prop de `components/ui` que el port obliga a
  quitar: reporta cuál en vez de editar el módulo.
- Meter las clases legacy en `@layer components` rompe el build.

## Maintenance notes

- Las fases 008-011 sustituyen los usos de clases legacy y de variantes
  `success`/tracker; la 012 borra las clases y los alias.
- Verificación visual la hace el Líder con el runtime local
  (`progress/explore_redesign_runtime.md`): login + 2 páginas en claro.
