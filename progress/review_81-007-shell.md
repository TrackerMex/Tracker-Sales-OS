# Review 81-007: Shell (sidebar, header, contenido, footer, claro/oscuro)

Plan: `plans/007-redesign-shell.md` · Impl: `progress/impl_81-007-shell.md` · Base `55b22e1`, sin commit.
Revisión de solo lectura. Evidencia en vivo (Playwright contra `localhost:3001`, admin) en
`/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/review007/`
(`check.cjs` → `out.json`, `check2.cjs`, capturas `*.png`).

## Veredicto: **PASSED**

Todos los Done criteria y los criterios de CHECKPOINTS que aplican al shell se cumplen y
están verificados. No hay bloqueantes. Hay 3 hallazgos menores con arreglo de 1-3 líneas
cada uno (M1-M3) y 8 notas.

## Separación 006 / 007 y alcance

- Archivos con mtime posterior a `progress/review_81-006-foundation.md` (17:39:49): justo la
  lista "In scope" del plan 007 (badge-variants, use-mobile, app.store, app-sidebar, nav-user,
  nav-main, ThemeToggle, Footer, Header, AppLayout, CommandPalette, index.css, ui/sidebar). Los
  otros `components/ui/*` y `main.tsx` son anteriores, así que son de 006.
  `theme-provider.tsx` (borrado) y `backend/src/main.ts` (`HOST`) son de 006 / Step 0, según `impl_81-006` §19 y §34.
- `frontend/src/modules/**`, lámina y backend: sin cambios de 007. `App.tsx`: sin tocar.
- `components/ui`: solo `sidebar.tsx` (`SIDEBAR_WIDTH_ICON`, override `--radius` quitado) y
  `badge-variants.ts` (la base pasa de `rounded-full` a `rounded-md`; el resto queda como en 006).
- 007 no deshizo nada de 006. `index.css` mantiene Geist, `--radius: 0.625rem`, las sombras
  `@theme`, los tokens `:root`/`.dark` sin override navy del sidebar, el legacy en
  `@layer components` y el bloque `prefers-reduced-motion`. Solo se quitó `main{padding…!important}`
  y se añadió el bloque del mini sidebar (`index.css:785-809`).

## Criterios

| # | Criterio | Resultado | Evidencia |
|---|----------|-----------|-----------|
| D1 | `rg -n "ROUTE_TITLES\|clearAuth" frontend/src/shared/components/layout` → 0 | PASSED | exit 1, sin salida |
| D2 | `rg -n "nav-projects\|team-switcher\|sidebarOpen" frontend/src` → 0 | PASSED | exit 1. `toggleSidebar` solo queda en `ui/sidebar.tsx` (el del contexto) |
| D3 | `rg -n "bg-tracker\|text-tracker\|#[0-9a-fA-F]{3,6}" app-sidebar nav-* layout` → 0 | PASSED | exit 1. Con un rg ampliado (`tracker-\|slate-\|text-[Npx]\|rgba\|#hex`, más CommandPalette) solo sale el falso positivo `-translate-y-1/2` |
| D4 | Toggle claro/oscuro funciona y persiste al recargar | PASSED | Tras el toggle: `html.dark`, `localStorage.theme=dark`, body `oklch(0.145 0 0)`. Tras recargar sigue `dark` y la etiqueta es "Cambiar a modo claro". Al volver: `light` |
| D5 | Sidebar 256 expandido / 52 colapsado con hover-expand, Sheet < 1025px | PASSED | Expandido: container 256, inner 240. Colapsado: inner 54 (52 + 2px de borde), container 70 e inset en x=76. Con hover: container 256 con `shadow-xl`, 12 labels visibles, headings con texto y el inset sigue en x=76. A 1024 y a 390 no hay sidebar de escritorio; el trigger abre el Sheet (384 y 293px) |
| D6 | Footer con enlace de atribución | PASSED | "© 2026 Tracker México" y "Diseño basado en Shadcn Dashboard" → `https://github.com/shadcndashboard/next-shadcn-dashboard`, `target=_blank`, `rel=noreferrer` (implica noopener). `Footer.tsx:7-11` |
| D7 | typecheck, lint y build exit 0 | PASSED | `pnpm run typecheck && pnpm run lint && pnpm run build` → EXIT=0 (lo ejecuté yo). Solo aparece el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT` de pragmatic-dnd |
| C | Header sticky de 57px | PASSED | El header mide 57px. Con scrollY=600 queda en y=0 |
| C | Búsqueda abre la paleta (Ctrl K y botón) | PASSED | Ctrl+K abre un dialog de 448px (R2). El clic en `button[aria-keyshortcuts]` también la abre. Escribir "Registrar" + Enter lleva a `/actividades/nueva` |
| C | Quick actions fuera del header y en "Acciones" de la paleta | PASSED | El texto del header no contiene Tarea, Prospecto ni Registrar actividad. Botones del header: trigger, Buscar, toggle y perfil. Grupo de la paleta: "Acciones: Registrar actividad, Nueva tarea, Nuevo prospecto" |
| C | Logout vía `useLogout` | PASSED | `nav-user.tsx:3,25,40-47`. En vivo, el Sheet de perfil → "Cerrar sesión" hace `POST …/api/auth/logout`, lleva a `/login` y deja `accessToken`/`refreshToken` en null y `currentUser` en null |
| C | Contenido enmarcado `m-2 outline` | PASSED | Inset: outline `solid 1px oklch(0.922)`, radio 0, `overflow: clip`, margin `8 8 8 0` (ml-0 viene del `md:peer-data-[variant=inset]` de shadcn, igual que la plantilla) |
| C | Ítem activo en pastilla `bg-primary` | PASSED | Claro: `oklch(0.205)` / `oklch(0.985)`, 36px, radio 8px. Oscuro: `oklch(0.922)` / `oklch(0.205)`. Colapsado: pastilla de 36×32 |
| C | `MOBILE_BREAKPOINT = 1025` no afecta a módulos | PASSED | `rg -n "useIsMobile\|use-mobile" frontend/src` → solo `hooks/use-mobile.ts:5` y `components/ui/sidebar.tsx:5,46` |
| C | Logos | PASSED | En claro se ve `trackermexico-dark.png`; en oscuro, `trackermexico.png`; colapsado, `tracker.png`; y en el header < 1025px, `tracker.png`. Todos con `alt="Tracker México GPS"`. Los `width`/`height` coinciden con el PNG real (1681×280 y 162×94) |
| C | Un solo `TooltipProvider` | PASSED | Solo `App.tsx:51` |
| C | Sin overflow horizontal a 390 | PASSED | scrollWidth − innerWidth = 0 en `/dashboard`, `/clientes`, `/pipeline`, `/agenda` y `/reportes`. A 1024 también 0 |
| C | Foco visible | PASSED (ver N1) | Los enlaces del sidebar (expandido y colapsado), el perfil y el enlace del footer tienen `:focus-visible` con outline `auto 1px ring/50`. Buscar marca el foco con `border-primary`. El toggle usa el ring del Button. Capturas `1440-tab-expanded.png` y `1440-tab-collapsed.png` |
| C | Sin errores de página | PASSED | `pageerror`/`console.error`: 0 |
| R1 | Badge base `rounded-md` | PASSED | `badge-variants.ts:4` |
| R2 | Paleta 448px | PASSED | Medido: 448 (`CommandPalette.tsx:62`) |

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

- **M1. En el raíl colapsado, un usuario de teclado no ve el nombre del ítem enfocado.**
  `frontend/src/index.css:797` (`.sidebar-box:hover`) y `frontend/src/components/nav-main.tsx:50-65`.
  El plan, en el Step 2, pide "tooltips en modo icono", y el código anterior los tenía
  (`SidebarMenuButton tooltip={item.label}`, que también se abre con el foco). Hoy el teclado
  recorre los 12 enlaces y cada uno tiene foco visible, `aria-label` y `aria-current="page"` (lo pone TanStack
  Router y lo comprobé en vivo). La página activa se reconoce por la pastilla, y Ctrl+B o el trigger del header
  expanden el panel. Lo que falta es saber qué ítem tiene el foco, porque solo se ve el icono.
  **Arreglo mínimo** (probado inyectando el CSS en tiempo de ejecución, sin tocar el repo): cambiar
  el selector `index.css:797` por `.sidebar-box:is(:hover, :has(:focus-visible))`. Resultado: con el
  foco por teclado el panel pasa a 256 y muestra los labels. Al salir con Tab vuelve a 70. Un clic con ratón
  no lo deja expandido, porque `:focus-visible` no se activa con clic. El problema que el impl cuenta en la
  desviación 2 (el panel se quedaba abierto tapando el trigger) aparece con `:focus-within`, no con
  esto. Opcional: añadir `group-has-[:focus-visible]:` junto a los `group-hover:` de
  `nav-main.tsx:34,39,40` para que los headings también pasen de "..." al texto.
- **M2. El Sheet móvil no se cierra al navegar.** `frontend/src/components/nav-main.tsx:50`.
  A 390 y a 1024, después de pulsar "Clientes" la URL cambia y el Sheet sigue con
  `data-state=open` (captura `390-after-nav.png`). Ya pasaba antes y en la plantilla, pero ahora
  el corte de 1025px lo lleva también a tablets y portátiles pequeños. Arreglo: en el `Link`,
  `onClick={() => isMobile && setOpenMobile(false)}` (`useSidebar` ya se usa en `nav-main.tsx:23`).
- **M3. La navegación perdió la semántica de lista y de landmark.** `frontend/src/components/nav-main.tsx:27-30`.
  Antes era `SidebarMenu` (ul/li). Ahora son `div` con enlaces y no hay `<nav>`. Arreglo: cambiar el
  `div` de `:28` por `<nav aria-label="Navegación principal">`.

### Notas

- **N1. El foco de los enlaces tiene poco contraste.** El foco viene del base de 006
  (`index.css:143`, `outline-ring/50`): outline gris al 50%, con un contraste de ~1.5:1 sobre blanco. Se ve,
  pero es tenue. El toggle (ring del Button, ~0.9px al 46%) todavía más. Ya está anotado en review 006 N8; queda para 012
  o para que lo decida el Líder.
- **N2. Hay textos sr-only en inglés en `ui/sidebar.tsx`.** Son "Toggle Sidebar" (`:252`) y el título y la descripción del
  Sheet móvil, "Sidebar" y "Displays the mobile sidebar." (`:175-178`). Ya estaban antes. Se arregla barato con
  `aria-label="Mostrar u ocultar menú"` en `Header.tsx:24`.
- **N3. DESIGN.md "Shell" no coincide con lo implementado.** Pide el Sheet móvil de 288px (hoy 293 a 390 y
  384 a 1024: el `w-3/4 sm:max-w-sm` de `ui/sheet` gana a `--sidebar-width: 18rem`, igual que en la
  plantilla) y un `Badge` de versión en la cabecera del sidebar (no está; el plan no lo pide). Conviene
  alinear DESIGN.md o aceptarlo.
- **N4.** `ThemeToggle.tsx:2` importa `Moon` directamente de `reicon-react` en lugar de pasar por
  `shared/components/Icon.tsx`, que está fuera del scope. En 012 se puede añadir `MoonIcon` a Icon.tsx.
- **N5.** El inset lleva `shadow-sm` (`rgba(0,0,0,.075) 0 2px 4px`) desde el
  `md:peer-data-[variant=inset]:shadow-sm` de `ui/sidebar.tsx`. El `SidebarInset` de la plantilla
  es idéntico, así que es fiel.
- **N6.** `:root { --sidebar-width: 276px }` (`index.css`, bloque legacy) sigue definido. Dentro del
  provider manda el `16rem` en línea, así que no tiene efecto visible. Queda para la limpieza de 012.
- **N7.** En oscuro, el contenido de los módulos sigue claro (título navy, cards blancas). Es lo
  esperado hasta 008-011.
- **N8. A exactamente 1024px el separador del header se sigue viendo.** `frontend/src/shared/components/layout/Header.tsx:27`
  Medí `display: block`. En Tailwind v4, `max-[1024px]:hidden` equivale a `width < 1024px`, y
  `useIsMobile` usa `max-width: 1024px`. Por eso, solo a 1024 se ven a la vez el Sheet móvil y el separador. Es
  inocuo. Para que coincida, usar `max-[1025px]:hidden`, el mismo umbral que `min-[1025px]:hidden` del logo.

## Desviaciones del impl

| # | Desviación | Juicio |
|---|-----------|--------|
| 1 | Sin tooltips en el modo colapsado | Aceptable para ratón: el hover-expand es mejor que un tooltip. Para teclado no, ver M1 |
| 2 | Sin expansión por teclado | No aceptable tal cual: el motivo que da no se reproduce con `:has(:focus-visible)`. Ver M1 (arreglo de 1 selector) |
| 3 | (b) `overflow-clip` + `min-w-0` en el inset | Aceptable, y mejor que el plan. `overflow-hidden` convierte el inset en contenedor de scroll y rompe el sticky. Medido: header en y=0 con scroll 600 y 0px de overflow a 390. El contenido ancho de los módulos se recorta en vez de dar scroll a la página; antes ya pasaba igual (`overflow-x-hidden` en el div de contenido) |
| 4 | Scroll de ventana | Aceptable. En la plantilla el div interno tampoco tiene `overflow-y-auto`, y en el layout viejo ese div nunca llegaba a hacer scroll porque el inset crece con el contenido. Revisé los `sticky` de los módulos: solo `ClientDetailPage:108`, que va dentro de un Sheet propio, así que no le afecta |
| 5 | Sin badge de versión, `SidebarRail` ni dropdown de usuario | Aceptable (el plan no los pide). DESIGN.md menciona el badge: ver N3 |
| 6 | (a) Quitar `[--radius:var(--radius-xl)]` de `ui/sidebar.tsx` | Aceptable. El `ui/sidebar.tsx` de la plantilla no tiene ese override. Los únicos consumidores de `SidebarHeader`/`SidebarContent` son `app-sidebar` y `nav-main`, y el ítem mide 8px como pide DESIGN "Radio" |
| 7 | (d) R2 compuesto en línea con Dialog+Command | Aceptable. El markup es idéntico al de `CommandDialog` (`ui/command.tsx:114-136`) más el ancho. `command.tsx` está fuera de scope. Título y descripción sr-only presentes |
| 8 | Breakpoint de 1025px | Aceptable. Coincide con la plantilla (`hooks/use-mobile.ts` de la plantilla = 1025), y solo lo usa `ui/sidebar.tsx` |
| 9 | Sheet de 293/384px | Aceptable (es lo que hace la plantilla). Ver N3 |
| 10 | `Moon` directo de reicon-react | Aceptable dentro del scope. Ver N4 |
| 11 | Sin guard de `mounted` en ThemeToggle | Aceptable: es una SPA. Tras recargar en oscuro, la etiqueta y el icono salen bien desde el primer render |
| 12 | Logo icono durante el hover y enlace del footer subrayado | Aceptable. El subrayado ayuda a cumplir WCAG 1.4.1 |

## Qué debe mirar el Líder a ojo

1. 1440 claro y oscuro frente a `progress/redesign/template/home-1440.png` y `home-dark-1440.png`
   (mis capturas: `review007/1440-light.png` y `1440-dark.png`).
2. Colapsado con hover (`1440-collapsed.png`, `1440-collapsed-hover.png`): que la sombra `xl` y
   el solape sobre el header se vean bien.
3. Foco con Tab por el sidebar y por el toggle en claro y en oscuro (N1). Si se aplica M1, comprobar
   que el panel se expande con el teclado y no se queda abierto tras un clic.
4. Entre 768 y 1024 (tablet): el Sheet en lugar del raíl, y que se quede abierto tras navegar (M2).
5. Badges `rounded-md` (R1) en los módulos que usan las variantes legacy.
6. Ancho de la paleta: 448px.
7. A exactamente 1024px, el separador vertical junto al trigger (N8).
