# Design

Desde 2026-10-09 (feature 81) el sistema visual es una copia de la plantilla
[shadcn-dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)
(MIT, demo https://shadcndashboard-demo.vercel.app/), estilo shadcn **Lyra** con
base de color `neutral`. Ante cualquier duda que este documento no resuelva, se
replica lo que hace la plantilla (capturas de referencia en
`progress/redesign/template/`, inventario completo en
`progress/explore_redesign_template.md`).

No se migra a Next.js ni a Base UI: se reproduce el aspecto sobre nuestro shadcn
(Radix) + Tailwind v4. Los tokens viven en `frontend/src/index.css`.

**Excepción**: la lámina ejecutiva (`ExecutiveSlide`, `/lamina`, popup de
impresión de Reportes) conserva su identidad navy/verde y Montserrat. Es un
documento para dirección, no UI de la app.

## Principio del look

Monocromo, compacto y cuadrado. El contraste viene de **líneas de 1px**, no de
sombras ni de fondos grises con tarjetas blancas. El color aparece solo en
badges de estado, deltas y series de gráficos.

## Color

OKLCH, valores exactos de la plantilla.

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` / `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--card-foreground` / `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--secondary` / `--muted` / `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--secondary-foreground` / `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |
| `--chart-1` (naranja) | `oklch(0.646 0.222 41.116)` | igual |
| `--chart-2` (teal) | `oklch(0.6 0.118 184.704)` | igual |
| `--chart-3` (azul petróleo) | `oklch(0.398 0.07 227.392)` | igual |
| `--chart-4` (amarillo) | `oklch(0.828 0.189 84.429)` | igual |
| `--chart-5` (ámbar) | `oklch(0.769 0.188 70.08)` | igual |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### Dónde va cada color

- Todas las superficies son `bg-background`, incluido el panel del sidebar.
- `bg-primary` sólido solo en: ítem activo del sidebar, CTA principal de la
  página (uno por vista), checkbox/switch marcados y serie principal de
  gráficos.
- Tintes permitidos: hover `bg-primary/5`, filas `hover:bg-muted/30`, badges
  `bg-<token>/10`, tiles de estado `bg-<token>/12 border-<token>/20`, fondo del
  login `bg-accent`.
- **Prohibido en módulos**: hex fijos, clases `tracker-*`, `text-slate-*`,
  `bg-[#...]`. Todo color sale de un token. Así funciona el modo oscuro.

### Estados (mapa único)

Un solo helper central traduce estado → token. Pill:
`inline-flex rounded-full px-2 py-0.5 text-xs font-normal bg-<token>/10 text-status-<tono>`.

| Significado | Token | Ejemplos |
|---|---|---|
| Positivo / ganado / al día | `chart-2` | Cerrado ganado, Activo, Completada |
| En curso / atención | `chart-1` | Negociación, En proceso |
| Pendiente / medio | `chart-4` (solo tinte y relleno) | Pendiente, Prioridad media |
| Negativo / vencido / perdido | `destructive` | Perdido, Vencida, Inactivo |
| Neutro / informativo | `primary` | Prospecto, Lead, rol |

El texto de color nunca usa el token de gráfico directo (`text-chart-1`,
`text-chart-2`, `text-destructive` sobre tinte): en claro no llegan a AA
(3.1-4.0:1 medido). Para texto e iconos de estado se usan los tokens
`--status-success`, `--status-progress` y `--status-danger` (`text-status-*`),
que en claro son el paso oscuro del mismo tono (teal, naranja, rojo; AA ≥ 4.5:1
medido sobre el tinte) y en oscuro equivalen a `chart-2`, `chart-1` y
`destructive`. Tintes, bordes, barras y puntos siguen con el token de gráfico.

`chart-4` es amarillo claro y no llega a AA como texto en ningún paso usable:
en pills y tiles de "Pendiente" el texto va en `text-foreground` sobre
`bg-chart-4/15` (tile: `border-chart-4/30`). Las barras y puntos sí usan
`bg-chart-4` sólido, siempre con su valor también en texto.

Las etapas del pipeline usan este mismo mapa; se acaban los tres mapas hex
duplicados (DealCard, DealPeek, ClientDetailPage).

## Tipografía

- Fuente: **Geist** variable (`@fontsource-variable/geist`) para toda la app;
  Geist Mono para cifras alineadas si hace falta. Se retiran Noto Sans Arabic y
  Montserrat de la app (Montserrat solo queda en la lámina).
- Base del body: 16px / 24px. Encabezados `h1-h6` en `font-semibold`.

| Uso | Clase | Tamaño / peso |
|---|---|---|
| Controles, labels, headings de sección del sidebar, badges | `text-xs` | 12px / 500 (headings del sidebar 600 uppercase) |
| Ítems de nav, títulos de card, celdas de tabla, textos secundarios | `text-sm` | 14px / 500 títulos, 400 texto |
| Título de sección de formulario (`h5`) | `text-base` | 16px / 600 |
| Título de página | `text-xl` | 20px / 600 |
| Valor KPI | `text-2xl` | 24px / 600 (`tracking-[-0.3px]` en el valor grande del gráfico) |

Sin `text-[Npx]` arbitrarios. Sin labels en mayúsculas con tracking (excepto
los headings de sección del sidebar).

## Radio, sombra y espaciado

- `--radius: 0.625rem`. Escala `sm .6x`, `md .8x`, `lg 1x`, `xl 1.4x`,
  `2xl 1.8x`.
- Efectivo: **8px** en inputs, botones, badges cuadrados e ítems de nav;
  **0** en cards, dialogs, popovers, sheets y checkbox (Lyra);
  `rounded-full` en pills de estado y avatares.
- Sombras: `--shadow-sm 0 .125rem .25rem rgba(0,0,0,.075)`,
  `--shadow-md 0 1px 4px rgba(133,146,173,.2)`,
  `--shadow-lg 0 1rem 3rem rgba(0,0,0,.175)`. Cards sin sombra; `shadow-md` en
  dropdowns y popovers; `shadow-lg` en sheet y tarjeta de login.
- Rejilla de 4px. Ritmo de 16px (`p-4`, `gap-4`, `px-4` en headers de card) y
  24px (`p-6` en secciones y KPIs, `gap-6` entre campos).

## Iconos

`reicon-react` vía `shared/components/Icon.tsx` (se mantiene; la plantilla usa
lucide, pero el estilo de trazo es equivalente). Tamaños: 16px en botones,
tablas y títulos de card; 20px (`size-5`) en botones circulares del header;
18px solo donde ya existe y no choca.

## Shell

- `SidebarProvider` con `--sidebar-width: 16rem` (256px) y
  `--sidebar-width-icon: 52px`. Móvil (< 1025px): Sheet izquierdo de 288px.
- Sidebar `variant="inset" collapsible="icon"`; el panel interno es
  `bg-background border border-border`. Colapsado = rail de iconos con los
  headings de sección reemplazados por `...`; hover expande a 256px como
  overlay con `shadow-xl`.
- Cabecera del sidebar: `p-3 border-b`, 57px de alto (alineada con el header).
  Logo Tracker a la izquierda; a la derecha `Badge variant="secondary"` con la
  versión.
- Grupos `px-3 py-4 gap-4`. Heading de sección `text-xs font-semibold uppercase
  text-muted-foreground mb-2`. Ítem `flex items-center gap-3 px-3 py-2 my-0.5
  rounded-md text-sm font-medium`, icono 16px, alto 36px.
- Ítem activo: `bg-primary text-primary-foreground` (pastilla negra en light,
  blanca en dark). Hover: `bg-primary/5`.
- Pie del sidebar: bloque full-bleed `border-t border-b px-5 py-5` con el
  progreso del mes del usuario (barra `h-1.5 rounded-full bg-foreground/10`,
  relleno `bg-foreground`) y debajo el menú de usuario.
- Header: `sticky top-0 bg-background border-b`, 57px, sin sombra. Izquierda:
  toggle `PanelLeft` (ghost, redondo), separador vertical `h-4`, búsqueda
  `w-80 h-8 rounded-lg pl-10` que abre la paleta de comandos (Ctrl K).
  Derecha: toggle claro/oscuro, notificaciones y avatar (botones circulares de
  40px, `hover:bg-primary/5`). El título de la página NO va en el header.
- Contenido: `SidebarInset m-2 outline outline-border rounded-none`; dentro
  `flex flex-col gap-4 p-4` y contenedor `max-w-[1367px] mx-auto w-full`.
- Footer: `pt-6 flex items-center justify-between text-sm text-muted-foreground`
  con © Tracker México a la izquierda y, a la derecha, el crédito
  "Diseño basado en Shadcn Dashboard" enlazado a la plantilla (atribución
  pedida por su licencia MIT).

## Patrones de página

### Bento hairline

Contenedor `grid grid-cols-12 p-px gap-px bg-border`; cada bloque hijo es
`bg-background`. Las líneas de 1px que se ven son el `gap-px`. Ningún bloque
lleva borde ni sombra propia. Entre filas del bento va el **divisor punteado**:
franja `h-4` con `radial-gradient(circle, currentColor 1px, transparent 0)`
de `12px 12px`, `opacity .25` y máscara que se desvanece en los bordes.

### Cabecera de página (`PageHeader`, una sola en todo el sistema)

Fuera del bento, `flex flex-wrap items-center justify-between gap-4 pb-4`.
Izquierda: `h2 text-xl font-semibold` + `p text-sm text-muted-foreground`.
Derecha: acciones `flex gap-2` (botón icono outline, `Select` de periodo con
icono de calendario, CTA primario con icono). En móvil las acciones bajan.

### Card

`rounded-none bg-background shadow-none`, dentro del bento sin borde. Header
opcional `border-b px-4 py-4` con icono 16px `text-muted-foreground` + título
`text-sm font-medium`; `gap-0` para que el header pegue al contenido.

### KPI (`StatCard`)

`py-6 px-6`, columna con `gap-4`. Fila: label `text-sm` + valor
`text-2xl font-semibold` con badge de delta (`bg-chart-2/10 text-chart-2` o
`bg-destructive/10 text-destructive`); a la derecha icono 16px en caja
`border rounded-md p-2.5`. Opcional: botón outline "Ver detalle →". Variante
cuadrícula: `grid grid-cols-2 gap-px bg-border`, celdas `p-6 bg-background`
con icono en caja, valor `text-2xl` y label `text-sm`.

### Gráfico

Card con header icono + título. Encima del gráfico: label `text-base`, valor
`text-2xl font-semibold` + delta `text-sm font-medium text-chart-2` + "vs mes
anterior" muted, y `Select` de rango a la derecha. Gráfico (chart.js, ya
instalado): grid solo horizontal punteado `var(--border)` 4/4, ejes sin línea
ni ticks, etiquetas 12px `muted-foreground`, serie principal sólida
`var(--primary)` 1.5px, comparativa punteada al 60%, sin puntos, línea recta.
Tooltip compacto `rounded-lg border bg-background text-xs shadow-xl`,
cifras `tabular-nums`. Alto 215px en dashboard.

### Tabla (`DataTable`, sobre `@tanstack/react-table`)

- A sangre dentro de la card (`CardContent px-0`), `overflow-x-auto`.
- Head: `text-sm font-normal text-muted-foreground px-4 py-3`, icono de orden
  14px; fila de head sin hover.
- Filas: `border-b hover:bg-muted/30`, celdas `px-4 py-3`, alto ~57px; celda de
  doble línea (principal `text-sm font-medium` + secundaria `text-sm
  text-muted-foreground`); avatar 32px redondo; acciones con menú `…` en
  `p-2 rounded-lg hover:bg-muted/50`.
- Toolbar: título a la izquierda; búsqueda con icono absoluto (`pl-9`) y CTA a
  la derecha.
- Paginación `flex flex-col sm:flex-row items-center justify-between gap-4 p-4`:
  Anterior (secondary) / Siguiente (primary) · "Página X de Y" · "Filas por
  página" + `Select`.

### Formulario

- Página o modal en secciones: bento `xl:grid-cols-2 gap-px`, sección
  `bg-background p-4 md:p-6`, `h5 text-base font-semibold`, cuerpo
  `mt-6 flex flex-col gap-6`.
- Campo: `Label text-xs font-medium` encima, control con `mt-2`. Una columna
  por sección salvo pares cortos.
- Input / Select / Textarea: `h-8 rounded-md border-input bg-transparent px-2.5
  text-xs`; foco = `border-primary` sin ring.
- Error: label y borde en `destructive`, mensaje `text-xs text-destructive`.
- Checkbox `size-4 rounded-none`; radio `size-4 rounded-full`; switch 32×18.

### Botones

Radio 8px, `text-xs font-medium`, `active:translate-y-px`. Tamaños `xs h-6`,
`sm h-7`, `default h-8 px-2.5`, `lg h-9`, `icon size-8`. Variantes:

| Variante | Clases |
|---|---|
| default | `bg-primary text-primary-foreground hover:bg-primary/80` |
| outline | `border-border bg-background hover:bg-muted` |
| secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| ghost | `hover:bg-muted` (transparente en reposo) |
| destructive | `bg-destructive/10 text-destructive hover:bg-destructive/20` (nunca rojo sólido) |

### Otros

- Empty state: centrado, icono 20px en caja `border rounded-md p-2.5`, título
  `text-sm font-medium`, texto `text-sm text-muted-foreground`, CTA outline.
- Loading: `Skeleton` de `components/ui` con la forma del contenido; nada de
  bloques `animate-pulse` hechos a mano.
- Perfil: Sheet derecho `sm:max-w-80` abierto desde el avatar.
- Login: `min-h-screen grid place-items-center bg-accent px-4`; card
  `w-full max-w-md shadow-lg p-6` cuadrada; logo centrado; campos `space-y-4`,
  label `text-sm text-muted-foreground`; submit `w-full` primario.
- Maestro-detalle (Clientes): lista ~320px a la izquierda y detalle a la
  derecha dentro de una card `py-0`; en móvil la lista va a un Sheet.

## Responsive

- Breakpoint del sidebar: 1025px. Debajo, el header muestra el logo y oculta
  búsqueda y notificaciones.
- Grids `col-span-12` que pasan a `lg:col-span-*`; en móvil todo apila.
- Tablas con `overflow-x-auto` y `min-w` propio.
- Objetivo principal: laptops de 13-15" (1280-1440px).

## Modo oscuro

Cableado con `next-themes` (ya instalado): clase `.dark` en `<html>`, toggle en
el header, preferencia persistida. Funciona solo si los módulos usan tokens; un
hex fijo es un bug de modo oscuro.

## CSS legacy

Las clases propias de `index.css` (`.card`, `.slabel`, `.kpi-*`, `.prog*`,
`.empty-state`, `.ai-box`, `.page-*`, `.pipe-col*`, `.seller-*`, `.task-item`,
etc.) están fuera de `@layer`, ganan a las utilities y rompen estilos en
silencio. El rediseño las sustituye por los patrones de arriba y las borra.
Estado final: `index.css` solo contiene imports, `@theme`, tokens, `@layer
base`, utilidades del bento/divisor, reduced motion y lo que necesite la
lámina, aislado.

## Accesibilidad

- WCAG 2.1 AA en claro y oscuro (4.5:1 texto normal, 3:1 grande).
- Foco siempre visible (`outline-ring/50` en base; inputs con borde primary).
- `aria-label` en botones de solo icono.
- El estado nunca se comunica solo con color: la pill lleva texto.
- `prefers-reduced-motion` respetado.

## Copy

Español de México. Botones con verbo + objeto ("Guardar cambios", "Registrar
venta"). Labels en sentence case. Empty states con instrucción concreta.
