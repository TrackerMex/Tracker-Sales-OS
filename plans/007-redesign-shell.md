# Plan 007: Shell como la plantilla (sidebar, header, contenido, footer)

> **Executor instructions**: Sigue este plan paso a paso. Si ocurre algo de
> "STOP conditions", detente y reporta. Al terminar, actualiza la fila en
> `plans/README.md` y escribe `progress/impl_81-007-shell.md`.
>
> **Drift check**: `git diff --stat 55b22e1 -- frontend/src/components frontend/src/shared/components/layout frontend/src/hooks`
> Solo se esperan los cambios del plan 006 (`progress/impl_81-006-foundation.md`). Otra cosa: STOP.

## Status

- **Feature**: 81-visual-redesign (fase 2 de 7)
- **Priority**: P1 · **Effort**: M · **Risk**: MED (afecta a todas las rutas)
- **Depends on**: 006

## Why this matters

El shell es lo que más se ve y lo que define "se parece a la plantilla":
sidebar blanco con pastilla negra, header de 57px con búsqueda, contenido
enmarcado con una línea de 1px y footer con atribución.

## Read first

- `DESIGN.md` → "Shell", "Responsive", "Modo oscuro".
- `progress/explore_redesign_template.md` §1 y §7.
- Capturas: `progress/redesign/template/home-1440.png`,
  `home-collapsed-1440.png`, `home-dark-1440.png`, `home-390.png`,
  `home-mobile-sidebar-390.png`.
- Código de referencia (solo lectura): `.../scratchpad/template-src/app/(dashboard-layout)/layout.tsx`,
  `.../layout/vertical/sidebar/*`, `.../layout/vertical/header/index.tsx`,
  `.../layout/shared/header/*`, `.../layout/footer/page.tsx` y el bloque
  `[data-sidebar-type="true"]` de `.../app/globals.css` (hover-expand del
  sidebar mini). Ruta base:
  `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/template-src`.
- `progress/explore_redesign_current.md` §1.

## Scope

**In scope**:
- `frontend/src/shared/components/layout/AppLayout.tsx`, `Header.tsx`
- `frontend/src/shared/components/layout/Footer.tsx` (crear)
- `frontend/src/shared/components/layout/ThemeToggle.tsx` (crear)
- `frontend/src/components/app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`
- `frontend/src/components/ui/sidebar.tsx`, `frontend/src/hooks/use-mobile.ts`
- `frontend/src/index.css` (CSS del sidebar mini; quitar `main{padding…!important}`)
- `frontend/src/shared/store/app.store.ts` (quitar `sidebarOpen`/`toggleSidebar` sin uso)
- Borrar: `frontend/src/components/nav-projects.tsx`, `team-switcher.tsx`
- `frontend/src/App.tsx` (solo quitar el `TooltipProvider` duplicado si es el de AppLayout el que sobra)
- `frontend/src/components/ui/badge-variants.ts` (solo la clase de radio de la base, ver Step R1)
- `frontend/src/shared/components/command/CommandPalette.tsx` (solo el ancho, ver Step R2)

**Out of scope**: módulos, páginas, títulos de página (fases 008-011),
lámina, backend.

## Steps

### Steps R1-R2: hallazgos de la review de 006 (`progress/review_81-006-foundation.md`, M1 y M2)

- **R1**: la base de Badge pasa de `rounded-full` a `rounded-md` (igual que
  `.cn-badge` de Lyra; DESIGN.md "Radio": badges cuadrados de 8px). Las píldoras
  de estado `rounded-full` las da `StatusBadge` (fase 008), no la base.
- **R2**: la paleta de comandos recupera su ancho previo (448px) con
  `className="sm:max-w-md"` en el `CommandDialog` de `CommandPalette.tsx`; el
  `sm:max-w-sm` de Lyra se queda como default de `dialog.tsx`.

1. **Constantes**: `SIDEBAR_WIDTH_ICON = "52px"` en `ui/sidebar.tsx`;
   `MOBILE_BREAKPOINT = 1025` en `hooks/use-mobile.ts`. Revisa quién más usa
   `useIsMobile` (`rg -n useIsMobile frontend/src`) y anota el efecto en el
   impl.
2. **Sidebar** (`app-sidebar.tsx`, `nav-main.tsx`): `variant="inset"
   collapsible="icon"`, panel interno `bg-background border`; cabecera `p-3
   border-b` de 57px con el logo (expandido: `/brand/trackermexico-dark.png`
   en claro y `/brand/trackermexico.png` en oscuro; colapsado:
   `/brand/tracker.png`). Grupos, headings, ítems, activo
   `bg-primary text-primary-foreground`, hover `bg-primary/5`, tooltips en
   modo icono: según DESIGN.md. Headings sustituidos por `...` en modo icono y
   hover-expand a 256px con `shadow-xl` (portar el CSS de la plantilla a
   `index.css`). Conservar el filtrado por rol y `NAV_SECTIONS`.
3. **Pie del sidebar** (`nav-user.tsx`): menú de usuario con avatar de
   iniciales en `bg-muted` (sin verde) y "Cerrar sesión" vía `useLogout`.
   La tarjeta de plan de la plantilla NO se copia en esta fase (no hay dato
   de meta mensual barato en el shell).
4. **Header**: `sticky top-0 z-10 bg-background border-b`, 57px. Izquierda:
   en < lg el logo; `SidebarTrigger` ghost redondo; separador vertical `h-4`
   (oculto < lg); botón con aspecto de input de búsqueda (`w-80 h-8
   rounded-lg`, icono a la izquierda, texto "Buscar…", `kbd` Ctrl K) que
   dispara el evento `open-command-palette` (oculto < sm). Derecha:
   `ThemeToggle` (next-themes, botón circular 40px, icono luna/sol 20px) y
   avatar circular que abre un `Sheet` derecho `sm:max-w-80` con avatar,
   nombre, rol y "Cerrar sesión" (`useLogout`). Eliminar `ROUTE_TITLES`,
   los botones de acciones rápidas (ya están en la paleta, grupo "Acciones")
   y el segundo camino de logout con `clearAuth()`. Sin campana de
   notificaciones (no hay backend de notificaciones).
5. **Contenido** (`AppLayout.tsx`): `SidebarInset className="m-2 outline
   outline-border rounded-none overflow-hidden"`; Header; luego
   `div.flex-1.overflow-y-auto > div.flex.flex-col.gap-4.p-4 >
   div.mx-auto.w-full.max-w-[1367px]` con `min-h-[calc(100vh-140px)]` para el
   `Outlet` y `Footer` debajo con `pt-6`. Fuera `bg-tracker-bg` y `p-5`.
   Un solo `TooltipProvider` en la app.
6. **Footer**: `flex flex-col md:flex-row items-center justify-between gap-3
   text-sm text-muted-foreground`: "© 2026 Tracker México" a la izquierda;
   a la derecha "Diseño basado en
   [Shadcn Dashboard](https://github.com/shadcndashboard/next-shadcn-dashboard)"
   (`hover:text-primary`, `target="_blank" rel="noreferrer"`).
7. **Limpieza**: quitar `main{padding…!important}` de `index.css`; borrar
   `nav-projects.tsx`, `team-switcher.tsx` y `sidebarOpen` del store tras
   comprobar con `rg` que no tienen usos.
8. **Gates**: `pnpm run typecheck && pnpm run lint && pnpm run build`.

El Líder deja `frontend/public/brand/trackermexico-dark.png` generado antes de
lanzar este plan. Si no existe, STOP.

## Done criteria

- [ ] `rg -n "ROUTE_TITLES|clearAuth" frontend/src/shared/components/layout` → 0
- [ ] `rg -n "nav-projects|team-switcher|sidebarOpen" frontend/src` → 0
- [ ] `rg -n "bg-tracker|text-tracker|#[0-9a-fA-F]{3,6}" frontend/src/components/app-sidebar.tsx frontend/src/components/nav-*.tsx frontend/src/shared/components/layout` → 0
- [ ] Toggle claro/oscuro funciona y persiste al recargar
- [ ] Sidebar: expandido 256px, colapsado 52px con hover-expand, Sheet < 1025px
- [ ] Footer con enlace de atribución
- [ ] typecheck, lint y build exit 0

## STOP conditions

- Falta `frontend/public/brand/trackermexico-dark.png`.
- `variant="inset"` del `ui/sidebar.tsx` actual no existe o rompe el layout
  de forma que exige reescribir el componente entero: reporta.
- El cambio de `MOBILE_BREAKPOINT` afecta a módulos de forma visible: reporta.
- La paleta de comandos deja de abrirse con Ctrl K o desde el botón.

## Maintenance notes

- La tarjeta de "meta del mes" en el pie del sidebar (patrón de la plantilla)
  queda para después, cuando haya un endpoint barato con el progreso del
  usuario.
- Las páginas siguen con sus títulos antiguos hasta las fases 008-011.
