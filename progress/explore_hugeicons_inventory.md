# Inventario HugeIcons — estado actual (pre-migración a reicon-react)

> Exploración de solo lectura. Documenta el **estado actual**; no propone mapeo a reicon.
> Fecha: 2026-07-16 · Rama: `review-ui`

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Archivos que importan `@hugeicons/*` | 24 |
| Instancias de `<HugeiconsIcon />` | **52** |
| Iconos distintos de `@hugeicons/core-free-icons` | **23** |
| Versiones instaladas | `@hugeicons/react@1.1.6`, `@hugeicons/core-free-icons@4.2.0` |
| Destino ya presente en `package.json` | `reicon-react@^1.1.301` (línea 40, aún sin usar en `src/`) |

## Contrato real del wrapper actual (crítico para el plan)

Leído de `frontend/node_modules/@hugeicons/react/dist/esm/HugeiconsIcon.js` y
`dist/types/HugeiconsIcon.d.ts`. El reemplazo debe replicar esto o los usos abajo rompen:

| Capacidad | Comportamiento actual | Dónde importa |
|---|---|---|
| `forwardRef` → `<svg>` | `React.forwardRef`, `ref` va al elemento `svg` | `select.tsx:48-50` (`SelectPrimitive.Icon asChild`) |
| `className` | Se reenvía **verbatim** al `<svg>` raíz | 30+ usos; toda la estrategia de tamaño Tailwind |
| `...rest` spread | Todo prop desconocido cae en el `<svg>` | `data-slot` en `accordion.tsx:56,57` |
| `size` (default `24`) | Emite atributos `width`/`height` en el `<svg>` | 12 usos con `size={11|12|13}` |
| `color` (default `currentColor`) | Emite atributo `color` en el `<svg>` | 12 usos en módulos |
| `strokeWidth` | Si se pasa, añade `stroke="currentColor"` **al `<svg>` y a cada path hijo**. Si se omite, **no se aplica stroke alguno** | 52/52 usos lo pasan |
| `absoluteStrokeWidth` | No se usa en el proyecto (default `false`) | — |

**Consecuencia no obvia:** con `absoluteStrokeWidth=false`, `strokeWidth={1.8}` en un icono
`size={11}` se renderiza como 1.8 unidades del viewBox 24 escaladas a 11px ≈ 0.83px reales.
El grosor percibido depende del tamaño; no es un stroke absoluto.

---

## A. Primitivas de `frontend/src/components/ui/*` (17 usos — mayor riesgo)

| # | file:line | Icono | Props literales | Contexto / dependencias |
|---|---|---|---|---|
| 1 | `frontend/src/components/ui/command.tsx:42` | `Search01Icon` | `icon`, `className="size-4 shrink-0 opacity-50"`, `strokeWidth={2}` | Hermano del input, dentro de `div[data-slot=command-input-wrapper]`. Decorativo **sin `aria-hidden`** |
| 2 | `frontend/src/components/ui/select.tsx:49` | `UnfoldMoreIcon` | `icon`, `strokeWidth={2}`, `className="pointer-events-none size-4 text-muted-foreground"` | **Dentro de `<SelectPrimitive.Icon asChild>`** → Radix clona e inyecta `ref` + props. Requiere `forwardRef` |
| 3 | `frontend/src/components/ui/select.tsx:117` | `Tick02Icon` | `icon`, `strokeWidth={2}`, `className="pointer-events-none"` | Dentro de `ItemIndicator`. **Sin clase de tamaño**: hereda `[&_svg:not([class*='size-'])]:size-4` de `select-item` (línea 110) |
| 4 | `frontend/src/components/ui/select.tsx:154` | `ArrowUp01Icon` | `icon`, `strokeWidth={2}` | Tamaño vía `[&_svg:not([class*='size-'])]:size-4` del ScrollUpButton (línea 149) |
| 5 | `frontend/src/components/ui/select.tsx:172` | `ArrowDown01Icon` | `icon`, `strokeWidth={2}` | Ídem, línea 167 |
| 6 | `frontend/src/components/ui/checkbox.tsx:25` | `Tick02Icon` | `icon`, `strokeWidth={3}`, `className="size-3"` | Dentro de `CheckboxPrimitive.Indicator`. **Único `strokeWidth={3}` del repo** |
| 7 | `frontend/src/components/ui/accordion.tsx:56` | `ArrowDown01Icon` | `icon`, `strokeWidth={2}`, **`data-slot="accordion-trigger-icon"`**, `className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"` | **Doble dependencia**: `data-slot` (targeteado por `**:data-[slot=accordion-trigger-icon]:*` en línea 50) + `group-aria-expanded/accordion-trigger` |
| 8 | `frontend/src/components/ui/accordion.tsx:57` | `ArrowUp01Icon` | `icon`, `strokeWidth={2}`, **`data-slot="accordion-trigger-icon"`**, `className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"` | Ídem. Par mutuamente excluyente por estado |
| 9 | `frontend/src/components/ui/dropdown-menu.tsx:110` | `Tick02Icon` | `icon`, `strokeWidth={2}` | En `ItemIndicator` de CheckboxItem. Tamaño por `[&_svg:not([class*='size-'])]:size-4` (línea 99) |
| 10 | `frontend/src/components/ui/dropdown-menu.tsx:152` | `Tick02Icon` | `icon`, `strokeWidth={2}` | Ídem en RadioItem (línea 142) |
| 11 | `frontend/src/components/ui/dropdown-menu.tsx:234` | `ArrowRight01Icon` | `icon`, `strokeWidth={2}`, `className="ml-auto"` | SubTrigger. **`ml-auto` no es clase de tamaño** → `size-4` del padre (línea 228) sigue aplicando |
| 12 | `frontend/src/components/ui/sheet.tsx:79` | `Cancel01Icon` | `icon`, `strokeWidth={2}` | Dentro de `<Button variant="ghost" size="icon-sm">`. Nombre accesible: `<span className="sr-only">Close</span>` (línea 80) |
| 13 | `frontend/src/components/ui/breadcrumb.tsx:87` | `ArrowRight01Icon` | `icon`, `strokeWidth={2}` | **Fallback de `children ?? …`**. Tamaño por `[&>svg]:size-3.5` del `li` (línea 83). Padre `aria-hidden="true"` |
| 14 | `frontend/src/components/ui/breadcrumb.tsx:108` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | Tamaño por `[&>svg]:size-4` (línea 103). Padre `aria-hidden="true"` + `sr-only "More"` |
| 15 | `frontend/src/components/ui/dialog.tsx:78` | `Cancel01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-sm">` + `sr-only "Close"` (línea 79) |
| 16 | `frontend/src/components/ui/sidebar.tsx:252` | `SidebarLeftIcon` | `icon`, `strokeWidth={2}` | `<Button size="icon-sm">` + `sr-only "Toggle Sidebar"` (línea 253) |
| 17 | `frontend/src/components/ui/calendar.tsx:53-58` | `ArrowLeft01Icon` **o** `ArrowRight01Icon` | `icon={orientation === "left" ? ArrowLeft01Icon : ArrowRight01Icon}`, `strokeWidth={2}`, `className={cn("size-4", chevronProps.className)}` | **Caso raro** — ver sección Casos raros |

### Selectores CSS que gobiernan el tamaño del `<svg>` (no el prop `size`)

Estos padres imponen tamaño por CSS, que **gana sobre los atributos `width`/`height`** del SVG:

| Origen | Selector | Efecto |
|---|---|---|
| `frontend/src/components/ui/button-variants.ts:4` | `[&_svg:not([class*='size-'])]:size-4` | 16px por defecto en todo Button |
| `frontend/src/components/ui/button-variants.ts:18` | `xs`: `[&_svg:not([class*='size-'])]:size-3` | 12px |
| `frontend/src/components/ui/button-variants.ts:22` | `icon-xs`: `[&_svg:not([class*='size-'])]:size-3` | 12px |
| `frontend/src/components/ui/badge-variants.ts:4` | **`[&>svg]:size-3!`** | 12px **con `!important`**, ignora incluso `size-*` propia |
| `frontend/src/components/ui/sidebar.tsx:451` | `[&_svg]:size-4 [&_svg]:shrink-0` | menu-button |
| `frontend/src/components/ui/sidebar.tsx:386,406,538,651` | `[&>svg]:size-4 [&>svg]:shrink-0` | group-label, group-action, menu-action, menu-sub-button |
| `frontend/src/components/ui/select.tsx:42,110,149,167` | `[&_svg:not([class*='size-'])]:size-4` | trigger, item, scroll buttons |
| `frontend/src/components/ui/dropdown-menu.tsx:77,99,142,228` | `[&_svg:not([class*='size-'])]:size-4` | item, checkbox-item, radio-item, sub-trigger |
| `frontend/src/components/ui/breadcrumb.tsx:83,103` | `[&>svg]:size-3.5` / `[&>svg]:size-4` | separator / ellipsis |

---

## B. Navegación / sidebar (9 usos)

| # | file:line | Icono | Props literales | Contexto / nombre accesible |
|---|---|---|---|---|
| 18 | `frontend/src/components/nav-user.tsx:75-79` | `UnfoldMoreIcon` | `icon`, `strokeWidth={2}`, `className="ml-auto size-4"` | Dentro de `SidebarMenuButton size="lg"` (trigger de dropdown). Decorativo; el botón ya tiene texto |
| 19 | `frontend/src/components/nav-user.tsx:107` | `LogoutIcon` | `icon`, `strokeWidth={2}` | `DropdownMenuItem` con texto "Cerrar sesión" |
| 20 | `frontend/src/components/nav-projects.tsx:51` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `SidebarMenuAction showOnHover className="aria-expanded:bg-muted"` + `sr-only "More"` (línea 52) |
| 21 | `frontend/src/components/nav-projects.tsx:61` | `FolderIcon` | `icon`, `strokeWidth={2}` | `DropdownMenuItem` + texto "View Project" |
| 22 | `frontend/src/components/nav-projects.tsx:65` | `ArrowRightIcon` | `icon`, `strokeWidth={2}` | `DropdownMenuItem` + texto "Share Project" |
| 23 | `frontend/src/components/nav-projects.tsx:70` | `Delete02Icon` | `icon`, `strokeWidth={2}` | `DropdownMenuItem variant="destructive"` → hereda `data-[variant=destructive]:*:[svg]:text-destructive` (dropdown-menu.tsx:77) |
| 24 | `frontend/src/components/nav-projects.tsx:79` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}`, `className="text-sidebar-foreground/70"` | `SidebarMenuButton` + texto "More" |
| 25 | `frontend/src/components/team-switcher.tsx:55` | `UnfoldMoreIcon` | `icon`, `strokeWidth={2}`, `className="ml-auto"` | `SidebarMenuButton size="lg"`; tamaño por `[&_svg]:size-4` (sidebar.tsx:451) |
| 26 | `frontend/src/components/team-switcher.tsx:83` | `PlusSignIcon` | `icon`, `strokeWidth={2}`, `className="size-4"` | `DropdownMenuItem` + texto "Add team" |

### ⚠️ Los iconos del sidebar de navegación NO son HugeIcons

Hallazgo que evita trabajo equivocado: los 11 iconos del menú lateral real
(`Dashboard`, `Mi día`, `Clientes`, `Agenda`, `Pipeline`, `Ventas`, `Coaching`, `Reportes`,
`Equipo`, `Configuración`, `Import/Export`) son **SVG inline escritos a mano** (estilo Feather),
almacenados como `React.ReactNode` en un objeto de configuración:

- `frontend/src/shared/navigation/nav-items.tsx:11-283` — `NAV_SECTIONS`, cada item con `icon: (<svg …/>)` literal (`width="16" height="16"`, `strokeWidth="1.6"`, `stroke="currentColor"`).
- Consumido por `frontend/src/components/app-sidebar.tsx:21-27` → `frontend/src/components/nav-main.tsx:38` (`{item.icon}`).
- `frontend/src/components/nav-main.tsx:13` y `frontend/src/shared/navigation/nav-items.tsx:8` tipan `icon: React.ReactNode` — **no** `IconSvgElement`.
- El logo de `app-sidebar.tsx:37-47` también es SVG inline.
- `frontend/src/components/nav-projects.tsx:28` (`icon`) y `frontend/src/components/team-switcher.tsx:28` (`logo`) también reciben `React.ReactNode` desde fuera.

**Ninguno de estos entra en la migración.** `nav-main.tsx` y `app-sidebar.tsx` no importan `@hugeicons/*`.

---

## C. Forms compartidos (4 usos)

| # | file:line | Icono | Props literales | Contexto / nombre accesible |
|---|---|---|---|---|
| 27 | `frontend/src/shared/components/forms/DatePickerField.tsx:57-61` | `Calendar01Icon` | `icon`, `strokeWidth={2}`, `className="pointer-events-none size-4 shrink-0 text-muted-foreground"` | `<button>` nativo dentro de `PopoverTrigger asChild`. El botón tiene texto (fecha o placeholder) |
| 28 | `frontend/src/shared/components/forms/ClientCombobox.tsx:101-105` | `UnfoldMoreIcon` | `icon`, `strokeWidth={2}`, `className="pointer-events-none size-4 shrink-0 text-muted-foreground"` | `<button role="combobox" aria-expanded={open} aria-invalid={error}>` en `PopoverTrigger asChild` |
| 29 | `frontend/src/shared/components/forms/ClientCombobox.tsx:127` | `Tick02Icon` | `icon`, `className="ml-auto size-4"`, `strokeWidth={2}` | **Condicional `{!value && (…)}`** dentro de `CommandItem value="__none__"`. Sin `aria-hidden` ni nombre accesible: el estado "seleccionado" se comunica **solo visualmente** |
| 30 | `frontend/src/shared/components/forms/ClientCombobox.tsx:150` | `Tick02Icon` | `icon`, `className="ml-auto size-4"`, `strokeWidth={2}` | **Condicional `{c.id === value && (…)}`** dentro de `CommandItem` en `.map()`. Misma nota de a11y |

Nota de orden de props: en 29 y 30 `className` precede a `strokeWidth` (los demás usos ponen `strokeWidth` primero). Irrelevante en runtime; relevante para codemods basados en regex posicional.

---

## D. Páginas y componentes de módulos (22 usos)

### `frontend/src/modules/tasks/presentation/components/TaskCard.tsx` (8)

| # | file:line | Icono | Props literales | Contexto |
|---|---|---|---|---|
| 31 | `…/TaskCard.tsx:107-112` | `CheckListIcon` | `icon`, `size={11}`, `color="currentColor"`, `strokeWidth={1.8}` | Dentro de `<Badge variant={typeTagVariant}>` → **`[&>svg]:size-3!` anula `size={11}`** |
| 32 | `…/TaskCard.tsx:121-126` | `OfficeIcon` | `icon`, `size={12}`, `color="#334155"`, `strokeWidth={1.8}` | Dentro de `<p>` plano → `size={12}` **sí** aplica |
| 33 | `…/TaskCard.tsx:146-151` | `User02Icon` | `icon`, `size={11}`, `color="#94A3B8"`, `strokeWidth={1.8}` | Dentro de `<span>` plano → `size={11}` **sí** aplica |
| 34 | `…/TaskCard.tsx:171-176` | `CheckmarkCircle02Icon` | `icon`, `size={13}`, `color="currentColor"`, `strokeWidth={1.8}` | `<Button variant="success" size="sm">` → `[&_svg:not([class*='size-'])]:size-4` **anula** `size={13}` |
| 35 | `…/TaskCard.tsx:209-212` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-sm" aria-label="Acciones de tarea">` |
| 36 | `…/TaskCard.tsx:221-226` | `PencilEdit02Icon` | `icon`, `size={13}`, `color="currentColor"`, `strokeWidth={1.8}` | `DropdownMenuItem` (rama `task.status === "Pendiente"`) → `size-4` anula `size={13}` |
| 37 | `…/TaskCard.tsx:231-236` | `ArrowReloadHorizontalIcon` | `icon`, `size={13}`, `color="currentColor"`, `strokeWidth={1.8}` | `DropdownMenuItem` (rama `else`) → ídem |
| 38 | `…/TaskCard.tsx:245-250` | `Delete02Icon` | `icon`, `size={13}`, `color="currentColor"`, `strokeWidth={1.8}` | `DropdownMenuItem variant="destructive"` → `size-4` anula `size={13}`; color forzado por `data-[variant=destructive]:*:[svg]:text-destructive` |

### `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx` (3)

| # | file:line | Icono | Props literales | Contexto |
|---|---|---|---|---|
| 39 | `…/MiDiaPage.tsx:538-543` | `OfficeIcon` | `icon`, `size={12}`, `color="#334155"`, `strokeWidth={1.8}` | `<span>` plano, condicional `{clientName && …}` |
| 40 | `…/MiDiaPage.tsx:549-554` | `User02Icon` | `icon`, `size={11}`, `color="#64748B"`, `strokeWidth={1.8}` | `<span>` plano, condicional `{contactName && …}` |
| 41 | `…/MiDiaPage.tsx:563-568` | `CheckListIcon` | `icon`, `size={11}`, `color="currentColor"`, `strokeWidth={1.8}` | Dentro de `<Badge>` → **`[&>svg]:size-3!` anula `size={11}`** |

### `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx` (4)

| # | file:line | Icono | Props literales | Contexto |
|---|---|---|---|---|
| 42 | `…/ActivitiesPage.tsx:158-163` | `OfficeIcon` | `icon`, `size={12}`, `color="#002B49"`, `strokeWidth={1.8}` | `<span>` plano → `size` sí aplica |
| 43 | `…/ActivitiesPage.tsx:169-174` | `User02Icon` | `icon`, `size={12}`, `color="#64748B"`, `strokeWidth={1.8}` | `<span>` plano |
| 44 | `…/ActivitiesPage.tsx:180-185` | `CheckListIcon` | `icon`, `size={11}`, `color="#4338CA"`, `strokeWidth={1.8}` | `<span>` plano (chip manual, **no** `Badge`) → `size={11}` sí aplica |
| 45 | `…/ActivitiesPage.tsx:229-232` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-xs" aria-label="Acciones de actividad">` |

### Resto de módulos (7) — todos el mismo patrón "kebab menu"

| # | file:line | Icono | Props literales | Contexto |
|---|---|---|---|---|
| 46 | `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx:275-278` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-xs" disabled={…} aria-label={\`Acciones de usuario ${user.username}\`}>` |
| 47 | `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx:335-338` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button … aria-label={\`Acciones de vendedor ${seller.name}\`}>` |
| 48 | `frontend/src/modules/sales/presentation/pages/SalesPage.tsx:895-898` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-xs" aria-label={\`Acciones de venta ${sale.clientName}\`}>`, dentro de `{isAdminOrDirector && …}` |
| 49 | `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx:675-678` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-sm" aria-label={\`Acciones de ${client.name}\`}>` |
| 50 | `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx:355-358` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-xs" aria-label="Acciones de actividad">` |
| 51 | `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx:288-291` | `MoreHorizontalCircle01Icon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-sm" aria-label="Acciones del informe">` |
| 52 | `frontend/src/modules/pipeline/presentation/components/DealCard.tsx:118` | `ViewIcon` | `icon`, `strokeWidth={2}` | `<Button variant="ghost" size="icon-xs" aria-label="Vista rápida" className="bg-transparent …" onClick={(e) => e.stopPropagation()}>` en `PopoverTrigger asChild` |

Todos los usos 45-52 viven en el combo `DropdownMenu > Tooltip > TooltipTrigger asChild > DropdownMenuTrigger asChild > Button`, con `aria-label` en el `Button` (nunca en el icono).

---

## Tabla resumen: icono → usos → archivos

| Icono | Usos | Archivos (`file:line`) |
|---|---:|---|
| `MoreHorizontalCircle01Icon` | 11 | `ui/breadcrumb.tsx:108`, `nav-projects.tsx:51`, `nav-projects.tsx:79`, `EquipoPage.tsx:275`, `EquipoPage.tsx:335`, `ActivitiesPage.tsx:229`, `SalesPage.tsx:895`, `ClientesPage.tsx:675`, `ClientDetailPage.tsx:355`, `ReportsPage.tsx:288`, `TaskCard.tsx:209` |
| `Tick02Icon` | 6 | `ui/select.tsx:117`, `ui/checkbox.tsx:25`, `ui/dropdown-menu.tsx:110`, `ui/dropdown-menu.tsx:152`, `ClientCombobox.tsx:127`, `ClientCombobox.tsx:150` |
| `UnfoldMoreIcon` | 4 | `ui/select.tsx:49`, `nav-user.tsx:76`, `team-switcher.tsx:55`, `ClientCombobox.tsx:102` |
| `ArrowRight01Icon` | 3 | `ui/dropdown-menu.tsx:234`, `ui/breadcrumb.tsx:87`, `ui/calendar.tsx:54` (ternario) |
| `OfficeIcon` | 3 | `ActivitiesPage.tsx:159`, `MiDiaPage.tsx:539`, `TaskCard.tsx:122` |
| `User02Icon` | 3 | `ActivitiesPage.tsx:170`, `MiDiaPage.tsx:550`, `TaskCard.tsx:147` |
| `CheckListIcon` | 3 | `ActivitiesPage.tsx:181`, `MiDiaPage.tsx:564`, `TaskCard.tsx:108` |
| `ArrowUp01Icon` | 2 | `ui/select.tsx:154`, `ui/accordion.tsx:57` |
| `ArrowDown01Icon` | 2 | `ui/select.tsx:172`, `ui/accordion.tsx:56` |
| `Cancel01Icon` | 2 | `ui/sheet.tsx:79`, `ui/dialog.tsx:78` |
| `Delete02Icon` | 2 | `nav-projects.tsx:70`, `TaskCard.tsx:246` |
| `Search01Icon` | 1 | `ui/command.tsx:43` |
| `SidebarLeftIcon` | 1 | `ui/sidebar.tsx:252` |
| `ArrowLeft01Icon` | 1 | `ui/calendar.tsx:54` (ternario) |
| `LogoutIcon` | 1 | `nav-user.tsx:107` |
| `FolderIcon` | 1 | `nav-projects.tsx:61` |
| `ArrowRightIcon` | 1 | `nav-projects.tsx:65` |
| `PlusSignIcon` | 1 | `team-switcher.tsx:83` |
| `Calendar01Icon` | 1 | `DatePickerField.tsx:58` |
| `CheckmarkCircle02Icon` | 1 | `TaskCard.tsx:172` |
| `PencilEdit02Icon` | 1 | `TaskCard.tsx:222` |
| `ArrowReloadHorizontalIcon` | 1 | `TaskCard.tsx:232` |
| `ViewIcon` | 1 | `DealCard.tsx:118` |
| **Total** | **52** | 24 archivos |

Ojo: `ArrowRightIcon` (nav-projects.tsx:65) y `ArrowRight01Icon` son **iconos distintos** con nombres casi idénticos. No colapsarlos.

## Valores distintos de `strokeWidth`

| Valor | Usos | Dónde |
|---|---:|---|
| `2` | 40 | Todas las primitivas salvo checkbox; todos los kebab menus; todos los chevrons |
| `1.8` | 11 | Solo iconos de contenido en módulos: `ActivitiesPage` (3), `MiDiaPage` (3), `TaskCard` (5) |
| `3` | 1 | `ui/checkbox.tsx:25` (único) |

`strokeWidth` se pasa en **52/52** usos. Ningún uso emplea `absoluteStrokeWidth`.

## Tamaños

**Prop `size` numérico (12 usos, todos en módulos):**

| `size` | Usos | ¿Efectivo? |
|---|---:|---|
| `13` | 4 | ❌ `TaskCard.tsx:171,221,231,245` — todos dentro de Button/DropdownMenuItem → anulados a 16px por `size-4` |
| `12` | 4 | ✅ `ActivitiesPage.tsx:158,169`, `MiDiaPage.tsx:538`, `TaskCard.tsx:121` (span/p planos) |
| `11` | 4 | ✅ `ActivitiesPage.tsx:180`, `TaskCard.tsx:146`, `MiDiaPage.tsx:549` · ❌ `TaskCard.tsx:107`, `MiDiaPage.tsx:563` (dentro de Badge → `size-3!`) |

**Clases Tailwind de tamaño en `className` (7 usos):** `size-4` en `ui/command.tsx:44`, `ui/select.tsx:49`, `ui/calendar.tsx:56`, `nav-user.tsx:78`, `team-switcher.tsx:83`, `DatePickerField.tsx:60`, `ClientCombobox.tsx:104`, `ClientCombobox.tsx:127`, `ClientCombobox.tsx:150`; `size-3` en `ui/checkbox.tsx:25`.

**Resto (33 usos):** sin `size` ni clase de tamaño → dependen **enteramente** de los selectores `[&_svg]` / `[&>svg]` del padre. Renderizarían a 24×24 si el CSS del padre desapareciera.

---

## Riesgos de migración

Ordenados por gravedad. Cada punto es una precondición que el componente sustituto debe cumplir.

### R1 — `data-slot` reenviado al `<svg>` (crítico, silencioso)
`frontend/src/components/ui/accordion.tsx:56` y `:57` pasan `data-slot="accordion-trigger-icon"`.
Ese atributo **solo llega al `<svg>` porque `HugeiconsIcon` hace `...rest` spread**. Es el target de
`**:data-[slot=accordion-trigger-icon]:ml-auto`, `:size-4` y `:text-[var(--tracker-text-muted)]`
en `frontend/src/components/ui/accordion.tsx:50`. Si el componente nuevo no acepta props arbitrarias,
**no hay error de compilación ni de runtime**: los chevrons pierden tamaño, color y alineación.

### R2 — `ref` reenviado (crítico, rompe en runtime)
`frontend/src/components/ui/select.tsx:48-50`: `<SelectPrimitive.Icon asChild>` clona el hijo e
inyecta `ref`. Sin `forwardRef` en el sustituto, React avisa y Radix pierde la referencia.
Es el único `asChild` que envuelve **directamente** un `HugeiconsIcon`; en todos los demás
(`sheet.tsx:73`, `dialog.tsx:72`, `DealCard.tsx:110`, etc.) el `asChild` envuelve un `Button`
y el icono queda un nivel más abajo — ahí no hay riesgo de ref.

### R3 — `className` reenviado al `<svg>` raíz (crítico, alto volumen)
33 de 52 usos **no tienen tamaño propio** y dependen de que el `<svg>` reciba tanto la `className`
que se le pasa como la herencia de los selectores del padre. Casos donde la clase reenviada
hace trabajo funcional, no cosmético:
- `frontend/src/components/ui/accordion.tsx:56,57` — `group-aria-expanded/accordion-trigger:hidden|inline` alterna **qué chevron se ve**. Si la clase no llega al `<svg>`, se ven los dos a la vez.
- `frontend/src/components/ui/select.tsx:49,117`, `DatePickerField.tsx:60`, `ClientCombobox.tsx:104` — `pointer-events-none` evita que el icono robe clics al trigger.
- `frontend/src/components/ui/command.tsx:44` — `shrink-0` evita que el icono colapse junto al input flex.
- `frontend/src/components/ui/calendar.tsx:56` — `cn("size-4", chevronProps.className)` mezcla la clase que inyecta react-day-picker.

### R4 — El selector `:not([class*='size-'])` es sensible al valor de `className`
`HugeiconsIcon` aplica `className = ''` por defecto, así que el `<svg>` siempre lleva un atributo
`class` (vacío) y `[&_svg:not([class*='size-'])]:size-4` **matchea**. Si el sustituto añade clases
propias que contengan la subcadena `size-` (p. ej. una clase base tipo `reicon-size-md`), el
`:not()` deja de matchear y **33 usos pierden su tamaño heredado** en Button, DropdownMenuItem,
Select y Sidebar de golpe. Riesgo sistémico y difícil de atribuir.

### R5 — `strokeWidth` no es cosmético en HugeIcons
En `HugeiconsIcon.js`, pasar `strokeWidth` es lo que inyecta `stroke: 'currentColor'` en el `<svg>`
**y en cada path hijo**. Los 52 usos lo pasan. Si el sustituto trata `strokeWidth` como opcional o
lo ignora, los iconos pueden renderizar sin trazo (invisibles) en vez de fallar ruidosamente.
Vigilar en particular `ui/checkbox.tsx:25` (`strokeWidth={3}`, único) y los 11 usos con `1.8`.

### R6 — `color` como atributo, no como clase
Los 12 usos con `color="#334155"` / `"#002B49"` / `"#64748B"` / `"#4338CA"` / `"#94A3B8"` /
`"currentColor"` (`ActivitiesPage`, `MiDiaPage`, `TaskCard`) dependen de que el prop se traduzca a
atributo `color` en el `<svg>`, que a su vez alimenta el `currentColor` de los paths. Convive con
clases Tailwind de color en el padre (`text-tracker-blue`, etc.); en
`TaskCard.tsx:245` el color lo pisa además `data-[variant=destructive]:*:[svg]:text-destructive`.
Coexistencia frágil: hay 3 mecanismos de color simultáneos.

### R7 — El prop `size` ya es mentira en 6 de 12 usos
`TaskCard.tsx:171,221,231,245` (`size={13}`) y `TaskCard.tsx:107` + `MiDiaPage.tsx:563` (`size={11}`
dentro de `Badge`, cuyo `[&>svg]:size-3!` lleva `!important`) están **anulados por CSS hoy**.
Al migrar, copiar el `size` literal a un sustituto que lo aplique por CSS en vez de por atributo
**cambiaría el render actual** (13px/11px reales donde hoy se ven 16px/12px). El valor visual
correcto es el del CSS del padre, no el del prop.

### R8 — Colisión de nombres
`ArrowRightIcon` (`nav-projects.tsx:65`) vs `ArrowRight01Icon` (`ui/dropdown-menu.tsx:234`,
`ui/breadcrumb.tsx:87`, `ui/calendar.tsx:54`) son glifos distintos. Un mapeo por búsqueda/reemplazo
laxo los fusiona sin que nada falle.

---

## Casos raros (no siguen el patrón estándar)

1. **Icono condicional por ternario dentro de un slot de librería** — `frontend/src/components/ui/calendar.tsx:52-58`.
   El icono se elige con `orientation === "left" ? ArrowLeft01Icon : ArrowRight01Icon` dentro del
   override `components={{ Chevron: … }}` de `react-day-picker`. Además:
   `({ orientation, ...chevronProps })` recoge el resto **pero solo consume `chevronProps.className`**;
   props que day-picker inyecte (`size`, `disabled`, etc.) se descartan silenciosamente. Único uso
   con icono dinámico y única integración con un `components` map de terceros.

2. **Iconos condicionales por estado** — `ClientCombobox.tsx:127` (`{!value && …}`) y
   `ClientCombobox.tsx:150` (`{c.id === value && …}`, dentro de `.map()`); `SalesPage.tsx:895`
   (dentro de `{isAdminOrDirector && …}`); `TaskCard.tsx:221` vs `:231` (ramas ternarias
   `Pendiente` / else); `MiDiaPage.tsx:538,549,563` y `ActivitiesPage.tsx:158,169,180`
   (guardas `{clientName && …}` etc.). No aparecen en un render inicial ingenuo: requieren
   ejercitar el estado para verificarlos visualmente.

3. **Par de iconos mutuamente excluyentes por CSS, no por JS** — `ui/accordion.tsx:56-57`.
   Ambos chevrons se montan siempre; solo `group-aria-expanded/accordion-trigger:hidden|inline`
   decide cuál se ve. Es el único sitio donde el icono depende de una clase de estado de grupo.

4. **Icono como fallback de `children`** — `ui/breadcrumb.tsx:86-88`:
   `{children ?? (<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />)}`. Solo se renderiza
   si el consumidor no pasa un separador propio.

5. **Iconos como `React.ReactNode` en objetos de configuración** — `frontend/src/shared/navigation/nav-items.tsx:11-283`
   (`NAV_SECTIONS`, 11 items con `icon:` = JSX `<svg>` inline). Consumido vía
   `app-sidebar.tsx:26` → `nav-main.tsx:38`. También `nav-projects.tsx:28` (`icon`) y
   `team-switcher.tsx:28` (`logo`). **Son SVG a mano, no HugeIcons** → fuera de alcance,
   pero es exactamente donde alguien buscaría "iconos de navegación" y se confundiría.

6. **Ningún import renombrado** — se verificó: no hay `import { X as Y } from "@hugeicons/core-free-icons"`
   en todo `frontend/src`. Tampoco hay iconos guardados en variables/arrays/mapas, ni `icon={someVar}`
   fuera del ternario de `calendar.tsx:54`.

7. **Sin `title` ni `aria-*` en ningún `<HugeiconsIcon />`** — 0 usos de los 52. La accesibilidad
   siempre vive en el ancestro (`aria-label` en `Button`, `sr-only`, o `aria-hidden` en el padre).
   Tampoco hay handlers ni `ref` puestos directamente sobre un icono; el único `onClick` cercano
   está en el `Button` de `DealCard.tsx:116`.

## ⚠️ `showIcon` NO es un icono — no migrar

`frontend/src/components/ui/sidebar.tsx:567`, `:570` y `:584`.

Es un prop **booleano** de `SidebarMenuSkeleton` (`showIcon?: boolean`, default `false`) que decide
si se pinta un cuadrito `<Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />`
como *placeholder* de carga. No renderiza ningún `HugeiconsIcon`, no importa nada de `@hugeicons/*`
y el `<Skeleton>` es un `div`, no un `svg`. Coincide por búsqueda de texto (`icon`), nada más.

Identificadores vecinos que tampoco son iconos, por si aparecen en un grep:
- `showCloseButton` — `ui/dialog.tsx:54,71,100,116`, `ui/sheet.tsx:53,72` (bool: pinta el `Button` de cierre).
- `showOnHover` — `ui/sidebar.tsx:525,539`, `nav-projects.tsx:48` (bool de visibilidad).
- `showOutsideDays` — `ui/calendar.tsx:12,17` (prop de react-day-picker).
- `showAlt` / `altIcon` — props de la API de HugeIcons; **no se usan en el proyecto**.
- `icon` / `icon-xs` / `icon-sm` / `icon-lg` — nombres de `size` variant en `ui/button-variants.ts:21-24`.
- `data-[icon=inline-start]` / `data-[icon=inline-end]` — selectores de padding en `button-variants.ts:17-20` y `badge-variants.ts:4`. **No hay ningún elemento en el repo que emita ese `data-icon`**; los selectores están inertes hoy.

## Archivos tocados por la migración (24)

Primitivas (13): `ui/accordion.tsx`, `ui/breadcrumb.tsx`, `ui/calendar.tsx`, `ui/checkbox.tsx`,
`ui/command.tsx`, `ui/dialog.tsx`, `ui/dropdown-menu.tsx`, `ui/select.tsx`, `ui/sheet.tsx`, `ui/sidebar.tsx`
Nav (3): `nav-user.tsx`, `nav-projects.tsx`, `team-switcher.tsx`
Forms (2): `shared/components/forms/DatePickerField.tsx`, `shared/components/forms/ClientCombobox.tsx`
Módulos (9): `activities/…/ActivitiesPage.tsx`, `clients/…/ClientesPage.tsx`, `equipo/…/EquipoPage.tsx`,
`mi-dia/…/MiDiaPage.tsx`, `pipeline/…/ClientDetailPage.tsx`, `pipeline/…/components/DealCard.tsx`,
`reports/…/ReportsPage.tsx`, `sales/…/SalesPage.tsx`, `tasks/…/components/TaskCard.tsx`

> Recordatorio de reglas del proyecto: `frontend/src/modules/**` (9 archivos, 22 usos) no lo edita
> el Líder — va por Implementer.
