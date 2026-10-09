# Explore: inventario visual del template next-shadcn-dashboard (feature 81)

Fuente: `github.com/shadcndashboard/next-shadcn-dashboard` @ `91deb10` (clon read-only en scratchpad, sin instalar ni ejecutar nada).
Demo: https://shadcndashboard-demo.vercel.app. Las medidas "computed" salen del DOM del demo (Playwright, 1440x900).
Capturas: `progress/redesign/template/*.png` (full page).
Rutas de archivos relativas a la raíz del template. `L/` = `app/(dashboard-layout)/layout/`.

> Clave para entender el look: `<html class="style-lyra" data-card-shadow="false" data-sidebar-type="true">` (`app/layout.tsx`).
> El estilo shadcn **Lyra** (`app/css/styles/style-lyra.css`, reglas `.style-lyra .cn-*`) hace todo **compacto y cuadrado**: card `rounded-none`, `text-xs` base en controles, `h-8` en inputs/botones. Encima, las páginas se arman como un **"bento" de líneas hairline**: el contenedor es `p-px gap-px bg-border` y cada bloque es `bg-background`, así que el `gap-px` deja ver líneas de 1px (no hay bordes ni sombras en las cards).
> Tema neutro monocromo (baseColor `neutral`): primary casi negro, el color solo aparece en badges de estado (tokens `chart-*` / `destructive` al 10%).

---

## 1. Shell

Archivo raíz: `app/(dashboard-layout)/layout.tsx`
```
<SidebarProvider defaultOpen style={{"--sidebar-width-icon":"52px"}}>
  <AppSidebar/>
  <SidebarInset className="outline outline-border m-2 rounded-none! overflow-hidden">
    <Header/>
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="w-full mx-auto container">        // container = max-w-[1367px] mx-auto (globals.css @utility container)
        <div className="min-h-[calc(100vh-140px)]">{children}</div>
        <div className="pt-6"><Footer/></div>
```
Capturas: `home-1440.png`, `home-collapsed-1440.png`, `home-390.png`, `home-mobile-sidebar-390.png`.

### Sidebar (`L/vertical/sidebar/app-sidebar.tsx`)
- `<Sidebar variant="inset" collapsible="icon">` + `className="sidebar-box **:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:border-border group-data-[state=collapsed]:hover:shadow-xl"`.
- Ancho: expandido **256px** (`SIDEBAR_WIDTH=16rem`, container con `p-2` → panel visible 240px con borde 1px, fondo `bg-background` blanco, no `bg-sidebar`); colapsado **52px** (`--sidebar-width-icon`); móvil sheet **288px** (18rem; medido 293).
- Colapsado = rail de iconos con headings reemplazados por `...`; **hover expande a 256px** como overlay con `shadow-xl` (CSS en `app/globals.css` bloque `[data-sidebar-type="true"] ... .sidebar-box:hover { width:256px }`, clases `.hide-menu` ocultas en mini). Ver `home-collapsed-1440.png`.
- Logo: `SidebarHeader className="p-3 group-data-[state=collapsed]:px-2.5 flex flex-row items-center justify-between border-b border-border"` → logo (icono negro cuadrado redondeado + "Shadcn / Dashboard" en 2 líneas) a la izquierda y `<Badge variant="secondary">V.1.0</Badge>` a la derecha. Alto 57px (igual al header → líneas alineadas).
- Grupo: `SidebarGroup className="px-3 py-4"` → `flex flex-col gap-4` entre secciones.
- Heading de sección (`L/vertical/sidebar/nav-collapse/index.tsx`): `text-xs uppercase block font-semibold text-muted-foreground mb-2` (12px/600, gris).
- Item (`L/vertical/sidebar/nav-items/index.tsx`): `flex items-center gap-3 w-full px-3 py-2 my-0.5 rounded-md` + texto `text-sm font-medium` (14px), icono lucide `h-4 w-4` con `gap-2`. Alto efectivo **36px** (40 con my-0.5), radio **8px**.
- Activo: `bg-primary text-background font-medium` → **pastilla negra rellena, texto blanco** (en dark: pastilla blanca, texto negro; `home-dark-1440.png`).
- Hover: capa animada (motion `layoutId`) `absolute inset-0 bg-primary/5 rounded-lg`.
- Submenús: `<details>` con chevron `ChevronRight h-4 w-4 group-open/nav:rotate-90`; hijos en `pl-3 ml-5 border-l border-border`, subitem `px-2 py-1 my-1`, activo `bg-primary/5 text-primary` (tinte suave, no relleno).
- Badges de item: `ms-auto text-xs rounded-full px-2 py-0.5` (filled `bg-primary text-white` u outline `border border-primary text-primary`).
- Footer del sidebar (`SidebarFooter className="p-4"`):
  - Tarjeta de plan (`L/vertical/sidebar/nav-secondary.tsx`): bloque full-bleed `-mx-4 border-t border-b border-border px-5 py-5`; fila icono `Rocket size-5` + "Basic Plan" `font-medium text-base` + "70%"; barra `h-1.5 rounded-full bg-foreground/10` con relleno `bg-foreground`; texto `text-sm text-muted-foreground text-center`; botón `h-9 bg-foreground text-background rounded-lg text-sm font-medium w-full`.
  - Links secundarios (`nav-user.tsx`): `SidebarMenuButton size="lg"`, icono `size-5`, `text-sm font-medium` (Help Center / Documentation).
- Scroll interno con SimpleBar (nosotros: `ScrollArea` o overflow nativo).

### Header (`L/vertical/header/index.tsx`)
- `<header className="sticky top-0 z-2 bg-background border-b border-border">` → **sticky, solo borde inferior, sin sombra**. Alto **57px** (contenido `p-2` + controles de 40px).
- Izquierda: (`lg:hidden` logo) · botón toggle `Button variant="ghost" size="icon" className="p-2 hover:bg-primary/5 rounded-full"` con `PanelLeft size={21}` · `Separator vertical h-4 mr-4 ml-2 max-lg:hidden` · búsqueda (`sm:block hidden`).
- Búsqueda (`L/shared/header/search.tsx`): `w-xs` (320px), `Input className="rounded-lg pl-10!"` (32px alto, 12px texto, radio 8px), icono `SearchIcon size=16 absolute left-3 text-muted-foreground`, placeholder "Search....". Resultados en panel `absolute bg-card rounded-md top-11 shadow-md border`.
- Derecha `flex sm:gap-1 items-center`: toggle tema (`L/shared/header/light-dark.tsx`: ghost `h-10 w-10 rounded-full hover:bg-primary/5`, `Moon/Sun size-5`, con view-transition clip-path) · notificaciones (`notifications.tsx`: `Bell size-5` en círculo 40px, punto `h-2.5 w-2.5 bg-destructive rounded-full absolute top-1 end-2` + `animate-ping`; dropdown `sm:w-[360px] py-6`, item `px-6 py-3` con icono en `h-11 w-11 rounded-xl border`) · perfil (`profile.tsx`: avatar `h-8 w-8` en botón circular 40px, abre **Sheet derecho** `sm:max-w-80` con avatar 64px centrado, nombre `text-lg font-semibold`, email, lista `py-2 px-3 rounded-md hover:bg-primary/5 text-muted-foreground`, separadores `border-t border-dashed`).
- Móvil: búsqueda y notificaciones ocultas; quedan logo + toggle + tema + avatar (`home-390.png`).

### Contenido
- `SidebarInset`: `m-2` + `outline outline-border` (marco de 1px alrededor de todo el área principal), `rounded-none`, `bg-background`, `shadow-sm` sutil (lyra). Fondo de página = blanco; NO hay fondo gris con cards blancas: el contraste viene de líneas.
- Padding de contenido `p-4` (16px); `container` max-width **1367px** centrado. A 1440 el ancho útil medido es 1144px.
- Footer (`L/footer/page.tsx`): `flex md:flex-row flex-col items-center justify-between gap-3`, `text-sm text-muted-foreground`, links `hover:text-primary`; sin borde, `pt-6` encima.

## 2. Page header

Dos variantes:
1. **Dashboard** (`app/components/dashboards/modern/overview-tab.tsx`, `home-1440.png`): fuera de card, `flex items-center flex-wrap lg:flex-nowrap gap-4 justify-between pb-4`. Izq: `h2 text-xl` (20px/600) "Good Afternoon, Cameron" + icono, debajo `p text-sm text-muted-foreground`. Der: `flex gap-2`: botón icono outline (refresh), `Select` con `CalendarDays` (periodo), botón primario `gap-1.5 px-4 py-2 rounded-lg` con `Download` + "Export".
2. **Páginas internas** (`L/shared/breadcrumb/breadcrumb-comp.tsx`, `form-1440.png`, `tables-1440.png`): primera celda del bento: `Card className="py-5 px-6 bg-background rounded-xl border"` (en lyra queda cuadrada) → `flex items-center justify-between`: `h4 font-semibold text-xl` + breadcrumb `ol` inline `text-sm` "Home / Título" (actual con `opacity-80`). Seguido de un **divisor de puntos**.
- Divisor (`app/components/shared/divider/index.tsx` vía `StyleDivider`): franja `h-4` con `radial-gradient(circle, currentColor 1px, transparent 0)` `12px 12px`, `opacity .25`, máscara fade en bordes. Se usa entre filas del bento.

## 3. Cards

- Card base lyra (`.cn-card`): `bg-background gap-4 py-4 text-xs/relaxed rounded-none overflow-hidden`; con `data-card-shadow="false"` → `border shadow-none ring-0` (globals.css). En la práctica la mayoría va dentro del bento, así que se ve **sin borde propio, separada por líneas de 1px**.
- `DashboardCard` (`app/components/shared/dashboard-card.tsx`): `rounded-none bg-background shadow-none ring-0 h-full`.
- Header de card con título: `CardHeader className="border-b border-border"` (px-4, pb-4) + `CardTitle className="flex items-center gap-2"` (14px/500) con **icono lucide 16px `text-muted-foreground` antes del título**. Card con `gap-0!` para que el header pegue al contenido.
- Alternativa no-lyra `CardBox`/`TitleIconCard` (`app/components/shared/CardBox.tsx`, `TitleIconCard.tsx`): `border border-border shadow-none`, `borderRadius: 12px`, header `border-b px-6 py-4` con `h5 text-xl font-semibold` + botón descarga. (Lo dejo como referencia si queremos cards redondeadas.)

### KPI / stat card (`dashboards/modern/total-orders.tsx`, `total-profit.tsx`, `advertisement-cost.tsx`)
```
DashboardCard py-6 > CardContent px-6 > flex-col gap-4
  fila: [ p text-sm "Weekly sales" / (h3 text-2xl font-semibold "714k" + Badge "bg-chart-2/10! text-chart-2!" "40%") ]   [ icono 16px en "border border-border p-2.5 rounded-md" ]
  Button outline "gap-1.5 px-4 py-2 h-auto rounded-md": "See Statistics" + ArrowRight 18
```
Tres en fila `lg:col-span-4` (`home-1440.png`, banda media).
- Variante grid de métricas (`total-assets.tsx`): header con icono+título, contenido `grid grid-cols-2 gap-px bg-border`, cada celda `flex flex-col justify-between p-6 bg-background`: icono en caja `border rounded-md p-2`, valor `text-2xl font-semibold`, label `text-sm`.
- Variante "stat tiles" coloreadas (`apps/tickets/ticket-filter.tsx`, `tickets-1440.png`): `p-8 text-center rounded-lg border` con tinte `bg-primary/5 border-primary/20` | `bg-chart-4/12 border-chart-4/20` | `bg-chart-2/12 border-chart-2/20` | `bg-destructive/12 border-destructive/20`; número `text-2xl`, label `text-base`. Grid `lg:col-span-3 md:col-span-6`.
- Banner de aviso (`update-banner.tsx`): `DashboardCard py-3`, punto `h-2 w-2 rounded-full bg-chart-1 animate-ping`, "Update · fecha" `text-sm`, texto con porcentaje `text-emerald-600`, CTA outline a la derecha.

### Chart card (`dashboards/modern/total-sales.tsx`)
- Header `border-b` + `TrendingUp 16` + "Sales Overview".
- `CardContent className="p-5 flex flex-col gap-6"`: fila `justify-between`: label `text-base`, valor `text-2xl font-semibold tracking-[-0.3px]` + delta `text-sm font-medium text-chart-2` "+22%" + `text-sm text-muted-foreground` "vs last month"; a la derecha `Select` de periodo (`h-auto! text-sm font-medium shadow-[0px_1px_2px_rgba(0,0,0,0.05)] px-3`).
- Recharts `LineChart` en `ChartContainer h-[215px]`: `CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4"`, ejes sin línea/tick, `fontSize 12 fill var(--muted-foreground)`, 2 series: sólida `var(--color-primary)` 1.5px y punteada `color-mix(primary 60%)` `strokeDasharray 4 4`, `dot={false}`, `type="linear"`. Tooltip `rounded-lg border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl`, swatch `h-2.5 w-2.5 rounded-[2px]`, valor `font-mono tabular-nums`.
- `[data-slot=chart] { h-72 w-full }` por defecto (globals.css).

Layout dashboard (`app/(dashboard-layout)/page.tsx`): `grid grid-cols-12 p-px gap-px bg-border` → banner (12) · divisor · chart `lg:col-span-7` + assets `lg:col-span-5` · divisor · 3 KPI `lg:col-span-4` · divisor · tabla (12).

## 4. Tablas

Capturas: `tables-1440.png`, `tables-390.png`, `tables-dark-1440.png`, tabla final de `home-1440.png`.

- Base lyra (`.cn-table*`): tabla `text-xs`; head `h-10 px-2 font-medium text-foreground`; celda `p-2`; fila `hover:bg-muted/50 border-b`; última fila sin borde.
- **Tabla "dashboard" (la más limpia, `dashboards/modern/projects-orders.tsx`)**: dentro de card con header icono+título; `CardContent px-0!` (tabla a sangre, sin wrapper con borde); `overflow-x-auto > min-w-[820px]`.
  - Head: `TableRow hover:bg-transparent`; `TableHead pl-4! px-4 py-3 h-auto text-sm font-normal text-muted-foreground` + icono `ArrowDownUp 14` de orden. (Medido: 14px/500, 45px alto.)
  - Filas: `border-border hover:bg-muted/30`; celdas `px-4 py-3`; alto **57px**. Celda doble línea: `text-sm font-medium text-foreground` + `text-sm text-muted-foreground`.
  - Avatar + nombre/rol: img 32px `rounded-full object-cover` + `flex-col leading-5`, `gap-3`.
  - Estado: pill `inline-flex rounded-full px-2 py-0.5 text-xs font-normal` + `bg-[#f54900]/10 text-[#f54900]` (Processing), `#ec003f` (Delayed/Cancelled), `#009689` (Delivered).
  - Acciones: `Ellipsis 16` en `p-2 rounded-lg hover:bg-muted/50`.
- **Data table con toolbar** (`app/components/tables/data-table/DataTable.tsx`):
  - `CardHeader pb-4` → `flex items-center justify-between flex-wrap gap-4`: `CardTitle` a la izq; a la der `Input max-w-96 lg:min-w-96 min-w-full` ("Search your relevant items...") + botón primario icono descarga `p-2 px-4 rounded-md`. Sin filtros extra.
  - Tabla envuelta en `overflow-x-auto border rounded-md` (8px, borde 1px).
  - Head sortable: `TableHead px-0` con `Button variant="ghost" className="flex items-center gap-1 px-4 bg-transparent hover:bg-transparent text-foreground font-semibold"` + `ChevronsUpDown`/`ArrowUp`/`ArrowDown`.
  - Filas `hover:bg-primary/10`; avatar `size-9 rounded-full` o fallback `Badge size-9 rounded-full` con color por iniciales.
  - Badges por valor (`getColorForValue`): `px-2 py-1 rounded-full text-xs font-medium` + `bg-chart-2/10! text-chart-2!` (active/low), `bg-destructive/10! text-destructive!` (inactive/high), `bg-chart-4/10! text-chart-4!` (medium), `bg-chart-1/10 text-chart-1` (manager), `bg-primary/10 text-primary` (lead), etc.
  - Acciones fila: botones icono `bg-muted! rounded-md` (Pencil `text-primary`) y `bg-destructive/10! rounded-md` (Trash2 `text-destructive`).
  - Paginación `flex flex-col sm:flex-row items-center justify-between gap-4 p-4`: [Previous (secondary) | Next (primary)] · "Page 1 of 3" `font-medium text-base` · "Rows per page:" + `Select w-18`.
- Tabla con menú por fila (`basic-table/BasicTable.tsx`): wrapper `border rounded-md`, head `text-sm font-semibold`, avatar `h-10 w-10 rounded-full`, nombre `text-sm font-semibold` + rol `text-xs text-muted-foreground font-medium`, prioridad `rounded-full py-1 px-3 bg-{color}/10 text-{color}`, `DropdownMenu` con trigger `h-9 w-9 rounded-full`.
- Tickets (`apps/tickets/ticket-listing.tsx`, `tickets-1440.png`): toolbar `flex justify-between flex-wrap mb-4 gap-4` con botón primario "Create Ticket" a la izq y búsqueda `relative sm:max-w-60` con icono `absolute left-2` + `pl-9!` a la der; head `text-sm font-semibold py-3`; body `divide-y divide-border`; título `text-base truncate` + subtítulo `text-sm text-muted-foreground`; badge estado `bg-chart-2/12 text-chart-2` (Open), `bg-destructive/12` (Closed), `bg-chart-4/12` (Pending); borrar en caja `bg-destructive/10` roja.

## 5. Formularios

Capturas: `form-1440.png`, `form-390.png`, `user-profile-1440.png`, `login-1440.png`.

- Página form (`app/(dashboard-layout)/pages/form/page.tsx`): bento `flex flex-col p-px gap-px bg-border` → `grid grid-cols-1 xl:grid-cols-2 gap-px`; cada columna `flex flex-col gap-px`; cada sección `bg-background md:p-6 p-4` con `h5` (16px/600) y cuerpo `mt-6 flex flex-col gap-6`.
- Campo: label encima (`Label` lyra `text-xs leading-none`, medido 12px/500) + control con `mt-2`. Una sola columna por sección; los grupos de checkbox/radio en fila `flex gap-6`, switches en `grid grid-cols-2 sm:grid-cols-3 gap-6`.
- Input (`.cn-input`): **h-8 (32px), radio 8px, border-input, bg-transparent, px-2.5, text-xs**; foco → `focus-visible:border-primary ring-0` (override en globals.css: borde negro sin halo). Textarea igual con `py-2`. Select trigger `h-8 rounded-md text-xs` con chevron `size-4 text-muted-foreground`.
- Inputs con icono: wrapper `relative`, icono `absolute left-3 top-1/2 -translate-y-1/2`, input `pl-10!`. Input + botón "Copy" en `flex gap-2` (botón secondary).
- Error: label `text-red-600`, textarea `border-red-600 text-red-600`.
- Checkbox `size-4 rounded-none` (cuadrado), checked `bg-primary`. Radio `size-4 rounded-full`. Switch 32x18 pill `data-checked:bg-primary`.
- Botones (`.cn-button`): radio 8px, `text-xs font-medium`, `active:translate-y-px`; tamaños xs h-6 · sm h-7 · default **h-8 px-2.5** · lg h-9; icon size-8. Variantes: default `bg-primary hover:bg-primary/80`; outline `border-border bg-background hover:bg-muted`; secondary `bg-secondary`; ghost `hover:bg-muted`; **destructive suave** `bg-destructive/10 text-destructive hover:bg-destructive/20` (no rojo sólido). Botón con icono: icono 16-18px + `gap-1.5`.
- Vista de datos de perfil (`app/components/user-profile/index.tsx`): card cabecera `p-6` con avatar 72px `rounded-full`, nombre + meta `text-sm text-gray-500` separada por `h-4 w-px bg-gray-300`, iconos sociales en círculos `h-11 w-11 rounded-full shadow-md border`; debajo `grid xl:grid-cols-2 gap-px` con secciones `space-y-6 bg-background md:p-6 p-4`: `h5` + grid `sm:grid-cols-2 gap-4 lg:gap-7` de pares `p text-xs text-gray-500` (label) / valor `text-base`; botón "Edit" primario `gap-1.5 rounded-md` alineado `flex justify-end`. Edición en `Dialog max-w-2xl` con `grid lg:grid-cols-2 gap-4`, campos `flex flex-col gap-2`.
- Login (`app/auth/auth2/login/page.tsx`): página `min-h-screen flex items-center justify-center bg-accent px-4` (gris claro); `Card className="w-full max-w-md border-none shadow-lg p-6"` (cuadrada en lyra, 448px); logo centrado; botones sociales `h-9 shadow-xs flex-1 rounded-lg text-sm font-medium` (outline); divisor "or sign in with" con `before:/after: h-px flex-1 bg-border`; form `space-y-6` / `space-y-4`, campo `space-y-1.5`, label `text-sm font-normal text-muted-foreground` con `*`; fila recordar + "Forgot Password?" `text-sm font-medium hover:underline`; submit `w-full rounded-lg` (36px, negro); pie "New to ...? Create an account".

## 6. Tokens (`app/globals.css`)

- Fuente: **Geist** (`next/font/google`, `--font-sans: var(--font-geist)`); mono Geist Mono. Body 16px/24px. Nosotros: `@fontsource-variable/geist` o Google Fonts.
- Escala tipográfica usada: 12px (`text-xs`: controles, labels, headings de sidebar, badges, celdas lyra) · 14px (`text-sm`: items nav, títulos de card, celdas de tablas custom, textos secundarios) · 16px (`text-base`: h5 de sección) · 20px (`text-xl`: título de página) · 24px (`text-2xl`: valores KPI). Pesos: 400 cuerpo, 500 títulos de card/nav/botones, 600 headings (`h1-h6 { font-semibold }` en base) y KPIs. `tracking-[-0.3px]` en el valor grande del chart.
- Radio: `--radius: 0.625rem` y escala `sm .6x, md .8x, lg 1x, xl 1.4x...` (ojo: `@theme` también declara `--radius-lg: 7px`). Efectivo medido: **8px** en inputs, botones, badges, items de nav; **0** en cards/dialogs/popovers/checkbox (lyra). Pills `rounded-full` para estados.
- Sombras: `--shadow-sm 0 .125rem .25rem rgba(0,0,0,.075)`, `--shadow-md 0 1px 4px rgba(133,146,173,.2)`, `--shadow-lg 0 1rem 3rem rgba(0,0,0,.175)`. Casi no se usan: cards sin sombra; `shadow-md` en dropdowns/popovers; `shadow-lg` en sheet y login card; `shadow-xl` en sidebar mini expandido por hover.
- Colores (oklch neutral, shadcn default): light `--background 1 0 0`, `--foreground .145`, `--primary .205` (negro), `--secondary/--muted/--accent .97`, `--muted-foreground .556`, `--border/--input .922`, `--destructive .577 .245 27`; charts `chart-1` naranja `.646 .222 41`, `chart-2` teal `.6 .118 185`, `chart-3` azul petróleo, `chart-4` amarillo, `chart-5` ámbar. Dark: background `.145`, card `.205`, primary `.922` (blanco), border `1 0 0 / 10%`, input `/15%`.
- Uso de color: superficies todas `bg-background` (sidebar inner incluido); **únicas superficies tintadas**: login (`bg-accent`), tiles de tickets (`bg-*/12`), hover `bg-primary/5`, submenú activo `bg-primary/5`, filas `hover:bg-muted/30-50`, badges `bg-*/10`. Primary sólido solo en: item activo del sidebar, CTA principal (Export, Create, Sign in, Upgrade), checkbox/switch checked, series del chart.
- Espaciado: rejilla de 4px; ritmo dominante 16px (`p-4` contenido, `px-4` card header, `gap-4`) y 24px (`p-6` secciones/KPIs, `gap-6` campos). Separación entre bloques = 1px de línea + divisor punteado de 16px, no gaps grandes.

## 7. Responsive

- Breakpoint móvil del sidebar: **1025px** (`hooks/use-mobile.ts`, `MOBILE_BREAKPOINT=1025`): por debajo, sidebar = **Sheet desde la izquierda** (288px, overlay `bg-black/10 backdrop-blur-xs`, `shadow-lg`) abierto con el mismo botón `PanelLeft` (`home-mobile-sidebar-390.png`).
- Header móvil: aparece el logo (`block lg:hidden`), se ocultan búsqueda (`sm:block hidden`), notificaciones y separador; quedan toggle, tema, avatar.
- Grids `col-span-12` → `lg:col-span-*`: todo apila en una columna (`home-390.png`): KPIs uno debajo de otro, assets mantiene 2x2, page header en una fila (título + breadcrumb).
- Page header dashboard: `flex-wrap`, acciones bajan debajo del saludo.
- Tablas: `overflow-x-auto` + `min-w-[820px]` → scroll horizontal (se ve cortada a la derecha en 390).
- Data table toolbar: input `min-w-full` en móvil; paginación `flex-col sm:flex-row`.
- Footer: `flex-col` centrado en móvil.
- Bugs del demo a NO copiar: en `tickets-390.png` las filas de la tabla animada salen vacías; en `home-collapsed-1440.png` el chart quedó sin líneas tras el resize (re-animación).

## 8. Capturas generadas (`progress/redesign/template/`)

`home-1440.png`, `home-390.png`, `home-collapsed-1440.png`, `home-dark-1440.png`, `home-mobile-sidebar-390.png` (viewport, sheet abierto), `tables-1440.png`, `tables-390.png`, `tables-dark-1440.png`, `form-1440.png`, `form-390.png`, `user-profile-1440.png`, `user-profile-390.png`, `tickets-1440.png`, `tickets-390.png`, `notes-1440.png`, `notes-390.png`, `login-1440.png`, `login-390.png`.

Notas (`notes-1440.png`, `apps/notes/index.tsx`): card `py-0! overflow-hidden` con split `flex min-h-[600px] h-[calc(100vh-300px)]`: lista izquierda ~320px (búsqueda `pl-8!`, "All Notes" `text-base`, items `p-4 rounded-xl` tintados por color) | panel derecho con barra `flex justify-between border-b py-4 px-6` ("Edit Note" + botón primario "Add Note"); en móvil la lista va a un Sheet. Útil como patrón maestro-detalle.

---

## Patrones reutilizables

1. **Bento hairline**: contenedor `grid grid-cols-12 p-px gap-px bg-border` + hijos `bg-background`; líneas de 1px sin bordes por card (`app/(dashboard-layout)/page.tsx`).
2. **Divisor punteado** de 16px (`radial-gradient` 12px, opacity .25, máscara fade) entre filas del bento (`components/shared/divider`).
3. **Shell inset**: sidebar 256/52px con panel `bg-background border`, contenido en `SidebarInset m-2 outline outline-border`, header sticky 57px `border-b` alineado con el header del sidebar.
4. **Sidebar mini con hover-expand** a 256px como overlay `shadow-xl` (+ headings sustituidos por `...`).
5. **Item activo de nav = pastilla `bg-primary text-background` rounded-md 36px**; hover `bg-primary/5`; subitems con `border-l` guía y activo tintado.
6. **Tarjeta de plan/uso en el pie del sidebar** (progress `h-1.5` + CTA `bg-foreground`) — adaptable a "meta mensual" del vendedor.
7. **Card header con borde inferior** `border-b` + icono lucide 16px `text-muted-foreground` + título 14px/500.
8. **KPI card**: label `text-sm` · valor `text-2xl font-semibold` + badge delta `bg-chart-2/10 text-chart-2` · icono en caja `border rounded-md p-2.5` a la derecha · CTA outline "Ver detalle →".
9. **Page header**: `h-xl font-semibold` + subtítulo muted a la izq; acciones a la der (icon-button outline, Select de periodo con `CalendarDays`, CTA primario con icono). Variante interna: título + breadcrumb "Inicio / X" en la primera celda del bento.
10. **Status pills** `rounded-full px-2 py-0.5 text-xs` con color de token al 10-12% de fondo y texto al 100% (mapa estado→token centralizado tipo `getColorForValue`).
11. **Tabla a sangre en card**: head `text-sm font-normal text-muted-foreground` con icono de orden 14px, celdas `px-4 py-3`, filas 57px `hover:bg-muted/30`, celdas de doble línea (principal + muted), avatar 32px redondo, menú `Ellipsis` por fila.
12. **Toolbar de tabla**: título a la izq; búsqueda con icono absoluto (`pl-9`) + CTA a la der; paginación "Anterior/Siguiente · Página X de Y · Filas por página [Select]".
13. **Chart minimal**: grid horizontal punteado `var(--border)` 4 4, ejes sin líneas 12px muted, serie principal sólida primary 1.5px + comparativa punteada al 60%, sin dots, tooltip compacto `tabular-nums`; cabecera con valor grande + delta coloreado + "vs mes anterior" + Select de rango.
14. **Formularios en secciones** `bg-background md:p-6 p-4` dentro del bento 2 columnas (`xl:grid-cols-2`), `h5` 16px por sección, label 12px encima + control h-8 radio 8px, `gap-6` entre campos, foco = borde primary sin ring.
15. **Botón destructivo suave** (`bg-destructive/10 text-destructive`) y botones de acción de fila en caja tintada; perfil en Sheet derecho desde el avatar; login centrado `max-w-md shadow-lg` sobre `bg-accent`.
