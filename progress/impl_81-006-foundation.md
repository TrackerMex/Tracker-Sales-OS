# Impl 81-006: Fundación del rediseño

Plan: `plans/006-redesign-foundation.md` · Rama `81-visual-redesign` · Sin commit.

## Estado

**BLOCKED (1 criterio)**: todo el plan está aplicado y los gates pasan, pero el
criterio `rg -n "noto-sans-arabic" frontend/src frontend/package.json → 0` da 1
coincidencia en `frontend/src/declarations.d.ts:1`
(`declare module '@fontsource-variable/noto-sans-arabic';`). Ese archivo no
está en la lista de archivos permitidos, así que no lo toqué. Para cerrarlo hay
que borrar solo esa línea (la línea 2, montserrat, se queda). Es una
declaración ambiental huérfana: no rompe typecheck ni build.

## Comprobaciones previas

- Drift check (`git diff --stat 55b22e1 -- …`): limpio, solo cambios de docs.
- `pnpm install --frozen-lockfile`: exit 0.
- Step 0 (`backend/src/main.ts` con `HOST`): sigue ahí; no lo toqué.

## Archivos tocados

- `frontend/package.json`, `frontend/pnpm-lock.yaml`: `pnpm add @fontsource-variable/geist`
  (^5.3.0), `pnpm remove @fontsource-variable/noto-sans-arabic`. Montserrat se queda.
- `frontend/src/main.tsx`: import de Geist en lugar de Noto; `ThemeProvider` de
  `next-themes` (`attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange`)
  envolviendo `QueryClientProvider`.
- `frontend/src/index.css`: tokens, fuente, sombras, base, legacy en `@layer components` (detalle abajo).
- `frontend/src/components/ui/`: accordion, alert-dialog, avatar, badge-variants,
  breadcrumb, button-variants, calendar, card, checkbox, command, dialog,
  dropdown-menu, hover-card, input, label, popover, select, separator, sheet,
  skeleton, sonner, table, tabs, tabs-list-variants, textarea, time-picker, tooltip.
  Sin tocar: `sidebar.tsx`, `sidebar-context.ts`, `collapsible.tsx` (sin estilos).
- `frontend/src/components/theme-provider.tsx`: borrado (antes,
  `grep -rn "theme-provider" frontend/src` → 0 imports).
- `THIRD_PARTY_NOTICES.md` (nuevo, raíz).
- `plans/README.md`: solo la fila 006.
- `progress/impl_81-006-foundation.md` (este archivo).

## index.css

- `@theme inline`: `--font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;`
  y `--shadow-sm/md/lg` con los valores de DESIGN.md.
- `:root` / `.dark`: valores exactos de la tabla "Color" de DESIGN.md (comprobado
  con un script: 31 tokens, 0 diferencias; `--radius: 0.625rem`). Añadido
  `color-scheme: dark` en `.dark` para scrollbars y controles nativos.
- `@layer base`: `* { border-border outline-ring/50 }`, `body { bg-background text-foreground }`,
  `h1..h6 { font-semibold }`. Quitado el bloque de foco con outline verde.
- Segundo `:root`: quitado el override navy de `--sidebar-*`. Se quedan los
  `--tracker-*`, `--sp-*`, `--sidebar-width` y `--page-gap`.
- Quitado `body { background: var(--tracker-bg) }`.
- Todo lo que va desde `/* Utility classes */` hasta el final (`.card` … `.dt-scroll`,
  scrollbars, `.modal-blur`, bloques responsive) está ahora dentro de
  `@layer components { … }`, sin cambiar reglas ni re-indentar.
  Fuera de la capa quedan el reduced-motion y la regla móvil
  `main { padding: var(--sp-3) !important }`, que saqué del bloque
  `@media (max-width: 767px)` a un bloque propio. El resto de ese media sigue dentro.
- Los tokens `--tracker-*` y `--color-tracker-*` no se han tocado.

## Decisiones por componente

Nota general: las variantes `data-open`, `data-closed`, `data-checked`,
`data-active`, `data-horizontal` y `data-vertical` de Lyra ya vienen de
`shadcn/tailwind.css` y casan con el `data-state` y la orientación de Radix.
Por eso las clases `.cn-*` se usan tal cual. Para los `data-selected` de cmdk
se usa `data-[selected=true]`.

Radio: DESIGN dice 8px efectivos para los controles. Con `--radius: 0.625rem`
eso es `rounded-md`, y es lo que uso donde el plan dice "rounded-lg" para
input, textarea, select trigger y botón. Si se quiere 10px exactos, se cambia a
`rounded-lg` en esos cuatro sitios. Las superficies (card, popovers, dialogs,
menús, checkbox, skeleton) usan `rounded-none`, como en Lyra.

- **button-variants** (`.cn-button*`): base Lyra (`rounded-md`, `text-xs`,
  foco `ring-1`, `active:translate-y-px`). Las variantes default, outline,
  secondary, ghost, destructive (suave) y link siguen Lyra; ghost es
  transparente en reposo y secondary usa `hover:bg-secondary/80` según DESIGN.
  `success` se queda como alias de `default`, con un comentario. Tamaños: xs h-6,
  sm h-7, default h-8, lg h-9, icon-xs/icon-sm/icon/icon-lg = 6/7/8/9.
  Quité el `rounded-none` que Lyra pone a los tamaños pequeños para que todos
  tengan 8px, como pide DESIGN. defaultVariants sin cambios.
- **badge-variants** (`.cn-badge*`): pill `rounded-full px-2 py-0.5 text-xs font-normal h-5`.
  Las variantes estándar siguen Lyra. Las variantes tracker conservan nombre y
  pasan a tokens: navy → primary/10, green → chart-2/10, amber y yellow → chart-4/10,
  red → destructive/10, gray → muted, purple y blue → chart-1/10.
  El export `BadgeVariant` se mantiene.
- **card** (`.cn-card*`): `rounded-none border bg-background shadow-none py-4 gap-4 text-xs/relaxed`
  y la prop `size` (sm) se conserva. CardTitle es `text-sm font-medium` sin
  color de marca; header, content y footer usan `px-4` (`px-3` en sm).
- **input / textarea / select trigger** (`.cn-input`, `.cn-textarea`,
  `.cn-select-trigger` + overrides de `globals.css`): h-8 (textarea con min-h-16),
  `rounded-md`, `text-xs`, foco `focus-visible:border-primary focus-visible:ring-0`.
- **select content / item**: sin vidrio; `rounded-none border bg-popover shadow-md`;
  item `rounded-none py-2 pl-2 pr-8 text-xs`.
- **label**: `text-xs font-medium`.
- **table** (`.cn-table*`): `text-xs`; header sin fondo; fila `border-b hover:bg-muted/50`;
  head `h-10 px-2 font-medium text-foreground`; celda `p-2`.
- **tabs / tabs-list-variants** (`.cn-tabs-*`): lista `rounded-none p-[3px]`,
  h-8 en horizontal, sin borde ni bg-white. Trigger activo
  `data-active:bg-background text-foreground` (ya no navy). Variantes
  `default` y `line` sin cambios.
- **dropdown-menu / popover / hover-card / command**: quitado el string de
  vidrio y blur. Ahora `rounded-none border bg-popover shadow-md` (sub-content
  con `shadow-lg`) e items `rounded-none py-2 text-xs`. El plan pide `border`,
  así que no uso el `ring-1` de Lyra. En dropdown se conserva `min-w-48` y el
  ancho del trigger. Popover queda con `p-2.5 gap-2.5 w-72`.
- **dialog / alert-dialog / sheet** (`.cn-dialog*`, `.cn-alert-dialog*`,
  `.cn-sheet*`): overlay `bg-black/10` sin blur; contenido `rounded-none p-4 ring-1 ring-foreground/10`,
  título `text-sm font-medium` y descripción `text-xs/relaxed`. Dialog pasa a
  `sm:max-w-sm`, que es el ancho por defecto de Lyra.
- **checkbox**: `rounded-none size-4`, foco `ring-1` y marcado `bg-primary`.
- **tooltip**: contenido, kbd y flecha con `rounded-none`.
- **accordion**: root sin caja ni borde; item `not-last:border-b`; trigger
  `py-2.5 text-xs font-medium hover:underline`, sin px.
- **calendar** (`.cn-calendar*`): `p-2`, nav `size-7`, día `size-8 text-xs`,
  seleccionado `bg-primary`. El día de hoy lleva `bg-muted rounded-md` en la
  celda y no en el botón, para que no choque con el seleccionado.
- **skeleton**: `rounded-none bg-muted`.
- **separator**: añadido `data-vertical:h-full`.
- **avatar**: ya estaba casi como Lyra; el group-count pasa a `text-xs`.
- **breadcrumb**: lista `gap-1.5 text-xs` sin `sm:gap-2.5`; item `gap-1`.
- **sonner**: tema desde `useTheme()` de next-themes; colores desde los
  tokens popover y border; `--border-radius: 0px`, que es el `rounded-none` de
  `.cn-toast` en Lyra. Quitado el `fontSize: 13px` fijo, que ya es el valor
  por defecto de sonner.

## Componentes sin equivalente Lyra

- **collapsible.tsx**: no tiene clases. Sin cambios.
- **time-picker.tsx**: componente propio, sin regla Lyra. Solo cambié
  `text-slate-900` por `text-foreground` en los dos inputs para que funcione en
  modo oscuro. Estructura y API sin cambios.

## API pública

No se ha quitado ni renombrado ninguna prop, export, variante ni tamaño
(`success` y las variantes tracker de badge siguen ahí como alias). No se ha
dado ninguna STOP condition por uso desde los módulos.

## Gates (desde `frontend/`)

- `pnpm run typecheck` (tsc --noEmit): exit 0, sin salida.
- `pnpm run lint` (eslint .): exit 0, sin avisos.
- `pnpm run build`: exit 0, built en 1.42s. Los woff2 de Geist están en
  `dist/assets` y el CSS pesa 142.93 kB (gzip 23.99 kB). Hay un aviso
  `INEFFECTIVE_DYNAMIC_IMPORT` de `@atlaskit/pragmatic-drag-and-drop` en
  `CalendarView.tsx`, que ya existía y es código de módulo.
- El wrap en `@layer components` no rompió el build.

## Done criteria

- `noto-sans-arabic` en `frontend/src` + `package.json`: **1**, en
  `src/declarations.d.ts:1`, fuera de scope (ver Estado). En `package.json` y
  `pnpm-lock.yaml` hay 0.
- `0.508 0.118` en `index.css`: 0.
- `backdrop-blur` en `components/ui`: 0.
- Clases legacy dentro de `@layer components`: sí. Ningún selector `.x` legacy
  queda fuera de la capa; fuera solo están `main` (móvil) y el reduced-motion.
- `theme-provider.tsx` borrado (0 referencias) y `ThemeProvider` de
  next-themes montado en `main.tsx`: sí.
- sonner con `useTheme()`: sí.
- Tokens = tabla de DESIGN.md: sí (31/31) y Geist es `--font-sans`: sí.
- Sombras en `@theme` y override navy del sidebar quitado: sí.
- `THIRD_PARTY_NOTICES.md` con nombre, URL, demo, commit `91deb10`, la nota
  "el sistema visual de frontend/ está basado en ella" y la MIT completa: sí.
- typecheck, lint y build exit 0: sí.
- Hex o `slate`/`tracker` sobrantes en `components/ui` (sin sidebar): 0 reales.
  El grep solo saca falsos positivos (`translate-`) y el comentario de badge.

## Riesgos y puntos a verificar visualmente

1. Las clases legacy (`.card`, `.kpi-*`, `.page-*`…) ahora pierden frente a las
   utilities. Es justo lo que arregla los 7 bugs silenciosos, pero algún
   módulo que dependía de que lo legacy ganara puede cambiar de aspecto.
2. Los botones `lg`, `icon` e `icon-sm` bajan un escalón de tamaño (h-9, size-8,
   size-7) y todo el texto de botón es `text-xs`.
3. Dialog tiene por defecto `sm:max-w-sm`. CommandDialog y los dialogs que no
   pasan su propio `max-w` salen más estrechos.
4. Accordion ya no tiene caja con borde ni padding horizontal.
5. Tabs: el activo es `bg-background` sobre `bg-muted` (ya no navy).
6. Badges: ya no van en mayúsculas ni con color hex; los colores salen de chart-*.
   Purple y blue comparten chart-1 (naranja), y amber y yellow comparten chart-4.
7. Popover tiene por defecto `p-2.5 w-72`. Los usos con `className` propio lo
   sobreescriben.
8. El modo oscuro está cableado pero no hay toggle (llega en la fase 007). Las
   clases legacy en hex y `--tracker-*` no se adaptan al oscuro.
9. Al quitar el outline verde de base, los botones nativos sin estilo usan el
   foco del navegador (`outline-ring/50`).
10. El sidebar sin el override navy usa los tokens neutros, así que el shell
    actual se verá claro antes de la fase 007.
11. Los controles tienen radio 8px (`rounded-md`); el plan dice "rounded-lg"
    (10px). Ver la nota de radio.

Revisión visual sugerida (light): login, dashboard y un formulario con select,
dialog, dropdown, tabs, tabla y toast.
