# Impl 73 — Migración HugeIcons → reicon-react

**Fecha:** 2026-07-16 · **Rama:** `review-ui` · **Estrategia:** wrapper propio (`frontend/src/shared/components/Icon.tsx`)

## Resumen

| Métrica | Valor |
|---|---|
| Archivos migrados | **24** |
| Instancias `<HugeiconsIcon/>` sustituidas | **52** |
| Iconos distintos mapeados | **23** |
| Archivos que importan `reicon-react` | **1** (solo el wrapper) |
| `rg '@hugeicons' frontend/src` | **0 coincidencias** |
| Dependencias eliminadas | `@hugeicons/react`, `@hugeicons/core-free-icons` |
| Dependencias añadidas | ninguna (`reicon-react@^1.1.301` ya estaba en `package.json`) |
| typecheck / lint / build | ✅ / ✅ / ✅ |

El wrapper es el **único punto de acoplamiento** con `reicon-react`. Cambiar de librería, o
cambiar el glifo de cualquier icono, es una edición de `Icon.tsx` y de ningún otro archivo.

## 1. Tabla de mapeo (23 iconos)

`strokeWidth` se fija **por icono** en el wrapper; los call-sites ya no lo pasan.
Objetivo: replicar el grosor efectivo **2.0** que daba HugeIcons con `strokeWidth={2}`.

| HugeIcons | Export del wrapper | Componente reicon | strokeWidth | Por qué |
|---|---|---|---|---|
| `ArrowDown01Icon` | `ChevronDownIcon` | `ChevronDown` | — | Escalado ×1.33: su base 1.5 ya rinde **2.0**. Pasar 2 daría 2.67 |
| `ArrowUp01Icon` | `ChevronUpIcon` | `ChevronUp` | — | Ídem |
| `ArrowLeft01Icon` | `ChevronLeftIcon` | `ChevronLeft` | — | Ídem |
| `ArrowRight01Icon` | `ChevronRightIcon` | `ChevronRight` | — | Ídem |
| `UnfoldMoreIcon` | `UnfoldMoreIcon` | `ChevronExpandY` | — | Ídem. Coincidencia exacta (doble chevron) |
| `Cancel01Icon` | `CloseIcon` | `Xmark` | — | Ídem |
| `OfficeIcon` | `BuildingIcon` | `Office` | — | Ídem |
| `ViewIcon` | `EyeIcon` | `EyeOpen` | — | Ídem |
| `SidebarLeftIcon` | `SidebarToggleIcon` | `SidebarLeft` | `2` | Stroke sin escalar: base 1.5 → hay que subir a 2 |
| `PencilEdit02Icon` | `EditIcon` | `Edit2` | `2` | Ídem |
| `CheckmarkCircle02Icon` | `CheckCircleIcon` | `TickCircle` | `2` | Ídem |
| `ArrowReloadHorizontalIcon` | `ReloadIcon` | `Repeat3` | `2` | Ídem |
| `PlusSignIcon` | `PlusIcon` | `Add` | `2` | Ídem |
| `Search01Icon` | `SearchIcon` | `SearchNormal` | `2` | Ídem |
| `Calendar01Icon` | `CalendarIcon` | `Calendar3` | `2` | Ídem |
| `FolderIcon` | `FolderIcon` | `Folder4` | `2` | Ídem |
| `User02Icon` | `UserIcon` | `User4` | `2` | Ídem |
| `Tick02Icon` | `CheckIcon` | `Check` | — | **Fill**: `strokeWidth` es no-op, grosor ~1.5 horneado en el path |
| `Delete02Icon` | `TrashIcon` | `Trash` | — | Fill: no-op |
| `LogoutIcon` | `LogoutIcon` | `Logout` | — | Fill: no-op |
| `MoreHorizontalCircle01Icon` | `MoreHorizontalIcon` | **`MoreH`** | — | Fill: no-op. **No `MoreHCircle`**: ese sí lleva aro; el original no |
| `ArrowRightIcon` | `ArrowRightIcon` | `ArrowRight` | — | Fill: no-op. Flecha con cola, distinta de `ChevronRightIcon` |
| `CheckListIcon` | `ChecklistIcon` | `Checklist` | — | Fill: no-op |

Los 23 nombres se verificaron contra `index.d.ts` **y** la existencia de `icons/<Name>.js`.
La clasificación escalado/stroke/fill se verificó contra el código real de cada icono
(`grep 'scale(1.33333)'` y `grep 'stroke-width'`), no contra la documentación.

## 2. Archivos tocados (24) e instancias por archivo

### Primitivas `components/ui/` — 10 archivos, 17 instancias
| Archivo | Inst. |
|---|---:|
| `frontend/src/components/ui/select.tsx` | 4 |
| `frontend/src/components/ui/dropdown-menu.tsx` | 3 |
| `frontend/src/components/ui/accordion.tsx` | 2 |
| `frontend/src/components/ui/breadcrumb.tsx` | 2 |
| `frontend/src/components/ui/calendar.tsx` | 1 |
| `frontend/src/components/ui/checkbox.tsx` | 1 |
| `frontend/src/components/ui/command.tsx` | 1 |
| `frontend/src/components/ui/dialog.tsx` | 1 |
| `frontend/src/components/ui/sheet.tsx` | 1 |
| `frontend/src/components/ui/sidebar.tsx` | 1 |

### Navegación — 3 archivos, 9 instancias
| Archivo | Inst. |
|---|---:|
| `frontend/src/components/nav-projects.tsx` | 5 |
| `frontend/src/components/nav-user.tsx` | 2 |
| `frontend/src/components/team-switcher.tsx` | 2 |

### Forms compartidos — 2 archivos, 4 instancias
| Archivo | Inst. |
|---|---:|
| `frontend/src/shared/components/forms/ClientCombobox.tsx` | 3 |
| `frontend/src/shared/components/forms/DatePickerField.tsx` | 1 |

### Módulos — 9 archivos, 22 instancias
| Archivo | Inst. |
|---|---:|
| `frontend/src/modules/tasks/presentation/components/TaskCard.tsx` | 8 |
| `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx` | 4 |
| `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx` | 3 |
| `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx` | 2 |
| `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx` | 1 |
| `frontend/src/modules/pipeline/presentation/components/DealCard.tsx` | 1 |
| `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx` | 1 |
| `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx` | 1 |
| `frontend/src/modules/sales/presentation/pages/SalesPage.tsx` | 1 |

**Total: 24 archivos · 52 instancias.**

Archivo nuevo: `frontend/src/shared/components/Icon.tsx` (wrapper).

### Fuera de alcance (confirmado, no tocado)
- `frontend/src/shared/navigation/nav-items.tsx` — los 11 iconos del sidebar son SVG inline a mano.
- `frontend/src/modules/auth/presentation/pages/LoginPage.tsx:26-41` — `CheckIcon` local con color de marca `#82bc00`.

## 3. Verificación

Los cuatro comandos se corrieron con **pnpm** en `frontend/`.

```
===== pnpm install --frozen-lockfile =====
Done in 2.9s using pnpm v10.33.4
(sin drift: el lockfile ya refleja la eliminación de @hugeicons/*)

===== pnpm run typecheck =====
> frontend@0.0.1 typecheck C:\Users\alex\Documents\sites\Tracker-Sales-OS\frontend
> tsc --noEmit
(sin salida: 0 errores)

===== pnpm run lint =====
> frontend@0.0.1 lint C:\Users\alex\Documents\sites\Tracker-Sales-OS\frontend
> eslint .
(sin salida: 0 errores, 0 warnings — no se desactivó ninguna regla)

===== pnpm run build =====
> tsc -b && vite build
vite v8.0.16 building client environment for production...
✓ 4266 modules transformed.
dist/index.html                            1.52 kB │ gzip:   0.66 kB
dist/assets/index-BCahpFWB.css           149.77 kB │ gzip:  26.18 kB
dist/assets/rolldown-runtime-QTnfLwEv.js   0.69 kB │ gzip:   0.42 kB
dist/assets/router-steWWOtW.js           132.58 kB │ gzip:  41.31 kB
dist/assets/charts-D7xOfpn_.js           189.24 kB │ gzip:  65.03 kB
dist/assets/vendor-ASGPosrW.js           441.31 kB │ gzip: 137.47 kB
dist/assets/index-BS9t5bhQ.js            482.70 kB │ gzip: 131.55 kB
[INEFFECTIVE_DYNAMIC_IMPORT] pragmatic-drag-and-drop ... (preexistente, ajeno a iconos)
✓ built in 1.62s
```

### Verificación de render (no solo compilación)

Se transpiló el `Icon.tsx` **real** y se renderizó con `react-dom/server` sobre los call-sites
de mayor riesgo del inventario:

| Call-site | class emitida | style inline | Resultado |
|---|---|---|---|
| `select.tsx:49` (`text-muted-foreground`) | `reicon pointer-events-none size-4 text-muted-foreground` | **ninguno** | R6 resuelto: Tailwind manda |
| `nav-projects.tsx:79` (`text-sidebar-foreground/70`) | `reicon text-sidebar-foreground/70` | **ninguno** | R6 resuelto |
| `accordion.tsx:56` (`data-slot`) | clase de grupo intacta | ninguno | R1 resuelto: `data-slot` llega al `<svg>` |
| `sidebar.tsx:252` (sin clase) | `reicon` | ninguno | R4 resuelto: `reicon` no contiene `size-` ⇒ `:not([class*='size-'])` matchea y hereda `size-4` |
| `TaskCard.tsx:121` (`color="#334155"`) | `reicon` | `color:#334155` | color hex preservado |
| `checkbox.tsx:25` | `reicon size-3` | ninguno | fill, sin `stroke-width` (ver riesgos) |

Grosores medidos en el render: escalados `stroke-width=1.5` (≡ 2.0 efectivo), sin escalar
`stroke-width=2`, fill sin `stroke-width`. Coincide con el diseño.

### Tree-shaking verificado

Del bundle de producción: `scale(1.33333)` aparece **16** veces = 8 iconos escalados × 2 pesos
(O/F). La librería tiene 154 escalados ⇒ solo entran los nuestros. Los iconos no usados
(`Accessibility`, `Airplane`, `Buildings`) y los tres iconos-trampa (`MoreHCircle`, `ListCheck`,
`Check3`) están **ausentes** del bundle, lo que confirma además que ninguno se coló por error.

## 4. Riesgos visuales asumidos

Ninguno rompe el build; todos son cambios de dibujo/grosor. **Cambiar cualquiera de ellos es
una línea en `frontend/src/shared/components/Icon.tsx`** — los 24 call-sites no se tocan.

### 4.1 El tick del checkbox queda más fino (regresión conocida y aceptada)
`checkbox.tsx:25` pasaba `strokeWidth={3}` (el único 3 del repo). `Check` de reicon es **fill**:
`strokeWidth` es un no-op y el grosor (~1.5) está horneado en el path. El tick se verá
notablemente más fino que antes. No existe **ningún** checkmark stroke sin contenedor en reicon
(`Check3` no es un check; todos los `*Tick` stroke traen círculo/cuadrado).
*Si molesta:* la salida limpia es un SVG local de 1 path, no otro icono de la librería.

### 4.2 Mezcla de grosores 2.0 / ~1.5 en toda la app
Con HugeIcons **todos** los iconos rendían a 2.0. Con reicon los 17 stroke quedan en 2.0 y los
6 fill (`Check`, `Trash`, `Logout`, `MoreH`, `ArrowRight`, `Checklist`) en ~1.5. **Es geometría
del path: no se puede igualar.** Donde más puede cantar es en `select.tsx`, que muestra el
chevron (2.0) y el tick (1.5) juntos.

### 4.3 Los cuatro mapeos dudosos
| Icono | Diferencia respecto al original | Línea a tocar |
|---|---|---|
| `ChecklistIcon` (`Checklist`) | **Trae una caja redondeada envolvente** que el original no tenía (Huge = 3 líneas + 2 ticks, sin contenedor). El mapeo de menor confianza. Alternativas: `ChecklistAlt`, `CheckListSquare` (también con caja), `Task`. Ninguna reproduce "líneas + ticks sin caja" | `createIcon(Checklist, "ChecklistIcon")` |
| `BuildingIcon` (`Office`) | **Dos edificios** vs **uno** en el original. Misma semántica "empresa", distinta silueta. Alternativa si se quiere un solo edificio: `Building2` (stroke ⇒ requeriría `strokeWidth={2}`) | `createIcon(Office, "BuildingIcon")` |
| `SidebarToggleIcon` (`SidebarLeft`) | Trae **un chevron** donde el original tenía **2 guiones**. Se usa en el botón de colapsar, así que el chevron hasta encaja mejor, pero **cambia el dibujo** | `createIcon(SidebarLeft, "SidebarToggleIcon", 2)` |
| `CheckIcon` (`Check`) | Es **fill**, no stroke (ver 4.1) | `createIcon(Check, "CheckIcon")` |

### 4.4 Cambio de estilo de los chevrons
Los chevrons de HugeIcons eran curvos (bezier); los de reicon son polilíneas rectas. Semántica
idéntica, trazo más anguloso. Afecta a 12 instancias (select, accordion, dropdown, breadcrumb,
calendar). No es un defecto, es el estilo de la librería nueva.

### 4.5 Pendiente de ojo humano
El smoke autenticado del CHECKPOINT (Login, sidebar, Clientes, Pipeline, Mi Día, Actividades,
Tareas/Agenda, Reportes, Equipo, Ventas) **no se ha ejecutado**: requiere navegador con sesión.
Los puntos 4.1–4.4 son juicios de geometría leída, no de píxeles vistos.

## 5. Desviaciones del prompt

### 5.1 El wrapper sí acepta `color` (el prompt pedía `style={{ color: undefined }}` siempre)
Aplicar `style={{color: undefined}}` de forma incondicional **habría roto los 7 call-sites de
módulos que pasan un color hex** (`TaskCard.tsx:121` `#334155`, `:146` `#94A3B8`;
`MiDiaPage.tsx:538` `#334155`, `:549` `#64748B`; `ActivitiesPage.tsx:158` `#002B49`, `:169`
`#64748B`, `:180` `#4338CA`), porque en reicon el prop `color` **se implementa vía `style.color`**
(`createIcon.js:45`), justo la propiedad que se estaba anulando.

Solución: el wrapper intercepta `color` y lo reenvía como `style={{ color, ...style }}`, sin
pasar nunca `color` a reicon. El efecto pedido se conserva íntegro:
- sin `color` → `{color: undefined}` → **el atributo `style` desaparece** → Tailwind manda (verificado).
- con `color="#334155"` → `style="color:#334155"` → color preservado (verificado).

### 5.2 Los call-sites con `color="currentColor"` sí perdieron el prop (7 instancias)
`currentColor` es el default y significa "hereda", así que pasarlo era un no-op **en HugeIcons**
(emitía un atributo `color`, y las clases CSS ganan a los atributos de presentación). En reicon
**no sería un no-op**: emitiría `style="color:currentColor"` inline, que **gana a las clases**.

El caso que lo hace obligatorio: `TaskCard.tsx:245` (`Delete02Icon color="currentColor"`) vive en
un `DropdownMenuItem variant="destructive"`, cuyo `data-[variant=destructive]:*:[svg]:text-destructive`
colorea el `<svg>` **por clase**. Conservar `color="currentColor"` habría **perdido el rojo**.
Al quitarlo, el render coincide con el actual. Mismo razonamiento en las otras 6.

### 5.3 Los `size` numéricos se conservan tal cual
En reicon, `size` emite `width`/`height` como atributos, exactamente igual que HugeIcons ⇒
conservarlos es 1:1 real. Se mantienen los 12 (`size={11|12|13}`), incluidos los 6 que hoy ya
están anulados por CSS del padre (R7 del inventario): siguen anulados igual, sin cambio visual.

### 5.4 `calendar.tsx` pasa de ternario-sobre-prop a ternario-sobre-componente
El original elegía el icono como **dato** (`icon={orientation === "left" ? A : B}`). Con named
exports el icono es un **componente**, así que se asigna a una variable y se renderiza:
`const ChevronIcon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon`. Comportamiento
idéntico; `chevronProps.className` se sigue mezclando con `cn("size-4", …)` igual que antes.

### 5.5 `strokeWidth` no se expone en el tipo público
`IconProps` del wrapper es `Omit<ReiconIconProps, "strokeWidth">`. El grosor correcto depende de
si el icono está escalado —algo que el call-site no puede saber—, así que el wrapper lo posee en
exclusiva y el compilador impide reintroducir el error.
