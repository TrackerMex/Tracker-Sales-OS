# Impl 81-008: Patrones compartidos + Dashboard y Mi día

Plan: `plans/008-redesign-patterns-dashboard.md` · Rama `81-visual-redesign` · Sin commit.

## Estado

**DONE (sin commit; pendiente review).** Steps 1-4 aplicados. Los gates pasan y
los dos `rg` de Done dan 0. No se disparó ninguna condición de STOP:
- Ningún otro módulo importa componentes de `dashboard` ni de `mi-dia`.
- No cambió ningún hook, query, cálculo ni tipo.
- chart.js lee las CSS vars a la primera.

Los cambios de 006, 007 y del Líder siguen en el árbol sin tocar. No toqué
`index.css`, `components/ui/*`, el shell ni otros módulos.

## Archivos

Creados:
- `frontend/src/shared/lib/status.ts`
- `frontend/src/shared/lib/chart.ts`
- `frontend/src/shared/components/layout/PageHeader.tsx`
- `frontend/src/shared/components/layout/DottedDivider.tsx`
- `frontend/src/shared/components/data/StatCard.tsx`
- `frontend/src/shared/components/data/StatusBadge.tsx`
- `frontend/src/shared/components/data/EmptyState.tsx`
- `frontend/src/shared/components/data/DataTable.tsx`

Reescritos (solo la presentación):
- `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`
- `frontend/src/modules/dashboard/presentation/components/KPIStrip.tsx`
- `frontend/src/modules/dashboard/presentation/components/AlertsPanel.tsx`
- `frontend/src/modules/dashboard/presentation/components/SellerSemaphoreTable.tsx`
- `frontend/src/modules/dashboard/presentation/components/LeaderboardTable.tsx`
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`

Borrados (antes, `rg` daba 0 imports de cada uno):
- `frontend/src/modules/dashboard/presentation/components/KPICard.tsx`
- `frontend/src/modules/dashboard/presentation/components/OverdueTasksList.tsx`

Otros: `plans/README.md` (solo la fila 008) y este archivo.

Nota: al pasar prettier sobre las carpetas de los módulos se reformatearon 7
hooks y tipos (solo comillas y punto y coma). Los devolví byte a byte a
`HEAD` con `git show HEAD:<file> > <file>`, y solo después de comprobar que la
diferencia completa venía de prettier. Hoy `git diff` no muestra nada en
`application/`, `domain/` ni `infrastructure/` de los dos módulos.

## Piezas compartidas

| Pieza | Props | Uso |
|---|---|---|
| `PageHeader` | `title: string`, `description?: ReactNode`, `actions?: ReactNode` | `<PageHeader title="Clientes" description="…" actions={<Button>…</Button>} />` encima del bento. |
| `DottedDivider` | ninguna | `<DottedDivider />` como hijo directo de un grid de 12 columnas (`col-span-12`). |
| `StatCard` | `label`, `value: ReactNode`, `icon: ReactNode`, `badge?: {label, tone: StatusTone}`, `description?: ReactNode`, `hint?: string`, `children?`, `className?` | Celda KPI del bento: `<StatCard className="col-span-12 md:col-span-6" label="Venta" value="$1" icon={<DollarIcon size={16}/>} />`. |
| `StatusBadge` | `status?: string`, `tone?: StatusTone`, más las props de `<span>` (children, className, aria-*) | `<StatusBadge status={deal.stage} />` o `<StatusBadge tone="danger">Rojo</StatusBadge>`. |
| `EmptyState` | `icon?: ReactNode` (por defecto, carpeta), `title: string`, `description?: string`, `action?: ReactNode` | `<EmptyState icon={<KanbanIcon size={20}/>} title="No hay deals" action={<Button variant="outline">…</Button>} />`. |
| `DataTable<T>` | `columns: ColumnDef<T>[]`, `data: T[]`, `getRowId?`, `pagination?: {page, pageCount, onPageChange, disabled?, label?}` | Dentro de `CardContent px-0`. Ordena en cliente las columnas con `accessorKey`; una columna solo con `id` no se ordena. `meta.className` alinea la cabecera y la celda (`text-right`). |

Cómo se ven:
- **StatCard.** Card sin borde, a toda la altura, `py-6 px-6`:
  - Label `text-sm`.
  - Valor `text-2xl font-semibold`, con un badge de delta opcional.
  - Caja de icono `rounded-md border p-2.5`.
  - `hint` añade un `Tooltip` shadcn junto al label, sustituye el tooltip CSS de `KPICard`.
- **DataTable.**
  - Cabecera `px-4 py-3 text-sm font-normal text-muted-foreground`, con un botón de orden (`UnfoldMore`, `ChevronUp` o `ChevronDown`, 14px) y `aria-sort`.
  - Filas `px-4 py-3 text-sm hover:bg-muted/30`.
  - Paginación con `border-t`: botón Anterior (secondary), botón Siguiente (default) y "Página X de Y" con `aria-live`.

## Mapa `status.ts`

Tonos y clases (DESIGN.md "Estados"):

| Tono | Token | Pill (`STATUS_BADGE_CLASS`) | Tile (`STATUS_TILE_CLASS`) | Relleno (`STATUS_FILL_CLASS`) |
|---|---|---|---|---|
| `success` | `chart-2` | `bg-chart-2/10 text-chart-2` | `border-chart-2/20 bg-chart-2/12 text-chart-2` | `bg-chart-2` |
| `progress` | `chart-1` | `bg-chart-1/10 text-chart-1` | ídem con chart-1 | `bg-chart-1` |
| `pending` | `chart-4` | `bg-chart-4/10 text-chart-4` | ídem con chart-4 | `bg-chart-4` |
| `danger` | `destructive` | `bg-destructive/10 text-destructive` | ídem con destructive | `bg-destructive` |
| `neutral` | `primary` | `bg-primary/10 text-primary` | ídem con primary | `bg-primary` |

`statusTone(status)` asigna el tono de cada estado y devuelve `neutral` para
uno desconocido:

| Grupo | Estado | Tono |
|---|---|---|
| Etapas del pipeline | Prospecto, Contactado | neutral |
| | Interesado, Propuesta, Negociación | progress |
| | Cierre | success |
| | Perdido | danger |
| Tareas y actividades | Pendiente | pending |
| | En curso | progress |
| | Completado, Completada | success |
| | Cancelada, Vencida | danger |
| Ventas (tipo de cliente) | Nuevo | success |
| | Existente | neutral |
| Semáforo | verde | success |
| | ambar | pending |
| | rojo | danger |
| | morado | progress |

Los mapas hex de `DealCard`, `DealPeek` y `ClientDetailPage` siguen en sus
módulos; los migran 009 y 010 usando este mapa.

## Decisiones por sección

### Dashboard

Tomado de `template-src/app/components/dashboards/modern/*`:
- **`PageHeader`** ("Dashboard de ventas"). El subtítulo une el texto anterior y "Actualizado a las HH:MM". No había acciones.
- **Bento.** `grid grid-cols-12 gap-px bg-border p-px`, con clases inline y sin `@utility bento`: solo hay 2 bentos y la utility no ahorraba nada.
- **Fila KPI.** De `total-orders.tsx`: 5 `StatCard` en 3 + 2 en xl, 2 por fila en md y apiladas en móvil.
  - Los 3 tooltips de ayuda pasan a `hint`.
  - Al cargar se muestra `Skeleton` en lugar de "...". `onRetry` desaparece porque nadie lo usaba en el strip.
- **Gráfico.** De `total-sales.tsx`, ocupa `lg:col-span-7`:
  - Header con icono y título, borde inferior.
  - Fila de stats: "Actividades registradas", el total de los 14 días en `text-2xl` y el texto de ayuda anterior al lado.
  - Gráfico de 215px de alto: línea `primary` de 1.5px, sin puntos, grid horizontal discontinuo.
- **Alertas.** `lg:col-span-5`: tiles 2x2 separados por `gap-px bg-border`. Cada tile lleva una caja de icono tintada (`STATUS_TILE_CLASS`), el valor en `text-2xl` y el label.
- **Desempeño del equipo** y **Leaderboard**, a `lg:col-span-6` cada uno. El seller ve Desempeño a 12 columnas.
  - En Desempeño, cada fila va a todo el ancho, con `StatusBadge` para la puntuación, barra `rounded-full` y relleno con el token del tono.
  - Leaderboard usa `DataTable` y su orden. El podio 1, 2 y 3 es pending, neutral y progress (oro, plata, bronce). El delta va en chart-2 o destructive.
- **Deals en riesgo**, con `DataTable` y la paginación de servidor existente: misma `page`, mismo `totalPages`, mismos `disabled` y mismos aria-labels.
  - La columna "Stage" pasa a llamarse "Etapa" y muestra un `StatusBadge` del mapa.
  - Severidad: danger "Rojo" o pending "Ámbar".
  - Estas columnas no se ordenan, porque ordenar solo la página visible confundiría.
- **Divisores.** `DottedDivider` (de `shared/divider/index.tsx`) entre cada fila del bento.
- **Errores.** Banner `border-destructive/20 bg-destructive/10` y filas de error con botón Reintentar outline.

### Mi día

- **Picker (A/D).**
  - `PageHeader` "Mi día" con el subtítulo anterior.
  - Grid de botones con bordes compartidos (`border-t border-l` en el grid y `border-r border-b` en cada celda), así no quedan huecos de color al final.
  - Cada botón lleva caja de icono, nombre, perfil y una flecha.
  - Al cargar se muestra `Skeleton`. El error y el estado vacío usan `EmptyState`; el error conserva Reintentar.
- **Vista vendedor.**
  - `PageHeader` "Mi día" con "{sellerName} · {fecha larga es-MX}".
  - Para A/D, la acción es "Cambiar vendedor" (outline) con el aria-label original. Sustituye a `.seller-banner`.
- **Fila KPI.** 5 `StatCard` con la misma rejilla que el dashboard.
  - "Puntos de hoy" conserva la barra `scaleX` (relleno `bg-primary`).
  - El color del número (`metricColorClass`, con clases `tracker-*`) pasa a ser un badge "{pct}%" con los mismos umbrales: ≥100% success, ≥50% pending, el resto danger. No sale badge si la meta es 0.
- **Bento.**
  - Termómetro (`lg:col-span-7`): tiles `STATUS_TILE_CLASS` con texto `foreground` y un punto del tono. Variantes: danger→danger, warning→pending, purple→progress, success→success.
  - Regla del día (`lg:col-span-5`): `StatusBadge status={semáforo}`, la regla, la descripción y los botones "Crear tarea" (default) y "Nuevo prospecto" (outline).
  - Divisor.
  - Agenda (`lg:col-span-7`, o 12 sin tips): filas a todo el ancho. Vencida usa `StatusBadge` y fondo `bg-destructive/5`; completada usa `opacity-60` y `line-through`. Los iconos de cliente y contacto ya no llevan hex. Se conserva el `Badge` de `TYPE_TAG`. El `AlertDialog` de completar queda igual, con el botón en variante default (antes `success`).
  - Coach IA: card con header icono + título, en lugar de `.ai-box`.
- **Vacíos y errores.** `EmptyState` para:
  - sin perfil de vendedor;
  - error de carga;
  - agenda vacía (con acción "Crear tarea");
  - error de agenda.
- **Esqueleto** de carga rehecho con `Skeleton` y la misma rejilla.

## chart.js en claro y oscuro

`shared/lib/chart.ts`:
- **Lectura de colores.** `resolveToken()` lee la CSS var de `<html>` y la pinta en un canvas de 1x1 (cacheado), luego la lee como `rgba()`. Hace falta porque chart.js no admite `var(--x)` y su parser de color no entiende `oklch()`. Funciona con cualquier color que entienda el navegador.
- **Cambio de tema.** `useChartColors()` re-lee los tokens con un `MutationObserver` sobre el atributo `class` de `<html>`.
  - next-themes aplica la clase `dark` en el efecto de su provider, que corre después que los efectos de los hijos, así que leer `resolvedTheme` llegaría tarde.
  - El gráfico memoiza `options` y `data` según los colores.
- **Estilo.** `lineChartOptions(colors)` da el estilo de la plantilla:
  - Grid Y discontinuo `[4,4]` en `border`, sin líneas de eje ni ticks.
  - Labels de 12px en `muted-foreground` con la fuente del body.
  - Tooltip `background` con borde `border`, radio 10 y texto `foreground`.
- **Verificación.** En el navegador (Playwright), cargué en claro, pulsé el toggle del header y la línea pasó de negra a blanca y el tooltip a fondo oscuro, sin recargar. Capturas en `scratchpad/impl008/toggle/`.
- **Límites conocidos.** El canvas no tiene `tabular-nums`, y chart.js no dibuja la sombra del tooltip de la plantilla.

## Desviaciones del plan

- **`StatCard`.** Tiene `badge{label,tone}`, `description`, `hint` y `children` en lugar de `delta{value,trend}` y `action`. Ningún KPI tiene una tendencia real, y `action` no lo usaba nadie. Con `badge` se cubre el delta de la plantilla: tono success o danger con "+22%".
- **`DataTable`.** Sin búsqueda ni selector de filas por página:
  - Nadie la usa todavía.
  - En la única tabla paginada, la paginación es de servidor con límite fijo de 10, y buscar en cliente solo filtraría la página visible.
  - Se añade cuando 009/010 la necesiten.
- **`AlertsPanel`.** `AlertItem` gana un campo `icon` obligatorio.
- **`PageHeader`.** Usa `h1` en lugar del `h2` de la plantilla, por accesibilidad. Se ve igual.
- **Encabezados de sección.** `<h2>` dentro de `CardTitle` para mantener la jerarquía (antes eran `h3.card-h3`).
- **Total de actividades.** El total de 14 días del gráfico es una suma de presentación sobre `trend.data`, para la fila de stats de la plantilla. No toca hooks.
- **`Section`.** El helper (card con header icono + título) es local a cada página, para no crear una séptima pieza compartida fuera del scope. Si 009-011 lo repiten, conviene subirlo a `shared/components/layout/`.
- **`DataTable` y lint.** `react-hooks/incompatible-library` avisa en `useReactTable`. Lo silencié con un comentario: TanStack Table no es compatible con el compiler, y es lo esperado.

## Gates y rg

En `frontend/`:
- `pnpm run typecheck`: exit 0.
- `pnpm run lint`: exit 0, sin warnings.
- `pnpm run build`: exit 0, `✓ built in 1.20s`. Solo aparece el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT` de pragmatic-drag-and-drop, ajeno a esta fase.

Resultados de `rg`:
- `rg -n "className=\"[^\"]*\b(card|slabel|kpi-|page-title|page-grid|empty-state|ai-box|seller-|prog)\b" frontend/src/modules/dashboard frontend/src/modules/mi-dia`: 0 resultados.
- `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-" frontend/src/modules/dashboard frontend/src/modules/mi-dia`: 0 resultados.
- Comprobación extra con `rg` de `text-slate-|bg-slate-|text-\[[0-9]|variant="success"|hex|tracker-` en los dos módulos y en las piezas nuevas: 0 resultados.
- Comprobación extra de nombres de clases legacy entre comillas (task-item, thermo-alert, rule-*, ti-*, spc-*, alert-item…): 0 resultados.

Capturas en
`/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/impl008/`:
- Usuarios y vistas: admin y seller1 a 1440 en claro, 1440 en oscuro y 390 en claro.
- Ninguna ejecución imprimió "page errors:".
- seller1 no tiene `/dashboard`: el guard de rutas lo redirige a `/mi-dia`, comportamiento previo.

## Qué revisar visualmente (Líder)

1. **Contraste de `pending` (chart-4, amarillo) como texto en modo claro.** Se ve en las pills "Ámbar" y "Atención", en el rango 1 del leaderboard y en los tiles del termómetro. Es lo que dicta DESIGN.md "Estados", pero el texto queda flojo. Si molesta, ajustarlo en `status.ts` en un único sitio.
2. **Gráfico en oscuro.** La captura completa de `admin-1440-dark/dashboard.png` salió a mitad de animación: las 3 sesiones corrían en paralelo y los datos llegaron tarde. La captura aislada `toggle/chart-dark.png` lo muestra completo.
3. **Leaderboard a 390px.** Delta y Racha quedan en scroll horizontal dentro de la tabla (`overflow-x-auto` del primitivo). La página no tiene scroll horizontal.
4. **Picker de Mi día.** El perfil del vendedor se trunca a una línea.
5. **Filas de Desempeño.** Siguen sin foco de teclado (`role="article"` con `onClick`), igual que antes.

## Post-entrega

- Líder (DESIGN.md "Estados"): el tono `pending` usaba texto chart-4, con poco contraste en modo claro. Solo cambió `shared/lib/status.ts`: la pill pasa a `bg-chart-4/15 text-foreground` y el tile a `border-chart-4/30 bg-chart-4/15 text-foreground`; el fill (`bg-chart-4`) no cambia. Ningún archivo de dashboard o mi-dia usaba `text-chart-4` directamente. typecheck, lint y build salen con 0. Capturas nuevas a 1440 claro en `scratchpad/impl008/post-{admin,seller}-1440-light/`, sin page errors: la pill de rank 1, los tiles ámbar del Termómetro y la pill "Atención" se leen bien.

## Fixes post-review

Corrige `progress/review_81-008-patterns-dashboard.md` (FAILED: B1, M1-M3, N1-N4) siguiendo DESIGN.md "Estados" actualizado. Los archivos tocados son solo los que autorizó el Líder:
- `index.css`;
- `shared/lib/{status,chart}.ts`;
- `shared/components/data/{StatCard,DataTable}.tsx`;
- el nuevo `shared/components/layout/SectionCard.tsx`;
- `dashboard/presentation/{components/LeaderboardTable,components/SellerSemaphoreTable,pages/DashboardPage}.tsx`;
- `mi-dia/presentation/pages/MiDiaPage.tsx`.

No hay cambios en hooks, queries, tipos ni `components/ui`.

### Cambios

1. **B1, contraste AA en claro.**
   - En `index.css`:
     - En `:root`, nuevos tokens: `--status-success` teal-700 `oklch(0.511 0.096 186.391)`, `--status-progress` orange-800 `oklch(0.47 0.157 37.304)` y `--status-danger` red-700 `oklch(0.505 0.213 27.518)`.
     - En `.dark` son `var(--chart-2)`, `var(--chart-1)` y `var(--destructive)`.
     - Registrados en `@theme inline` como `--color-status-*`.
     - Orange-700 se descartó: pasa en la pill (4.59), pero no en el tile `/12` (4.47) ni en la pill sobre una fila en hover (4.48).
   - En `status.ts`, el texto de success, progress y danger de `STATUS_BADGE_CLASS` y `STATUS_TILE_CLASS` pasa a `text-status-*`. Tinte, borde y fill siguen con chart-N o destructive. pending y neutral no cambian.
   - Todo `text-chart-*` y `text-destructive` de dashboard y mi-dia pasa a `text-status-*`:
     - delta del leaderboard (:27 y :32);
     - "N vencida(s)" del semáforo;
     - título y hora de las tareas vencidas de Mi día, sobre `bg-destructive/5`;
     - los dos mensajes de error del dashboard, uno sobre `bg-destructive/10`.
   - Comprobación con rg: no queda ningún `text-chart-` ni `text-destructive` en dashboard, mi-dia ni en las piezas compartidas.
2. **M3.** `STATUS_TONE` añade `Pagado` como success, `50% anticipo` como progress y `Crédito` como pending. `Pendiente` ya existía.
3. **M1.** `lineChartOptions` aplica `animation: false` si se cumple `matchMedia('(prefers-reduced-motion: reduce)')`.
   - Medido con Playwright con `reducedMotion: 'reduce'`: el canvas tiene 714 píxeles de línea a 120 ms de la respuesta de `activity-trend`. Antes eran 0 en los primeros frames.
4. **M2.** Cada fila de `SellerSemaphoreTable` es ahora un `<Link to="/coaching">`, en lugar del `div role=article` con `onClick`. Sale `useNavigate`.
   - Medido con teclado: la fila recibe el foco con Tab (`A`, tabIndex 0), su nombre accesible es el `aria-label` de antes y Enter navega a `/coaching`.
   - Foco visible: anillo inset `ring-3 ring-ring/50` más `bg-muted/30`. Captura en `scratchpad/impl008/fix/focus-semaphore-row.png`.
5. **N4.** `SectionCard` vive en `shared/components/layout/` y sustituye los dos `Section` locales, que se borraron. DashboardPage y MiDiaPage ya no importan `Card*`, `ReactNode` ni `cn` para eso.
6. **N2 y N3.** `StatCard` pinta el badge con `<StatusBadge tone>` en lugar de `Badge` más la clase. `icon` es opcional: sin icono no se pinta la caja.
7. **DataTable.**
   - Nuevo `onRowClick?`. Con él, cada fila lleva `tabIndex=0`, responde a click y a Enter o Espacio (solo cuando el foco está en la fila, no en un botón interno) y muestra foco visible (`ring-3 ring-ring/50` inset y `bg-muted/50`).
   - Con `pagination` (servidor) se pasa `enableSorting: false`: no sale el botón de orden y no se reordena solo la página visible. Sin `pagination`, la ordenación de cliente sigue igual.
   - Sin búsqueda ni selector de filas por página.
   - Hoy ninguna tabla usa `onRowClick`; queda para Clientes y Ventas (009-010).
8. **N1.** `outline-none focus-visible:ring-3 focus-visible:ring-ring/50` en el botón de orden de DataTable y en el hint de StatCard. En las cards del picker de Mi día, la misma clase con `ring-inset` y `bg-muted/30`. Captura en `scratchpad/impl008/fix/focus-picker-card.png`.

### Contraste medido

Medido con `scratchpad/tools/contrast-008.cjs` en Playwright a 1440 px, en admin `/dashboard` y seller1 `/mi-dia`. El color del texto se compone sobre el fondo real, con los tintes alfa apilados sobre la card. El JSON está en `scratchpad/impl008/fix/contrast.json`.

Mínimo por clase en cada tema:

| Elemento | Claro | Oscuro |
|---|---|---|
| Pill danger `bg-destructive/10 text-status-danger` (scores del semáforo, badges 0/10/20 % de Mi día) | 5.35 | 6.19 |
| Pill success `bg-chart-2/10 text-status-success` (badge 250 %) | 4.74 | 4.96 |
| Pill progress `bg-chart-1/10 text-status-progress` (rango 3) | 6.43 | 5.13 |
| Pill pending `bg-chart-4/15 text-foreground` (rango 1, "Atención") | 18.21 | 14.57 |
| Pill neutral `bg-primary/10 text-primary` (rango 2, tag) | 14.50 | 12.93 |
| Tile danger `/12` (icono de alerta) | 5.16 | 6.03 |
| Tile success `/12` (icono de alerta) | 4.63 | 4.85 |
| Tile pending `/15` (filas ámbar del Termómetro) | 18.21 | 14.57 |
| Tile neutral `/12` | 13.97 | 12.21 |
| Delta del leaderboard +14 / +7 (`text-status-success`) | 5.36 | 5.40 |
| Delta -5 y "N vencida(s)" (`text-status-danger`) | 6.42 | 6.85 |

Resultado: 0 casos por debajo de 4.5 en las 4 sesiones (25 elementos por tema). El mínimo es 4.63 en claro y 4.85 en oscuro. No hubo page errors.

Peores casos sintéticos (`scratchpad/tools/contrast-synth.cjs`, compuestos sobre `--background`):
- **Claro:** el tile `/12` sobre una fila en hover (`bg-muted/30`) da 6.16 en progress, 4.54 en success y 5.06 en danger.
- **Oscuro, sobre `--background`, que es más oscuro que la card:** el tile success `/12` sobre una fila en hover da 4.49. Hoy no hay tiles dentro de filas con hover, y en oscuro el token es `chart-2` por regla de DESIGN.md.

### Props finales

- `SectionCard`:
  - `title: string`;
  - `icon: ReactNode`;
  - `description?: ReactNode`;
  - `actions?: ReactNode` (va en `CardAction`, a la derecha de la cabecera);
  - `titleId?: string` (id del `<h2>`, para el `aria-labelledby` del gráfico);
  - `className?: string` (posición en el bento);
  - `contentClassName?: string`;
  - `children: ReactNode`.
  - Las dos últimas props no las pidió el Líder; las necesitan el `role=figure` del gráfico y los `lg:col-span-*`.
- `DataTable<TData>`:
  - `columns: ColumnDef<TData>[]`;
  - `data: TData[]`;
  - `getRowId?: (row) => string`;
  - `pagination?: { page, pageCount, onPageChange, disabled?, label? }` (de servidor; si está, la ordenación se desactiva);
  - `onRowClick?: (row: TData) => void`.
- `StatCard`:
  - `label: string`;
  - `value: ReactNode`;
  - `icon?: ReactNode`;
  - `badge?: { label: string; tone: StatusTone }` (se pinta con `StatusBadge`);
  - `description?: ReactNode`;
  - `hint?: string`;
  - `children?: ReactNode`;
  - `className?: string`.

### Gates

`pnpm run typecheck && pnpm run lint && pnpm run build` sale con 0. El único aviso es el `INEFFECTIVE_DYNAMIC_IMPORT` previo. El rg de hex, `tracker-`, `text-slate-`, `text-[Npx]`, `variant="success"`, `text-chart-` y `text-destructive` sobre dashboard, mi-dia y las piezas compartidas da 0 resultados.

Capturas en `scratchpad/impl008/fix/{admin-1440-light,seller-1440-dark}/`, sin page errors.

## Ajuste del Líder tras la re-review

- M4: el foco de fila de `DataTable` con `onRowClick` pasa de `focus-visible:bg-muted/50` a `/30`, así la pill y el tile success siguen en AA en oscuro.
- N8: el `onClick` de fila ignora los clicks que salen de `a, button, input, select, textarea, [role=menuitem]` dentro de la fila, igual que la guarda de teclado.
- Gates: typecheck, lint y build salen con 0.
