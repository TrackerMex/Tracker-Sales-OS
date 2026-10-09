# Impl 81 / plan 010: Agenda, Actividades y Ventas

Estado: DONE, sin commit (los cambios quedan en el working tree), pendiente de review.
Rama `81-visual-redesign`, base `55b22e1`. Solo se tocó markup y clases. No cambió lógica, validación, schemas, hooks ni API.

## Archivos tocados

### Agenda (`frontend/src/modules/tasks/presentation/`)

- **`pages/AgendaPage.tsx`**
  - `PageHeader` "Agenda" / "Compromisos comerciales". Las acciones son: Select de vendedor (solo en calendario para A/D, con `aria-label`), Tabs Lista/Calendario y CTA "Crear tarea".
  - El contenido va en bento con `SectionCard`, con dos vistas:
    - "Tareas": lista `divide-y`, Skeleton `role="status"` y `EmptyState` con CTA.
    - "Calendario": contiene `CalendarView`.
- **`components/TaskCard.tsx`**
  - Pasa a ser una fila sin `.card`. El tipo se muestra con `Badge outline` y los estados con `StatusBadge` ("Vencida" / "Completada").
  - Iconos de 14px. La línea IA va en muted con la etiqueta en foreground. "Completar" usa la variante default.
  - Se mantiene el re-export de `TYPE_TAG`, porque lo usa MiDia.
- **`components/CalendarView.tsx`**
  - Tokens en lugar de hex y `text-xs` / `text-sm` en lugar de `text-[Npx]`.
  - Grids con `gap-px border bg-border`.
  - El chip codifica el tipo con un acento `border-l-*` (primary / chart-2 / chart-4) sobre texto foreground.
  - HoverCard en estilo Lyra: Badge outline/secondary y `StatusBadge` para el estado.
  - Las flechas de navegación son `ChevronLeftIcon` / `ChevronRightIcon`.
  - Las etiquetas de semana y día usan `min-w-0 sm:min-w-[...]` para que no haya overflow a 390px.
- **`components/CreateTaskForm.tsx`**
  - Dialog con el patrón del template: header con borde, `FormErrorSummary` en un wrapper y footer con submit `size="lg"`.
  - Dos secciones: "Tarea" y "Apoyo" (accordion de agenda ocupada, coach y Outlook).
  - Los labels ahora son `Label` con `htmlFor` (`task-*`). Se quitó `variant="success"`.
- **`components/EditTaskForm.tsx`**
  - Mismo patrón, con las secciones "Tarea" y "Resultado" e ids `edit-task-*`.
  - El resultado de una tarea completada se muestra como texto muted.

### Actividades (`frontend/src/modules/activities/presentation/`)

- **`pages/ActivitiesPage.tsx`**
  - `PageHeader` "Registrar actividad", con una pill `StatusBadge` "`{n} / DAILY_MIN_POINTS` pts" (success o neutral).
  - El progreso del día va en un `StatCard`, con barra `h-1.5 rounded-full bg-foreground/10` y relleno `STATUS_FILL_CLASS[tone]`.
  - El formulario va en el bento. La lista del día es un `SectionCard` con `ul.divide-y`, Skeleton y `EmptyState`. El estado se muestra con `StatusBadge`.
  - `pct` ahora usa `DAILY_MIN_POINTS` en vez de 30 literal. Es el mismo valor.
- **`components/ActivityForm.tsx`**
  - Secciones: Contexto, Actividad, Resumen, "Siguiente paso requerido" y Coach IA.
  - `.slabel` pasa a `Label` con `htmlFor` (`activity-*`).
  - El `<p className="text-red-500">` de `clientError` pasa a `FieldError`.
  - El color de calidad pasa de hex a `StatusTone` + `STATUS_FILL_CLASS`.
  - Submit `size="lg"` con la variante default.
- **`components/ActivityHistoryModal.tsx`**
  - Dialog Lyra con header con borde y secciones "Estado actual" e historial, separadas en bento `gap-px`.
  - Las transiciones se muestran con `StatusBadge` (vieja y nueva, con "a" sr-only entre ambas). Skeleton al cargar.
  - Se quitaron `Card` y el mapa local `STATUS_VARIANTS`.

### Ventas (`frontend/src/modules/sales/presentation/`)

- **`pages/SalesPage.tsx`**
  - `PageHeader` "Ventas". El CTA "Registrar venta" enfoca el primer campo del formulario visible: `sale-client` para Seller o `sale-dir-project` para A/D.
  - Se quitó el `p-6` propio y todo va en el bento `grid-cols-12 gap-px bg-border p-px`.
  - **Seller**: un `<form>` con header y dos secciones en `xl:grid-cols-2`:
    - "Venta": Cliente, Producto, Unidades y Monto.
    - "Pago y origen": Fecha, Pago, Fuente y Notas.
  - **A/D**: Dirección y ATC son dos `<form>` lado a lado en `xl:grid-cols-2`. Ya no hay panel navy (`bg-tracker-dark`).
  - La lógica de `directionSellerId` / "Dirección Comercial" sigue intacta (feature 74).
  - Las 4 cifras van como `StatCard`, en `col-span-12 sm:col-span-6 xl:col-span-3`.
  - La lista es un `DataTable` con estas columnas:
    - Cliente (+ producto).
    - Fecha.
    - Unidades.
    - Tipo: `StatusBadge` del clientType + Badge outline del type.
    - Pago: `StatusBadge`.
    - Monto: `text-foreground font-medium tabular-nums`.
    - Menú `…` (solo A/D), que conserva el `AlertDialog` de borrado.
  - Debajo de md, Fecha y Unidades se ocultan y pasan a la línea muted de Cliente; Tipo se oculta debajo de lg y Pago debajo de sm. Así Monto y el menú caben a 390px.
  - El `formatCurrency` local se sustituyó por `@/shared/lib/format`.
  - Ya no hay `variant="success"`, `Card` ni `cn`.
- **`components/EditSaleModal.tsx`**
  - Dialog con el patrón de formulario: header con borde, secciones "Venta" y "Pago y origen" (o "Notas" si la venta no es seller), `Label` con `htmlFor` (`edit-sale-*`) y footer con Cancelar y Guardar.
  - Se quitó `DialogFooter`.
- **`components/SaleFormBase.tsx`**: borrado. `rg -n "SaleFormBase" frontend/src` solo encontraba su propia definición.

### Shared permitido

- **`frontend/src/shared/components/forms/DatePickerField.tsx`**: el trigger tiene el mismo look que el Input Lyra (`h-8`, `rounded-md`, `border-input`, `text-xs`, foco `border-primary`, `aria-invalid`). Las props no cambian.
- **`frontend/src/shared/components/forms/TimePickerField.tsx`**: el wrapper tiene el mismo look Lyra (`focus-within:border-primary`, `aria-invalid`). Las props no cambian.

### Docs

- **`plans/README.md`**: la fila 010 queda como `DONE (sin commit; pendiente review)`.

## Gates

Se ejecutaron desde `frontend/` con `pnpm run typecheck && pnpm run lint && pnpm run build`. Los tres terminan con exit 0.

```
> frontend@0.0.1 typecheck
> tsc --noEmit
(sin salida)

> frontend@0.0.1 lint
> eslint .
(sin salida)

> frontend@0.0.1 build
> tsc -b && vite build
✓ 4282 modules transformed.
dist/assets/index-CJaGsLEZ.js   493.02 kB │ gzip: 134.39 kB
[INEFFECTIVE_DYNAMIC_IMPORT] ... adapter.js is dynamically imported by CalendarView.tsx but also statically imported by ... DealCard.tsx, KanbanColumn.tsx ...
✓ built in 2.17s
gates exit 0
```

El aviso `INEFFECTIVE_DYNAMIC_IMPORT` ya existía (aparece en impl 006/007) y no se tocó.

## rg (Done)

```
$ rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales
(sin resultados, exit 1)

$ rg -n "\bslabel\b|\bcard\b|\bkl\b|\bprog\b|\blog-card\b|\bai-box\b|\bempty-state\b|variant=\"success\"" frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales
frontend/src/modules/tasks/presentation/components/TaskCard.tsx:234:export { TYPE_TAG } from "./task-card.constants"
frontend/src/modules/tasks/presentation/components/CalendarView.tsx:6:} from "@/components/ui/hover-card"
```

Las dos coincidencias son rutas de import (`task-card.constants`, `hover-card`), no `className`. En `className` quedan 0.

`SaleFormBase.tsx` está borrado.

## Verificación visual (solo http://localhost:3001)

Hice capturas con Playwright en `/agenda` (lista y calendario), `/actividades/nueva` y `/ventas`, como `admin` y `seller1`, a 1440 y 390.

- En las 12 combinaciones (más la vista calendario) hay un solo h1 y overflow horizontal 0.
- No hubo errores de consola ni `pageerror`.
- El modal de editar venta abre desde el menú `…`.

Las capturas están en el scratchpad de la sesión (`impl010/shots`).

## Decisiones

- **`TYPE_TAG`**: se mantiene en `task-card.constants` porque MiDia lo usa. En TaskCard y en el HoverCard el tipo se muestra con `Badge outline` neutro, porque no es un estado.
- **Chip del calendario**: codifica el tipo con un acento `border-l-*` y texto foreground, para cumplir AA. Las completadas usan muted + `line-through` en lugar de opacidad, y lo mismo vale para TaskCard: se quitó su `opacity-50`, y "Completada" ya lo comunica el `StatusBadge`.
- **Estados**: todos los estados pasan por `StatusBadge` / `shared/lib/status`.
  - "Cancelada" ahora es danger (antes gris).
  - En Ventas, el pago y el clientType usan los tonos existentes: Pagado/Nuevo success, Crédito/Pendiente pending, 50% anticipo progress, Existente neutral.
- **Columna Pago**: es nueva en la lista de ventas. Antes el pago no se veía, y `StatusBadge` ya tiene mapeo para él. El `type` (seller/atc/direction) se muestra con el mismo texto que antes, en Badge outline.
- **`clientError || fieldErrors.clientId`**: en ActivityForm se juntan en un solo `FieldError` para no duplicar el id. Es solo markup; la validación es la misma.
- **Labels de DatePicker y TimePicker**: van sin `htmlFor`, porque la regla de "mismas props" impide añadirles `id`. El DatePicker va en un `div.mt-2`.
- **Moneda**: `formatCurrency` compartido no muestra decimales, mientras que el local mostraba centavos. El cambio lo pide el plan.
- **CTA de Ventas**: los formularios ya están siempre visibles, así que el CTA solo enfoca el primer campo, sin estado nuevo. El foco hace scroll solo.
- **Columnas responsive**: el `DataTable` de ventas oculta columnas secundarias en móvil, igual que ClientesPage.
- **Headings**:
  - En formularios se usa h5 por sección, igual que el template y que 008/009.
  - En Ventas cada formulario lleva un h2 ("Registrar venta del día", "Ventas Dirección", "Registrar ATC").
  - EditSaleModal: el título es `DialogTitle`, con secciones en h5.

## Pendiente Líder

1. **`frontend/src/shared/components/forms/ClientCombobox.tsx`** (líneas ~91-95): el trigger sigue usando las clases legacy `input` / `input-error`. Se ve más alto y con fondo muted, distinto del Input Lyra, en Ventas (seller), CreateTaskForm, EditTaskForm y ActivityForm. No estaba en los archivos permitidos.
   - **Cambio propuesto**: usar las clases del trigger de DatePickerField:
     ```
     flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-left text-xs transition-colors outline-none focus-visible:border-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
     ```
   - Quitar `input-error`, porque `aria-invalid={error}` ya está, y quitar el `opacity-50` manual.
2. **`frontend/src/components/ui/badge-variants.ts`**: las variantes legacy `green`, `amber`, `yellow`, `purple` y `blue` no pasan AA. `gray` queda justo, con 4.35 en claro. `TYPE_TAG` de MiDia todavía las usa.
   - **Cambio propuesto**:

     | Variante | Clases |
     |---|---|
     | green | `bg-chart-2/10 text-status-success` |
     | amber / yellow | `bg-chart-4/15 text-foreground` |
     | purple / blue | `bg-chart-1/10 text-status-progress` |
     | gray (opcional) | `bg-muted text-foreground` |

   - Otra opción es migrar `TYPE_TAG` a `outline` en plan 011/012.
3. **`frontend/src/components/ui/button-variants.ts`**: el alias `success` sigue existiendo. Ya no tiene usos en tasks, activities ni sales. Su eliminación está prevista en plan 012.

## Fixes Líder

Pendientes 1 y 2 aplicados. Después lint y build salen con exit 0.

- **`shared/components/forms/ClientCombobox.tsx`**
  - El trigger usa ahora las mismas clases que el trigger de DatePickerField.
  - Ya no usa `input`, `input-error` ni el `opacity-50` manual.
  - `aria-invalid` y `disabled:` cubren los estados.
- **`components/ui/badge-variants.ts`**: variantes legacy con AA.

  | Variante | Clases |
  |---|---|
  | green | `bg-chart-2/10 text-status-success` |
  | amber, yellow | `bg-chart-4/15 text-foreground` |
  | purple, blue | `bg-chart-1/10 text-status-progress` |
  | gray | `bg-muted text-foreground` (cubre N7 Badge gris del plan 012) |

- **Pendiente 3**: el alias `success` de Button se queda para el plan 012.

## Ajuste del Líder tras la review

- **M1.** En `.dark`, `--status-success` deja de usar `var(--chart-2)` y pasa a `oklch(0.65 0.118 184.704)`, que da 5.20 sobre card y popover.
- **M2.** `shared/lib/format.ts` `formatCurrency` muestra 2 decimales solo cuando el valor tiene centavos. Las cifras enteras (KPIs, totales) se quedan igual que estaban.
- **M3, N3, N4, N5, N7 y N11** quedan como paso 8 del plan 012.
- **M4** (al pulsar una tarea del calendario se abren a la vez "Editar" y "Crear") es lógica que ya estaba en la base. Se ofrece al usuario como arreglo aparte.
