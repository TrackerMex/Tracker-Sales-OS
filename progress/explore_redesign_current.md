# Explore: estado actual del UI frontend (feature 81-visual-redesign)

Rama `81-visual-redesign` (desde origin/main 55b22e1). Rutas relativas a `frontend/src/` salvo indicación. Solo lectura.

## 0. Hallazgos clave (TL;DR)

- **CSS legacy sin capa gana a Tailwind**: las clases de `index.css` están fuera de `@layer`, así que vencen a cualquier utility (`@layer utilities`) que toque la misma propiedad. Hay varios bugs silenciosos (ver §2.3). Es la mayor trampa del rediseño.
- **Tokens incoherentes**: `--primary` de shadcn es teal (`oklch(0.508 0.118 165.6)`, index.css:68-101), los `--chart-1..5` son todos rojos y `--font-sans` es Noto Sans Arabic (index.css:8). Nada de eso es la marca (navy #002B49 / verde #82bc00 / Montserrat).
- **DESIGN.md desactualizado**: documenta `.btn-*` y `.tag-*`, que ya no existen, dice Huge Icons cuando se usa reicon-react, y fija la fuente en Montserrat + system.
- **Faltan piezas compartidas**: no hay PageHeader, StatCard/KPI, EmptyState, DataTable (`@tanstack/react-table` está instalado pero sin usar), Toolbar de filtros, ProgressBar ni uso de Skeleton.
- **Títulos y paddings distintos en cada página** (5 estilos de título, 3 patrones de padding), y además el Header del shell repite el título.
- **Riesgos duros**: el popup de lámina clona el CSS de la app; el drag-and-drop del pipeline depende de `.pipe-col`/`.pipeline-scroll`; `main{padding !important}` en móvil afecta a SidebarInset; no hay tests visuales ni de frontend.

## 1. Shell

| Pieza | Archivo:línea | Notas |
|---|---|---|
| Entrada | main.tsx (25 l.) | QueryClient; importa fuentes Noto Sans Arabic + Montserrat (6-7); Devtools solo en dev |
| Router | App.tsx (55 l.) | Árbol de rutas manual: index, login, lamina y `_app` con 12 hijas (21-39). `TooltipProvider` en 51, **duplicado** en AppLayout.tsx:10 |
| Root | routes/__root.tsx | `<Toaster richColors position="top-right">` |
| Guard | routes/_app.tsx | Comprueba `accessToken` en localStorage y redirige con `?redirect` |
| Redirects | routes/index.tsx; routes/_app/dashboard.tsx:8-18 | Un Seller que entra a /dashboard va a /mi-dia |
| Layout | shared/components/layout/AppLayout.tsx (23 l.) | `SidebarProvider > AppSidebar + SidebarInset(overflow-hidden) > Header + div.flex-1.overflow-y-auto.bg-tracker-bg.p-5 > Outlet` + CommandPalette |
| Sidebar | components/app-sidebar.tsx (65 l.) | shadcn `collapsible="icon"` (29); filtra por rol (20-26); logo `/brand/trackermexico.png` expandido y `/brand/tracker.png` colapsado (33-52); NavMain, NavUser, SidebarRail |
| Nav | components/nav-main.tsx (50 l.) | Ítem activo si `pathname === url` o empieza por `url + "/"`; tooltip = label |
| Usuario | components/nav-user.tsx (110 l.) | Avatar con iniciales `bg-tracker-green/20`; menú con "Cerrar sesión" vía `useLogout` |
| Items | shared/navigation/nav-items.tsx (118 l.) | NAV_SECTIONS: Principal (Dashboard A/D, Mi día) · Gestión (Clientes, Agenda, Registrar actividad, Pipeline, Ventas) · Análisis (Coaching, Reportes A/D) · Configuración (Equipo A/D, Configuración, Import/Export solo Admin). Lo comparten Sidebar y CommandPalette |
| Header | shared/components/layout/Header.tsx (141 l.) | `ROUTE_TITLES` (7-50) duplica los títulos de las páginas; `h-[54px] bg-white` (67); acciones rápidas solo en desktop (85-125): Buscar Ctrl K (evento `open-command-palette`), +Tarea, +Prospecto, Registrar actividad (success). Logout con `clearAuth()` (127-137): **segundo camino de logout**, distinto de NavUser |
| Paleta | shared/components/command/CommandPalette.tsx (79 l.) | Se abre con Ctrl/Cmd+K o con el evento de window; grupo "Acciones" + navegación filtrada por rol |
| Estado sidebar | components/ui/sidebar.tsx:26-31 | Se guarda en la cookie `sidebar_state`; ancho 16rem, 18rem en móvil, 3rem en modo icono; atajo Ctrl/Cmd+B. En móvil usa Sheet (161). `SidebarInset` renderiza `<main>` (282-293) |
| Store | shared/store/app.store.ts (47 l.) | `sidebarOpen`/`toggleSidebar` **sin uso**; solo persiste `currentUser` (clave `tracker-sales-app`) |
| Dark mode | components/theme-provider.tsx (230 l.) | **No está montado**. ui/sonner.tsx:8 fuerza `theme="light"`. Ya existe `@custom-variant dark` (index.css:5) y hay ~12 `dark:` en ui/*. PRODUCT.md lo marca como "futuro" |

Código muerto en el shell: components/nav-projects.tsx (85 l.) y components/team-switcher.tsx (91 l.), restos del bloque shadcn con copy en inglés.

## 2. Tokens y CSS legacy (index.css, 794 l.)

### 2.1 Tokens
- `@theme inline` (7-66): fuente, mapeo de shadcn, `--color-tracker-*` (dark, blue, green, bg, surface, surface-alt, border, text, text-secondary, text-muted, text-dim, danger(-dark), success(-dark), warning(-dark), purple) y escala de radios.
- `:root` shadcn OKLCH (68-101): primary teal (fuera de marca), chart-1..5 rojos, `--radius 0.45rem`. `.dark` (103-135).
- `@layer base` (137-161): bordes, cursor pointer, foco con outline verde de 2px.
- Segundo `:root` (167-211): hex `--tracker-*` (#001524, #002b49, #82bc00, #eef2f7…); override del sidebar a navy (187-195), declarado después de `.dark`, así que el sidebar es navy en ambos temas; escala `--sp-1..12`; `--sidebar-width: 276px`, que choca de nombre con la variable de shadcn y solo usa `.page-grid`.
- `body{background:var(--tracker-bg)}` (418); scrollbar (399-409); reduced-motion (713-719); overrides móviles (755-788), con `main{padding:var(--sp-3)!important}` (~757) que **alcanza a SidebarInset**.
- No existe ningún `@media print` en index.css.
- Colores de etapa del pipeline en hex, copiados en 3 sitios: DealCard.tsx:16-24, DealPeek.tsx:7-15 y ClientDetailPage.tsx:39-47. Las variantes tracker de Badge también van en hex (ui/badge-variants.ts:43-50).

### 2.2 Clases legacy: uso en módulos

| Clase (línea) | Usos | Dónde |
|---|---|---|
| `.slabel` (269) | **76 / 13 arch.** | Sales 22, ActivityForm 18, Clientes 8, EditSaleModal 8, Coaching 4, MiDia 4, Equipo 4, Login 2, ImportExport 2, Settings/Pipeline/Activities/SaleFormBase 1 |
| `.card` (214) | ~27 / 9 arch. | MiDia 9, Dashboard 5, Equipo 4, Coaching 3, Activities 2, ImportExport 2, DealCard, ActivityForm, TaskCard |
| `.card-header/.card-h3/.card-meta/.card-body` (557-576) | 5/5/3/3 | Solo en Dashboard |
| `.kpi-strip` (282) / `.kpi-cell` + `.ac/.kl/.kv/.ksb` (301) | 3 / 12 | KPIStrip, MiDia; `.kl` también en ActivityHistoryModal y ActivitiesPage |
| `.kv-sub(-light)` (701/706) | MiDia | |
| `.empty-state` (391) | 11 / 8 arch. | |
| `.ai-box` (262) | 6 / 5 arch. | ActivityForm, Coaching×2, MiDia, CreateTaskForm, Clientes |
| `.prog/.prog-fill` (343-349, 744-752) | 6 / 5 arch. | `transition-all` que obliga a usar `!transition-transform` |
| `.page-grid` (307) | 3 | Dashboard, MiDia (usa `--sidebar-width`) |
| `.page-title/.page-subtitle` (538/544) | 3 c/u | Dashboard, MiDia, Coaching; `.page-timestamp` solo Dashboard |
| `.log-card` (384) | 2 | Activities, Clientes |
| `.seller-row` (352/683) | 2 | SellerSemaphoreTable, Equipo |
| `.alert-item` + modificadores (362, 532-535) | 1 | AlertsPanel |
| `.pipeline-scroll/.pipe-col/.pipe-col-body/.pipe-col-h` (489-529) | 1 c/u | PipelinePage, KanbanColumn; hex fijos; `max-height: calc(100vh - 260px)` |
| `.seller-banner`, `.seller-pick-card/.spc-*`, `.task-item/.ti-*`, `.thermo-alert`, `.rule-title/.rule-desc` | 1 c/u | MiDia, TaskCard |
| **Sin uso (eliminar)** | 0 | `.tag/.tag-*` (233-260), `.input/.input-error` (219), `.dt` (367-381), `.dt-scroll` (791), `.modal-blur` (412), `.sb-logo/.sb-section/.sb-footer/.navbtn/.ni` (423-486), `.text-tracker-label` (275) |

### 2.3 Conflictos de cascada: la utility pierde frente a la clase legacy
- MiDiaPage:499 `empty-state text-tracker-danger`: el rojo no se ve.
- ClientesPage:699 `empty-state py-12`: el padding no se aplica.
- ClientesPage ~396-427 `slabel text-slate-400` sobre el panel navy: queda #64748b sobre navy (**contraste AA roto**).
- CoachingPage:224 y MiDiaPage:477 `slabel … text-tracker-purple`: el morado no se ve.
- SalesPage:504, 519, 548, 571 y 595 `slabel mb-1 text-tracker-text-muted`.
- KanbanColumn.tsx:45-46 `pipe-col` + `border-tracker-green bg-[rgba(130,188,0,0.05)]` durante el drag: el resaltado del drop target probablemente no se ve.
- DealCard.tsx:82 `card … hover:shadow-[…]`: `.card` fija la sombra y el hover probablemente pierde.

## 3. Bloques UI compartidos

**components/ui (cuántos archivos los importan)**
- Muy usados: button 24, badge 14, select 11, input 10, tooltip 8, dropdown-menu 7, textarea 7, accordion 7, dialog 6, card 6, alert-dialog 5.
- Poco usados: table 3 (Dashboard, LeaderboardTable, Reports), popover 3, tabs 2, command 2, sheet 1 (Pipeline), hover-card 1, calendar 1, checkbox 1, time-picker 1.
- Nunca en módulos: skeleton, separator, breadcrumb, collapsible, label. avatar solo en nav-user.

**Variantes personalizadas**
- ui/button-variants.ts: default `bg-tracker-blue`; **`ghost` y `secondary` son iguales** (bg-slate-100, así que ghost no es transparente); success verde con texto oscuro; destructive red-100; base `text-xs` semibold con anillo de foco verde; tamaño default h-8.
- ui/card.tsx: CardTitle `font-heading text-sm bold tracker-blue`; acepta `size="sm"`.
- ui/table.tsx: `text-[13px]`, header en surface-alt.
- ui/tabs.tsx: activo `bg-tracker-dark text-white`.
- ui/dropdown-menu.tsx: estilo vidrio (`rounded-2xl backdrop-blur-2xl bg-popover/70`), posiblemente fuera de marca.

**shared/components**
- Icon.tsx (102 l.): `createIcon` sobre reicon-react, tamaño 18 por defecto, 36 iconos exportados, 29 archivos lo usan. Button fuerza 16px con `[&_svg]:size-4`.
- forms/: ClientCombobox (4 usos), DatePickerField (6), TimePickerField (3), FieldError (8), FormErrorSummary (9).
- peek/Peek.tsx (PeekHeader/Row/Actions, lo usa DealPeek).

**shared/lib**
- format.ts `formatCurrency` (MXN, 0 decimales), duplicada en SalesPage:81.
- constants.ts: DAILY_MIN_POINTS=30, PIPELINE_STAGES, STAGE_PROBABILITY.

**Piezas que no existen**
- PageHeader.
- StatCard: hoy hay KPIStrip (labels fijos), KPICard muerto, StatCell local en CoachingPage:43, tiles con Card en SalesPage:735-761 y kpi-cells inline en MiDia.
- EmptyState: solo existe como CSS, y Coaching tiene una tarjeta propia en :342.
- DataTable.
- FilterToolbar.
- ProgressBar compartido: Coaching tiene uno local en :72.
- Skeleton: hay 8 archivos con bloques `animate-pulse` hechos a mano.

**Código muerto**
- components/nav-projects.tsx y components/team-switcher.tsx
- dashboard/components/KPICard.tsx y dashboard/components/OverdueTasksList.tsx
- sales/components/SaleFormBase.tsx (258 l.)
- components/theme-provider.tsx (no montado)
- store `sidebarOpen`
- CSS legacy con 0 usos

## 4. Páginas

Métricas por archivo: líneas / hex / `text-[Npx]` / clases arbitrarias / `style={{` / h1-h3.

| Ruta | Archivo | Métricas | Secciones | Shared vs ad-hoc / inconsistencias |
|---|---|---|---|---|
| /login | auth/…/LoginPage.tsx | 151/0/5/8/0/2 | Tarjeta partida: panel navy de 300px con logo (h1:53) y formulario (h2 `text-[22px] font-extrabold`:87) | Labels `.slabel` (96, 110); sombra arbitraria; "Contrasena" sin ñ (110) |
| /dashboard | dashboard/…/DashboardPage.tsx | 407/7/6/8/0/6 | Header `.page-title` "Dashboard de ventas" + subtitle + timestamp (143-171); banner de error #FCA5A5; KPIStrip (174); `.page-grid` con gráfico de actividad + AlertsPanel; SellerSemaphoreTable (lista div con `.seller-row` + `.prog`); LeaderboardTable (shadcn Table); "Deals en riesgo" (Table + Badge + paginación, 294-407) | Todo usa `.card/.card-header/.card-h3`, no shadcn Card. KPIStrip.tsx:14-24 tiene un tooltip CSS propio (bg #0f172a) en lugar de shadcn Tooltip; `unitsGoal=150` fijo (182) |
| /mi-dia | mi-dia/…/MiDiaPage.tsx | 632/2/5/28/1/1 | Skeleton (92); SellerPicker para A/D (168, `.page-title` + `.seller-pick-card`); vista vendedor: `.seller-banner` (362), kpi-strip de 5 celdas (377-456, scaleX en 389), `.page-grid` con termómetro + `.ai-box`, tareas (`.task-item`, AlertDialog para completar) y regla (608+) | La vista principal no tiene título; `<button>` nativo; iconos #334155/#64748B; conflictos en 477 y 499 |
| /clientes | clients/…/ClientesPage.tsx | **1093**/3/14/25/0/2 | Lista (537+): h2 `text-xl font-black text-[#002B49]`, Input de búsqueda + toggles + "+ Nuevo cliente", grid `minmax(280px,1fr)`; detalle como **modo dentro de la página** (361+): "← Volver", `grid-cols-[280px_1fr]` no responsive, panel navy + Cards de etapa e historial (`.log-card`); Dialog crear/editar (752, `w-[min(…,1120px)]`, grid arbitrario en 971); AlertDialog para borrar (708); `.ai-box` (1069) | `p-6` sumado al `p-5` del layout (padding doble); loading y error en texto plano; link #00A8E8 cyan fuera de marca (962); conflictos en 396-427 y 699 |
| /agenda | tasks/…/AgendaPage.tsx | 377/1/1/3/–/1 | h1 `text-sm font-bold text-tracker-text` "Compromisos comerciales"; Select de vendedor (solo en calendario, guardado en localStorage `tasks_team_seller_filter`); Tabs Lista/Calendario; TaskCard (`.card`, 256 l.); CalendarView (**877 l.**, HoverCard, 11 `text-[px]`); CreateTaskForm (433) y EditTaskForm (296) en Dialog | Skeleton hecho a mano; `.empty-state` con link #002B49 |
| /actividades/nueva | activities/…/ActivitiesPage.tsx | 238/9/7/11/2/1 | h1 `text-lg font-bold text-tracker-blue` + píldora "/ 30 pts" (#EEFAD4, valor fijo aunque existe DAILY_MIN_POINTS); tarjeta de progreso (`.card .kl .prog`); ActivityForm inline (**781 l.**, 18 `.slabel`); lista `.log-card` + DropdownMenu que abre ActivityHistoryModal | `getPointsBarColor` en hex (#82bc00/#F59E0B/#EF4444); píldora de tarea #EEF2FF/#3730A3 |
| /pipeline | pipeline/…/PipelinePage.tsx | 365/0/3/10/0/1 | h1 `text-lg` + subtítulo + stats inline (Total bruto, Forecast); Select de vendedor A/D; SkeletonColumns; KanbanBoard (72-101) `.pipeline-scroll` + `autoScrollForElements`; KanbanColumn (`.pipe-col` de 252px, `dropTargetForElements`); DealCard (draggable 66-75, Popover peek, badge con style hex); Dialog de motivo de pérdida (274); Sheet (338, `sm:max-w-[640px] lg:max-w-[720px]`) con ClientDetailPage (412 l.: header sticky con botón "×" en `text-[22px]`, stepper de etapas, Card size=sm + Accordion, footer sticky "Registrar avance") | Hay **dos UIs de detalle de cliente** (ClientesPage y ClientDetailPage). Conflictos en KanbanColumn:45 y DealCard:82 |
| /ventas | sales/…/SalesPage.tsx | 902/8/0/8/0/4 | h2 `text-xl font-black text-[#002B49]`; Seller ve un form en Card; A/D ven dos columnas (form de Dirección sobre panel navy + form ATC en Card); "VENTAS REGISTRADAS" + 4 stat Cards (735-761, `text-2xl font-black`); lista divide-y (no tabla) con Badge y menú; EditSaleModal (219 l.); AlertDialog | `p-6` propio; monto en verde #82bc00 sobre blanco (**contraste**); formatCurrency duplicada (81); conflictos en 504-595 |
| /coaching | coaching/…/CoachingPage.tsx | 364/11/12/32/1/1 | Wrapper `mx-auto max-w-[1200px] p-6`; `.page-title`; stat "Mínimo diario" `text-[18px]`; Select de vendedor `w-[220px]`; grid de SellerCoachingCard (`.card p-5`, StatCell (43) y ProgressBar (72) locales); `.ai-box`; tarjeta vacía propia (342) | Cinco tamaños `text-[px]` distintos; hex #0F172A/#94A3B8/#64748B; conflicto en 224 |
| /reportes | reports/…/ReportsPage.tsx | 478/4/6/14/0/0 | Wrapper `flex flex-col gap-4`; Card p-5 de configuración (196, título `text-[15px]` "Informe Ejecutivo Mensual", metas, menú Guardar/Copiar/Compartir, "Abrir lámina" en 320); loading y error en texto; ExecutiveSlide; "Detalle Top Vendedores" (Card + Accordion + Table, 359-415); "Resumen para Dirección" (418, `id="executive-report-text"`) | Sin título de página; metas en localStorage (`loadGoals`) |
| (slide) | reports/…/ExecutiveSlide.tsx | 610/3/26/**121**/3/– | Raíz `id="executive-slide"` (92) con Montserrat inline (95); banda navy (98); KPI row `grid-cols-4` (145); Dirección + Equipo `grid-cols-[190px_1fr]` (214); ATC + Origen (307); Win/Loss (350); Análisis IA + Health (536, 578). 4 `<table>` nativas (250, 401, 455, 500); Bar con scaleX (46-60) | Diseño fijo de 1080px, sin breakpoints; densidad de valores arbitrarios muy alta. Es identidad de marca (Montserrat se mantiene a propósito, plans/README) |
| /lamina | reports/…/LaminaPage.tsx | 68/0/3/6/1/– | Sin shell; `min-h-screen bg-tracker-bg p-8` con Montserrat inline (35-37), `max-w-[1080px]`, ExecutiveSlide y pie de página | Guard de auth propio en routes/lamina.tsx; metas por search params |
| /equipo | equipo/…/EquipoPage.tsx | 387/0/0/2/0/1 | `space-y-8 p-6`; h2 `text-xl font-black text-tracker-blue` (152); `grid grid-cols-3` (155, **no responsive**) con 3 `.card p-5` (Alta comercial, Crear usuario, Usuarios del sistema: 157/182/240); "Equipo comercial" (299) con grid `.seller-row`; Tooltip; AlertDialog (356) | `.slabel` como título de card en lugar de CardTitle |
| /configuracion | settings/…/SettingsPage.tsx | 177/0/2/4/0/1 | `max-w-[560px] space-y-5`; h1 `text-lg` (101); form con shadcn Card + Accordion; FormErrorSummary | La página que mejor usa shadcn |
| /import-export | import-export/…/ImportExportPage.tsx | 183/2/6/10/0/2 | h1 `text-lg font-bold text-tracker-blue` (104; otro h1 en 42 para la vista sin permiso); 2 `.card space-y-3 p-5` (107, 118) con `.slabel` como título; lista de errores `.empty-state` (139) | |

**Títulos de página (5 estilos más el Header del shell)**

| Estilo | Páginas |
|---|---|
| `.page-title` (20px bold blue) | Dashboard, MiDia (picker), Coaching |
| h2 `text-xl font-black` (#002B49 o tracker-blue) | Clientes, Ventas, Equipo |
| h1 `text-lg font-bold text-tracker-blue` | Actividades, Pipeline, Settings, ImportExport |
| h1 `text-sm font-bold text-tracker-text` | Agenda |
| Sin título | MiDia (vista vendedor), Reportes |

**Padding del wrapper**
- `p-6` propio, que se suma al `p-5` del layout: Clientes, Ventas, Coaching (además max-w-1200) y Equipo.
- Sin padding (`space-y-*` o flex): Agenda, Actividades, Pipeline, Reportes y Dashboard.
- `max-w-[560px]`: Settings.

## 5. Gráficos

- chart.js + react-chartjs-2 **solo en DashboardPage**: un ActivityChart Line local (51-94) con colores hex fijos #82bc00 y #001524, alto `h-[180px]` y registro de chart.js en el propio archivo.
- El resto son barras CSS: `.prog` (scaleX inline), Bar de ExecutiveSlide (46-60), ProgressBar de Coaching (72) y SellerSemaphoreTable.
- Los tokens `--chart-1..5` (todos rojos) no los usa nadie. Si el rediseño añade gráficos, conviene definirlos con la paleta de marca.

## 6. Quality gates

- Scripts en frontend/package.json:
  - `dev`
  - `build` = `tsc -b && vite build`
  - `lint` = `eslint .`
  - `typecheck` = `tsc --noEmit`
  - `format` (prettier)
- Gestor de paquetes: pnpm@10.33.4.
- CI (.github/workflows/ci.yml:51-83): job `frontend` con Node 22, `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run lint` y `pnpm run build`.
- docs/verification.md exige pnpm (prohíbe npm y bun). plans/README.md todavía dice "npm run …".
- **No hay tests de frontend** (ni vitest, ni testing-library, ni e2e, ni regresión visual). Lo único parecido es un script Playwright ad-hoc (progress/test_pipeline_scroll.mjs, `playwright-core` en progress/package.json) que apunta a localhost:3001 y está fuera de CI.
- plans/README.md lista los `style={{` dinámicos permitidos (DealCard badge, stepper de ClientDetailPage, SellerSemaphoreTable, KPICard, progreso en Activities/ActivityForm, MiDia:390, ExecutiveSlide:57/94/596, LaminaPage:37, ProgressBar de Coaching). Un rediseño que añada `style={{` nuevos rompe esa convención.

## 7. Riesgos del rediseño

1. **Popup de lámina** (ReportsPage.tsx:158-190): clona todos los `link[rel=stylesheet]` y `<style>` de la app (174) y escribe estilos **sin capa** para body y `@media print` (182-184): body Montserrat, fondo #EEF2F7, padding 32px; `#executive-slide` con max-width 1080px; en impresión quita borde, radio y sombra. Por eso:
   - Cualquier cambio en index.css (reset global, `body` background, fuentes base, tokens `tracker-*`) se ve en la lámina y en la impresión.
   - Si se mete un reset sin capa en index.css, vuelve el bug de commit 30b4bb7 (STATUS.md).
   - Si se renombran tokens, la lámina pierde colores.
   - Validación manual obligatoria: ruta /lamina, popup e impresión a PDF. Valores de referencia de STATUS.md: navy rgb(0,21,36), padding 22px 28px, Montserrat, fondo #EEF2F7 con 32px.
2. **ExecutiveSlide** (610 l., 121 valores arbitrarios, 4 tablas nativas, grids fijos): se diseñó como lámina de 1080px para PDF o PowerPoint. Conviene excluirla del rediseño general o tratarla aparte; Montserrat es identidad y se mantiene.
3. **Drag-and-drop del pipeline** (@atlaskit/pragmatic-drag-and-drop):
   - `draggable` vive en DealCard.tsx:66-75, junto al `onClick` que abre el Sheet y al Popover peek con stopPropagation.
   - `dropTargetForElements` vive en KanbanColumn y `autoScrollForElements` en `.pipeline-scroll` (PipelinePage:72-101).
   - Cambiar el contenedor de scroll, el ancho de `.pipe-col` (252px) o el `max-height: calc(100vh - 260px)` afecta al auto-scroll y a la altura del tablero. Hay que reprobar el arrastre a mano (no hay tests).
   - El resaltado del drop está roto hoy por la cascada (§2.3).
4. **Cascada legacy**: mientras sigan las clases sin capa (`.slabel` ×76, `.card` ×27…), las utilities que se añadan sobre ellas pueden fallar sin avisar. O se mueve el CSS legacy a `@layer components` o se eliminan sus usos. Moverlo a la capa cambia la precedencia de golpe en 13+ archivos y requiere revisión visual de todas las páginas.
5. **Shell compartido**: Header, AppLayout (`p-5`) y `main{padding !important}` en móvil (index.css ~757 aplicado a SidebarInset) afectan a todas las páginas. Unificar el padding exige quitar los `p-6` de Clientes, Ventas, Coaching y Equipo al mismo tiempo. Header.ROUTE_TITLES y los títulos de cada página se pisan: hay que decidir dónde vive el título (¿PageHeader o Header?).
6. **Tokens shadcn fuera de marca**: arreglar `--primary`, `--chart-*` y `--font-sans` cambia de golpe todos los componentes ui/* que los consumen (focus ring, checkbox, calendar, etc.). Además, el override navy del sidebar se declara después de `.dark`.
7. **Dark mode**: no está cableado (ThemeProvider desmontado, sonner en light, sidebar navy fijo). Si entra en el alcance, todos los hex fijos en módulos (≈80 ocurrencias: Coaching 11, ClientDetailPage 10, Activities 9, DealCard 8, DealPeek 8, Sales 8, Dashboard 7…) bloquean.
8. **Responsive roto hoy**: Equipo `grid-cols-3` (155), detalle de Clientes `grid-cols-[280px_1fr]`, ExecutiveSlide con grids fijos, y el objetivo de PRODUCT.md (laptops de 13-15").
9. **Sin red de seguridad**: sin tests de frontend ni visuales, la verificación será manual o con Playwright ad-hoc. Para comparar antes y después, conviene capturar screenshots de referencia de todas las rutas y roles (Admin, Director, Seller) antes de tocar nada.
10. **Docs**: DESIGN.md hay que reescribirlo con el nuevo sistema (hoy describe `.btn-*`/`.tag-*`, Huge Icons y la fuente equivocada), y PRODUCT.md exige marca navy/verde y densidad útil.
