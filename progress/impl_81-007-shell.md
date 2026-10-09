# Impl 81-007: Shell (sidebar, header, contenido, footer, modo claro/oscuro)

Plan: `plans/007-redesign-shell.md` · Rama `81-visual-redesign` · Sin commit.

## Estado

**DONE (sin commit; pendiente review).** Steps R1-R2 y 1-8 aplicados. Los gates
pasan y los `rg` de Done dan 0. No se disparó ninguna condición de STOP. Los
cambios de la fase 006 y del Líder siguen en el árbol de trabajo sin tocar.

## Archivos

Modificados:
- `frontend/src/components/ui/badge-variants.ts`: R1, la base pasa de `rounded-full` a `rounded-md`.
- `frontend/src/components/ui/sidebar.tsx`: `SIDEBAR_WIDTH_ICON = "52px"`. Se quitó
  `[--radius:var(--radius-xl)]` de `SidebarHeader` y de `SidebarContent` (ver Desviaciones).
- `frontend/src/hooks/use-mobile.ts`: `MOBILE_BREAKPOINT = 1025`.
- `frontend/src/shared/store/app.store.ts`: se quitaron `sidebarOpen` y `toggleSidebar`.
  `clearAuth` se queda porque lo usa `useLogout`.
- `frontend/src/components/app-sidebar.tsx`: reescrito.
- `frontend/src/components/nav-main.tsx`: reescrito.
- `frontend/src/components/nav-user.tsx`: reescrito; exporta `NavUser` y `UserSheet`.
- `frontend/src/shared/components/layout/Header.tsx`: reescrito.
- `frontend/src/shared/components/layout/AppLayout.tsx`: reescrito.
- `frontend/src/index.css`: se borró el bloque móvil `main { padding: var(--sp-3) !important }`
  y se añadió al final el bloque del mini sidebar con hover.
- `frontend/src/shared/components/command/CommandPalette.tsx`: R2, ancho de 448px.

Creados:
- `frontend/src/shared/components/layout/ThemeToggle.tsx`
- `frontend/src/shared/components/layout/Footer.tsx`

Borrados (antes, `rg` daba 0 imports de cada uno):
- `frontend/src/components/nav-projects.tsx`
- `frontend/src/components/team-switcher.tsx`

Otros: `plans/README.md` (solo la fila 007) y este archivo.

No toqué `App.tsx`. El `TooltipProvider` global se queda ahí y quité el
duplicado que había en `AppLayout`.

## Qué tomé de cada archivo de la plantilla

- **`app/(DashboardLayout)/layout.tsx`**: la estructura `SidebarProvider` > `AppSidebar` +
  `SidebarInset` con `m-2 outline outline-border` y radio 0. Dentro van el header, un contenedor
  con `p-4` y `max-w-[1367px]`, el contenido con `min-h-[calc(100vh-140px)]` y el footer con `pt-6`.
  Adaptación: `overflow-clip` y `min-w-0` en lugar de `overflow-hidden`, y el scroll lo lleva
  la ventana (ver Desviaciones).
- **`layout/vertical/sidebar/Sidebar.tsx` (AppSidebar)**: `variant="inset"`, `collapsible="icon"`,
  la clase `sidebar-box`, el borde y el fondo `bg-background` en `sidebar-inner` (con el selector
  `**:data-[slot=sidebar-inner]`), la sombra `xl` al hacer hover en el estado colapsado, y el header
  de 57px con `border-b`. Logo: el completo cuando está expandido (oscuro en modo claro y claro en
  modo oscuro, `h-7`) y el icono `tracker.png` cuando está colapsado. Footer con `border-t` y la
  clase `hide-menu`. Se mantiene el filtro por rol de `NAV_SECTIONS`. Encima de nuestro
  `ui/sidebar.tsx` de Radix no hizo falta tocar la lógica: solo props y clases.
- **`NavCollapse` / `NavItems`**: el grupo con `px-3 py-4` (`px-2` colapsado), secciones con
  `gap-4`, encabezado `text-xs font-semibold uppercase` que se convierte en "..." cuando está
  colapsado, y enlace `rounded-md px-3 py-2` con estado activo `bg-primary text-primary-foreground`
  y hover `bg-primary/5`. Iconos de 16px y etiqueta en `span.hide-menu`. Solo hay ítems planos:
  no tenemos submenús, así que no porté el Collapsible.
- **`nav-user` / `nav-secondary`**: no copié la tarjeta de plan/upgrade (es contenido de demo).
  En el footer del sidebar va una fila con avatar, nombre, rol y un botón icono de cerrar sesión.
- **`header/Header.tsx`**: header sticky de 57px con `border-b`. A la izquierda, el logo (solo por
  debajo de 1025px), el `SidebarTrigger` redondo, un separador vertical y el buscador de `w-80`
  con el atajo en `kbd`. A la derecha, el toggle de tema y el perfil. Sin campana (no hay
  notificaciones). El buscador es un `button` que lanza `open-command-palette`.
- **`LightDark`**: botón ghost redondo `size-10` con sol o luna, usando `next-themes`.
- **`Profile`**: un `Sheet` a la derecha de 320px sin el botón de cierre por defecto. Lleva un
  cierre propio arriba a la derecha, el avatar grande, el nombre y el rol, y un separador
  discontinuo con el botón secundario "Cerrar sesión". Los enlaces de demo de la plantilla
  (perfil, cuenta, etc.) no existen en la app, así que no los puse.
- **`FullLogo`**: lo cambié por nuestras imágenes `/brand/*` con la variante `dark:`.
- **`footer`**: la fila con © a la izquierda y el enlace de atribución a la derecha, en columna
  en móvil y en fila desde `md`.
- **`globals.css` (bloque `[data-sidebar-type="true"]`)**: lo porté al bloque de hover-expand de abajo.

Logout: `useLogout` de siempre (`mutateAsync` y luego `navigate({to:"/login"})`, con
try/catch para navegar aunque falle la petición). No cambié la lógica de auth.

## Mini sidebar con hover-expand

- Ancho colapsado de 52px: el `inner` mide 54px con borde y el contenedor 70px con el padding
  de `inset`.
- En `index.css`, sin capa y al final del archivo, el selector
  `[data-slot="sidebar"][data-collapsible="icon"]` anida dos reglas:
  - `.sidebar-box .hide-menu` lleva `display: none`.
  - `.sidebar-box:hover` lleva `width: var(--sidebar-width)` con una transición de 0.3s, y vuelve
    a mostrar `.hide-menu` (`inline-block` y `nowrap`; `flex` si es un `div`).
- Como `.sidebar-box` está en el elemento fijo (`sidebar-container`) y no en el hueco
  (`sidebar-gap`), el hover ensancha solo el panel. El panel se superpone al contenido y el inset
  no se mueve: medido, sigue en x=76.
- `z-20` en el sidebar para que el panel expandido quede encima del header sticky (`z-10`).
- En `nav-main`, los encabezados colapsados usan las variantes `group-hover:` del grupo del
  sidebar para cambiar de "..." al texto.
- Los enlaces llevan `aria-label` para que se lean aunque la etiqueta esté oculta.

## Desviaciones del plan o de la plantilla

1. **Sin tooltips** en los ítems colapsados. La plantilla tampoco los tiene: se expande con el hover.
2. **Sin expansión por teclado** (`:focus-visible` / `:has()`). Lo probé y el panel se quedaba
   expandido tapando el trigger del header. Lo quité y dejé el `aria-label` en los enlaces.
3. **`overflow-clip` y `min-w-0` en lugar de `overflow-hidden`** en el inset. `overflow-hidden`
   crea un contenedor de scroll y el header sticky dejaba de pegarse. Medido: el header queda en
   y=0 con scrollY=600.
4. **Scroll de ventana** en lugar del div interno con scroll de la plantilla. Mismo efecto visual.
5. **Sin badge de versión, sin `SidebarRail`** y sin menú desplegable de usuario en el footer:
   va una fila con un botón icono de logout.
6. **Quité `[--radius:var(--radius-xl)]` de `ui/sidebar.tsx`** (header y content). Con el override,
   `rounded-md` daba 11.2px dentro del sidebar en lugar de los 8px de la plantilla. Ahora da 8px.
7. **R2 compuesto en línea**: `CommandDialog` (`ui/command.tsx`, fuera de scope) no reenvía
   `className` a `DialogContent`. Por eso la paleta compone `Dialog` + `DialogContent sm:max-w-md`
   + `Command` con un título y una descripción solo para lectores de pantalla. Los listeners y los
   ítems no cambian.
8. **Breakpoint de 1025px**: con `useIsMobile` hay un `Sheet` por debajo de 1025px. Según
   `rg -n useIsMobile`, solo lo usa `ui/sidebar.tsx`, así que no afecta a los módulos. El logo y el
   separador del header usan `min-[1025px]:` y `max-[1024px]:` para coincidir con ese corte.
9. **El `Sheet` móvil mide 293px a 390 y 384px a 1024** (`w-3/4` y `sm:max-w-sm` de nuestro `ui/sheet`,
   igual que la plantilla), no los 288px que dice `DESIGN.md`.
10. **`Moon` se importa directamente de `reicon-react`** porque `shared/components/Icon.tsx` no la
    exporta. No añadí ninguna dependencia.
11. **Sin guard de `mounted` en `ThemeToggle`**: la app es una SPA sin SSR y `next-themes` lee
    localStorage de forma síncrona. Lo dejo explicado en un comentario.
12. En el estado colapsado, el header del sidebar mantiene el logo icono durante el hover y no
    cambia al logo completo. El enlace del footer va subrayado para que se vea que es un enlace.

## Gates (desde `frontend/`, tras las últimas ediciones)

`pnpm run typecheck && pnpm run lint && pnpm run build` sale con **exit 0**:
- `tsc --noEmit`: sin errores.
- `eslint .`: sin errores ni warnings.
- `vite build`: `✓ built in 1.02s`. Solo queda el aviso `INEFFECTIVE_DYNAMIC_IMPORT` de
  `pragmatic-drag-and-drop`, que ya estaba antes y viene de módulos.

## `rg` de Done (todos con 0 coincidencias, exit 1)

- `rg -n "ROUTE_TITLES|clearAuth" frontend/src/shared/components/layout`: 0.
- `rg -n "nav-projects|team-switcher|sidebarOpen" frontend/src`: 0.
- `rg -n "bg-tracker|text-tracker|#[0-9a-fA-F]{3,6}" frontend/src/components/app-sidebar.tsx frontend/src/components/nav-*.tsx frontend/src/shared/components/layout`: 0.
- `TooltipProvider` solo aparece en `App.tsx`, y la regla de padding de `main` ya no existe.

## Verificación con Playwright

Hecha contra Vite en `localhost:3001`. Capturas en
`/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/impl007/`,
fuera del repo.

- **1440, expandido**:
  - El `inner` del sidebar mide 240px y el contenedor 256px; el header del sidebar mide 57px.
  - El header mide 57px y empieza en x=256.
  - Inset: outline de 1px sólido, radio 0, `overflow: clip`.
  - Ítem activo: `bg` oklch(0.205 0 0), texto oklch(0.985), 36px de alto, radio 8px.
  - El footer tiene el texto y el `href` correctos.
- **Paleta**: 448px; se abre con Ctrl+K y con el buscador del header.
- **Sticky**: el header queda en y=0 tras hacer scroll.
- **Perfil**: el `Sheet` mide 320px.
- **Oscuro**: se aplica la clase `dark` y se mantiene tras recargar (`localStorage.theme=dark`).
- **Colapsado**: el `inner` mide 54px, el contenedor 70px y los encabezados muestran "...". Con
  hover, el contenedor pasa a 256px, se ven los textos y el inset no se mueve.
- **1024**: no hay sidebar de escritorio; se ven el logo y el buscador en el header. El `Sheet`
  mide 384px y no hay overflow horizontal.
- **390**: el buscador está oculto, el `Sheet` mide 293px y no hay overflow horizontal.
- Ningún error de página.
- `shots.cjs` a 1440 en claro (12 rutas y login, en `routes-1440-light/`): exit 0. El shell está
  bien en todas las rutas.

Archivos: `dashboard-1440-light.png`, `dashboard-1440-dark.png`, `dashboard-collapsed-1440.png`,
`dashboard-collapsed-hover-1440.png`, `palette-1440.png`, `profile-sheet-1440.png`,
`dashboard-1024.png`, `mobile-sidebar-1024.png`, `dashboard-390.png`, `mobile-sidebar-390.png`,
`check-output.json` y `routes-1440-light/`.

## Qué debe mirar el Líder en pantalla

1. **1440, claro**: sidebar de 256px con borde y el logo oscuro; ítem activo como píldora negra;
   header de 57px con el buscador "Buscar… Ctrl K", el toggle y el avatar; contenido enmarcado
   con outline y un margen de 8px; footer con © y el enlace "Shadcn Dashboard".
2. **1440, oscuro** (con el toggle; recargar para comprobar que se mantiene): fondo oscuro en el
   shell y logo claro. Los módulos todavía muestran tarjetas claras: eso se rehace en las fases
   008-011 y no es un fallo de 007.
3. **Colapsado** (trigger del header): un raíl de 52px con iconos y "..."; al pasar el ratón se
   expande a 256px por encima del contenido con sombra, y el contenido no se mueve.
4. **390** (y 1024): sin sidebar fijo; el trigger abre el `Sheet` de navegación. Se ven el logo
   en el header y el buscador oculto a 390. No hay scroll horizontal.
5. **Perfil**: el avatar del header abre el `Sheet` derecho de 320px. "Cerrar sesión" lleva a `/login`.
6. **Paleta**: con Ctrl+K o clic en el buscador se abre un diálogo de 448px; la navegación sigue
   funcionando.
7. **Badges**: con la base `rounded-md` (R1), comprobar que ninguna variante de los módulos quede
   rara. La revisión visual a fondo es de 008-011.

## Fixes post-review

Hallazgos de `progress/review_81-007-shell.md` (veredicto PASSED). Solo toqué
`frontend/src/index.css` y `frontend/src/components/nav-main.tsx`; `app-sidebar.tsx` y
`ui/sidebar.tsx` no hizo falta tocarlos.

- **M1, foco de teclado en el raíl colapsado.**
  - En `index.css`, el selector de expansión pasa de `.sidebar-box:hover` a
    `.sidebar-box:is(:hover, :has(:focus-visible))`, como propuso el reviewer.
  - En `nav-main.tsx`, los encabezados llevan además `group-has-[:focus-visible]:` junto a sus
    `group-hover:`, así que con el teclado pasan de "..." al texto.
  - Ajuste añadido: con el teclado, el footer del sidebar (avatar y logout) no se muestra; sigue
    saliendo solo con hover. Si se mostraba también con el foco, al hacer Tab desde el último enlace
    Chrome mandaba el foco a `<body>` y no al botón de logout. Ese botón solo existe mientras el foco
    está dentro del raíl, y al soltar el foco del enlace el panel se plegaba. Ahora el Tab salta
    directo al trigger del header. Con el teclado, el logout está en el Sheet de perfil del header.
    Por eso la regla de mostrar se limita a `span.hide-menu`, y `div.hide-menu` se muestra solo con
    `:hover`. Lo dejo explicado en un comentario del CSS.
- **M2, el Sheet móvil se cierra al navegar.** El `Link` llama a `setOpenMobile(false)` en `onClick`,
  y solo cuando `isMobile` es true. Viene de `useSidebar`, que el componente ya usaba.
- **M3, semántica.**
  - El contenedor ahora es `<nav aria-label="Navegación principal">`.
  - Cada sección usa `SidebarMenu`/`SidebarMenuItem` (`ul`/`li`) con `gap-0` para mantener el paso
    de 40px.
  - `aria-current="page"` ya lo pone TanStack Router en el enlace activo; no lo dupliqué.
- No apliqué N1-N8: el coordinador pidió solo M1-M3, y N2/N8 tocan `Header.tsx`.

Gates (`pnpm run typecheck && pnpm run lint && pnpm run build`) tras los fixes: **exit 0**
(`✓ built in 2.46s`). Solo queda el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT`.

Playwright (`scratchpad/impl007-tools/check-fix.cjs`; salida en
`scratchpad/impl007/check-fix-output.json`):
- **M3**: hay un `nav[aria-label="Navegación principal"]` con 4 `ul` y 12 `li > a`. El paso entre
  ítems sigue en 40px y `aria-current=page` está solo en Dashboard.
- **M1, raíl colapsado de 70px**:
  - El primer Tab enfoca Dashboard con `:focus-visible`. El panel pasa a 256px, se ven los 12 labels
    y los encabezados muestran PRINCIPAL, GESTIÓN, ANÁLISIS y CONFIGURACIÓN
    (`fix-collapsed-focus-1440.png`).
  - El Tab recorre los 12 enlaces y después va al trigger del header. El panel vuelve a 70px con
    "..." (`fix-collapsed-after-tab-out-1440.png`).
  - Un clic con ratón en "Mi día" navega, y al apartar el ratón el panel vuelve a 70px: no se queda
    abierto (`fix-collapsed-after-click-1440.png`).
  - Con el foco en el buscador del header, los encabezados siguen en "...".
  - Con hover sigue todo igual: 256px, 12 labels y el footer con `display: flex`.
- **M2**: a 390 y a 1024, un clic en "Mi día" dentro del Sheet lleva a `/mi-dia` y el Sheet se cierra
  (0 nodos `[data-mobile=true]`). Overflow horizontal 0 (`fix-390-after-nav.png`,
  `fix-1024-after-nav.png`).
- Sin errores de página.
