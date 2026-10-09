# Review 81-010: Agenda, Actividades y Ventas

**Veredicto: PASSED.** Hay 0 bloqueantes, 4 menores y 12 notas.

Todo lo que pide el plan cumple:
- scope;
- los dos rg de done criteria (0 en `className`);
- `SaleFormBase.tsx` borrado y sin referencias;
- 0 `variant="success"` y 0 `text-chart-*` en los 3 módulos, `shared/components/forms` y `badge-variants.ts`;
- gates;
- lógica intacta, incluido el seller interno "Dirección Comercial" (feature 74);
- un h1 por página;
- overflow 0 en 1440 y 390;
- FieldError pasa AA en todas las superficies nuevas, así que se cierran los fallos legacy 3.89 y 2.89 de 009 (N8);
- 0 errores de consola.

Los cuatro menores no bloquean:
- M1 es un token compartido (`--status-success` en oscuro) que no llega a 4.5 sobre `popover`/`card`.
- M2 es una decisión del plan: la moneda sin decimales redondea centavos que el backend sí guarda.
- M3 es la falta de nombre accesible de DatePicker y TimePicker. Ya estaba en base, y el plan prohibía cambiar sus props.
- M4 es un bug de lógica que ya estaba en base: al hacer click (o Enter) en una tarea del calendario se abren dos diálogos.

Evidencias en `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/review010/` (en adelante `R/`):
- `logic.cjs`: comparador AST de base contra actual, que ignora atributos de presentación. Las fuentes de base están en `R/orig/`.
- `live.cjs`: auditoría de 8 sesiones (admin y seller1; 1440 y 390; claro y oscuro) de `/agenda`, `/actividades/nueva`, `/ventas` y `/mi-dia`. Resultados en `R/report-admin.json` y `R/report-seller.json`, resumidos con `R/sum.cjs`.
- `chipfocus.cjs`: anillo de foco de la tarea del calendario medido completo, y clase del contacto de Mi día.
- `cr.cjs`: cálculo OKLCH de los tonos de estado sobre `popover` en oscuro, y propuesta de valor para M1.
- Logs de gates: `R/gate-*.log` y `R/gates.txt`. Salida de rg: `R/rg.txt`.
- Capturas (112): `progress/redesign/phase-010/review/`.

Todas las sesiones son de solo lectura. Cada petición no-GET a `/api` se responde en el navegador de prueba:
- un 400 falso con mensajes por campo para `POST /api/tasks` y `POST /api/sales`, para ver FieldError y FormErrorSummary;
- un 418 para el resto.

Solo pasa el login real. Los textos escritos ("Review 81 … (no se guarda)") nunca salen del navegador. No hubo drag. Edit y Delete de venta se abrieron y se cancelaron.

## Criterios

| Criterio | Resultado | Evidencia |
|---|---|---|
| Scope | PASS | Solo cambia `presentation/` de tasks, activities y sales (11 archivos y el borrado de `SaleFormBase.tsx`), más `DatePickerField`, `TimePickerField`, `ClientCombobox` y `badge-variants.ts` ("Fixes Líder"). `FieldError` y `FormErrorSummary` traen cambios de 009. |
| Diff vacío en application, domain e infrastructure de los 3 módulos | PASS | `git diff --stat 55b22e1`: 0 líneas. Backend: solo `main.ts` (`HOST`, de 006). |
| Sin cambios de lógica | PASS | ver el detalle bajo la tabla |
| Feature 74: "Dirección Comercial" | PASS | `SalesPage.tsx:80` (`DIRECTION_SELLER_NAME`), `:105`, `:196-203` y `:231-238` sin cambios. En vivo, admin envía Dirección y ATC con `sellerId=8e707649…`, el seller interno. No aparece el toast "aún no está disponible". |
| rg de hex, `tracker-`, `text-slate-` y `text-[Npx]` | PASS (0) | ver la salida de rg |
| rg de `slabel`, `card`, `kl`, `prog`, `log-card`, `ai-box`, `empty-state` y `variant="success"` | PASS (0 en `className`) | Solo hay 2 coincidencias, ambas en imports o exports: `TaskCard.tsx:234` y `CalendarView.tsx:6` |
| `SaleFormBase.tsx` borrado | PASS | `rg SaleFormBase` da 0. `git status` da `D`. |
| `text-chart-*` en texto | PASS (0) | 3 módulos, `shared/components/forms` y `badge-variants.ts` |
| Gates `typecheck`, `lint` y `build` | PASS | exit 0 en los tres. `build` muestra un aviso `INEFFECTIVE_DYNAMIC_IMPORT` de `@atlaskit` que ya existía. |
| Desviación: columna Pago | Aceptada | `StatusBadge` ya mapea `pay`. Es información útil que antes no se veía, y no es lógica. Contrastes: Pagado 4.74/4.96, 50 % anticipo 6.43/5.13, Crédito y Pendiente 18.21/14.57. |
| Desviación: moneda sin decimales | Aceptada con riesgo | M2 |
| Desviación: el CTA de Ventas solo enfoca | Aceptada | Los formularios están siempre visibles y en el viewport (`scrollY` 0 a 1440 y 390). Para A/D, `sale-dir-project` recibe el foco con `:focus-visible` y borde primary. Para seller, el foco llega pero no se ve (N2). |
| Desviación: Labels de DatePicker y TimePicker sin `htmlFor` | Aceptada para esta fase | M3. En base ni siquiera había label visible (`CreateTaskForm.tsx` base, `:309-320`). |
| Un h1 por página | PASS | "Agenda", "Registrar actividad", "Ventas" y "Mi día", en las 8 sesiones |
| Overflow horizontal | PASS (0) | `scrollWidth - clientWidth = 0` en todas las vistas. Los diálogos tienen `innerScrollX` 0. La tabla de Ventas a 390 hace scroll dentro de su contenedor (N6). |
| Contraste AA | PASS, salvo M1 | ver la tabla de contraste |
| Labels asociados | PASS, salvo M3 | ver el detalle bajo la tabla |
| Foco visible | PASS | ver el detalle bajo la tabla |
| HoverCard por teclado | PASS | Se llega con Tab y abre con el foco (Radix `onFocus`). Esc la cierra. |
| Dialogs por teclado | PASS | Crear y editar tarea, editar venta, borrar venta e historial de actividad: 0 salidas de foco en el trap, se cierran con Esc o Cancelar y el radio es 0px (Lyra). El foco no vuelve al trigger al cerrar EditSaleModal (N8). |
| Foco tras un 400 | PASS | Va al primer campo inválido: `task-client` y `sale-client`. |
| Aspecto frente a la plantilla | PASS a ojo | ver el detalle bajo la tabla |
| Errores de consola y page errors | PASS (0) | 8 sesiones |

Detalle de algunas filas:
- **Lógica.** `R/logic.cjs` sobre los 11 archivos solo da diferencias de presentación:
  - Mapas hex sustituidos por tonos: `getPointsBarColor` pasa a `getPointsTone`, `qualityColor` pasa a `qualityTone`, `STATUS_*_VARIANTS` pasa a `StatusBadge` y `TYPE_TAG` del calendario pasa a `TYPE_ACCENT`. Los umbrales son los mismos (100/50 y 80/40).
  - `pct` usa `DAILY_MIN_POINTS` (30) en lugar de 30 fijo, como pide el plan.
  - El error local `clientError` se muestra ahora vía `FieldError`, como pide el plan.
  - La lista de ventas pasa a `columns` de DataTable, con los mismos campos.
  - Hay envoltorios condicionales nuevos de `FormErrorSummary`, que son solo padding.
  - El nuevo CTA de `EmptyState` (`AgendaPage.tsx:307-311`) usa el mismo handler que el CTA de cabecera (`:275-278`).
  - Hooks, mutaciones, payloads y validaciones no cambian.
- **Labels.** Tienen `htmlFor` e `id`:
  - tareas: `task-client`, `task-type`, `task-contact`, `task-objective` y `edit-task-description`;
  - actividades: `activity-*` y `clientId`;
  - ventas: `sale-*`, `sale-dir-*`, `sale-atc-*` y `edit-sale-*`.

  Los únicos controles sin nombre asociado son DatePicker y TimePicker (M3). Los `select` nativos ocultos de Radix (`aria-hidden`) quedan excluidos.
- **Foco visible.**
  - Inputs, selects, textareas, `ClientCombobox` y el trigger de DatePicker marcan el foco con `border-primary`, el primitivo Lyra, igual que en 009. TimePicker lo marca con `focus-within:border-primary`.
  - Botones y menús de fila usan el anillo de `button-variants`.
  - La tarea del calendario solo tiene un anillo de 1px `ring/50`, que es débil (N1).
- **Aspecto.** Revisado a ojo frente a `template/form-1440.png`, `tickets-1440.png` y `tables-1440.png`:
  - Ventas: bento de 2 columnas con `gap-px bg-border`, secciones con h5 `text-base font-semibold` y footer con borde.
  - StatCards de 4 en fila a 1440 y apiladas a 390.
  - DataTable con pills y menú `…`.
  - Actividades: StatCard con barra `h-1.5 rounded-full bg-foreground/10`, lista `divide-y` con pill de tipo, puntos y barra de calidad de 120px.
  - Agenda: lista `divide-y`. El calendario usa grid `gap-px` con hoy en `ring-primary` y tareas con acento `border-l-*`.
  - Los diálogos usan header y footer con borde y secciones en grid `xl:grid-cols-2`.
  - Todo es cuadrado, con radio 0 en cards y diálogos, en claro y en oscuro.

### Contraste en vivo (mínimo por superficie; texto 4.5:1)

| Superficie | Claro | Oscuro | Notas |
|---|---|---|---|
| Agenda: lista, calendario mes, semana y día | 4.35 | 5.86 | En claro, el 4.35 es del kbd "Ctrl K" y del avatar del shell (N12). El mínimo propio de 010 es 4.62. |
| Crear tarea (Dialog) | 4.62 | 6.03 | Los elementos deshabilitados quedan excluidos ("Selecciona primero una empresa"). |
| Editar tarea (Dialog) | 4.74 | 7.10 | |
| HoverCard del calendario | 4.74 | **4.39** | M1: "Completada" (success) sobre `popover` |
| Actividades: página, StatCard y lista | 4.35 (shell) | 5.86 | |
| Formulario de actividad | 4.74 | 7.10 | |
| Historial de actividad (Dialog) | 4.74 | 7.66 | |
| Ventas: página, StatCards y tabla | 4.35 (shell) | 4.96 | |
| Formularios Seller y A/D tras el 400 falso | 4.74 | 6.03 | |
| Editar venta (Dialog) | 4.74 | 7.66 | |
| AlertDialog "Eliminar venta" | 4.74 | 4.64 | El M1 de 009 (`button-variants` destructive) ya está corregido. |
| Mi día (TYPE_TAG vía `badge-variants`) | 4.34 | 4.96 | En claro, el 4.34 es el contacto de una tarea vencida en `MiDiaPage.tsx:626`, superficie de 008 (N11). |

Pills (claro / oscuro):

| Pill | Claro | Oscuro |
|---|---|---|
| Pagado, Nuevo, 250 % (success sobre background) | 4.74 | 4.96 |
| 50 % anticipo (progress) | 6.43 | 5.13 |
| Crédito, Pendiente, Atención (pending) | 18.21 | 14.57 |
| Existente, pill de puntos, TYPE_TAG Llamada (neutral/navy) | 14.50 | 12.93 |
| Badge outline de tipo (tabla y HoverCard) | 19.80 | 18.97 |
| Vencida en Agenda; 10 % en Mi día (danger) | 5.35 | 6.19 |
| Vencida en Mi día (sobre la fila `bg-destructive/5`) | 4.92 | 5.81 |
| TYPE_TAG Videoconferencia (Mi día) | 18.16 | 14.50 |
| "Completada" en HoverCard (success sobre `popover`) | 4.74 | **4.39** |

Cálculo OKLCH en oscuro sobre `popover` y `card` (0.205) con tinte del 10 % (`R/cr.cjs`): success 4.40, progress 4.53 (justo) y danger 5.46.

### FieldError y estados de error

| Superficie | Claro | Oscuro | Cómo |
|---|---|---|---|
| Crear tarea (5 FieldError reales tras el 400) | 4.77 | 6.85 | real |
| Editar tarea | 4.77 | 6.85 | inyectado (`p.mt-1.text-xs.text-destructive[data-inj]`, solo DOM) |
| Formulario de actividad (todas las secciones) | 4.77 | 6.85 | real (`clientId`) e inyectado |
| Ventas Seller (9 FieldError reales tras el 400) | 4.77 | 6.85 | real |
| Ventas Dirección y ATC | 4.77 | 6.85 | real |
| Editar venta | 4.77 | 6.85 | inyectado |
| FormErrorSummary (tarea y ventas) | 5.16 | 6.03 | real |

Los fallos legacy de 009 (3.89 en el panel navy de Ventas y 2.89 en la `.card` blanca de Actividades) desaparecen: las superficies ya son tokens.

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

**M1. El tono success en oscuro no llega a AA sobre `popover`/`card` (4.39:1).** Responsable: Líder.
- `frontend/src/index.css:138`: `.dark { --status-success: var(--chart-2); }` es oklch(0.6 0.118 184.7).
- Con `STATUS_BADGE_CLASS.success` (`bg-chart-2/10 text-status-success`, `shared/lib/status.ts:19`) sobre fondo 0.205 da 4.40. Sobre `background` (0.145) pasa con 4.96, que es lo que se vio en 008 y 009.
- Se ve en el StatusBadge "Completada" del HoverCard del calendario (`CalendarView.tsx:201-209`). Captura: `seller1-1440-dark-agenda-hovercard.png`.
- Afectará a cualquier pill success que caiga dentro de una `Card` o `Popover` en oscuro.
- **Arreglo mínimo:** en `.dark`, `--status-success: oklch(0.65 0.118 184.704);`. Da 5.20 sobre `popover` y 5.90 sobre `background`. No toca el tinte (`bg-chart-2/10`) ni el claro.
- Progress queda justo (4.53). Si se quiere margen, `--status-progress: oklch(0.68 0.2 41.116)`, pero es opcional.

**M2. La moneda sin decimales oculta centavos que el backend guarda.** Responsable: el Líder decide, el Implementer aplica.
- `shared/lib/format.ts:6-7` usa `minimumFractionDigits: 0` y `maximumFractionDigits: 0`. Ventas lo usa en la columna Monto (`SalesPage.tsx:327`) y en la StatCard "Monto total" (`:943`). Base mostraba 2 decimales (`SalesPage.tsx:81` de base).
- El backend acepta y guarda centavos:
  - `backend/src/modules/sales/application/dtos/create-sale.dto.ts:34` declara `@IsNumber() @Min(0) amount`, sin `maxDecimalPlaces`;
  - la columna es `decimal(15,2)` (`backend/src/modules/sales/infrastructure/entities/sale.typeorm.entity.ts:56`);
  - los inputs tienen `step="0.01"` (`SalesPage.tsx:500`, `:750` y `:869`; `EditSaleModal.tsx:164`).
- Una venta de 18,500.50 se muestra como "$18,501", y el total también se redondea. Hoy no hay datos con centavos (0 de 15 ventas de admin y 0 de 4 de seller1; máximo 189,000), así que el riesgo está latente.
- El plan pidió el cambio de formateador. La pérdida de precisión parece un efecto colateral, no una decisión.
- **Arreglo mínimo:** firma `formatCurrency(value: number, fractionDigits = 0)` en `format.ts`, usando `fractionDigits` en min y max (Líder, pieza compartida; el resto de usos no cambia). El Implementer pasa `2` en `SalesPage.tsx:327`. La StatCard puede quedarse en 0 como resumen.
- Otra opción: aceptar el redondeo y documentarlo en `DESIGN.md`, en la sección "Tabla".

**M3. DatePicker y TimePicker no tienen nombre accesible asociado a su Label.** Responsable: Líder (`shared/components/forms`) y después el Implementer.
- Hay 13 `Label` sin `htmlFor`:
  - `CreateTaskForm.tsx:331` y `:347`;
  - `EditTaskForm.tsx:250` y `:266`;
  - `EditSaleModal.tsx:106`;
  - `ActivityForm.tsx:548`, `:558`, `:572`, `:581`, `:750` y `:764`;
  - `SalesPage.tsx:529`, `:672` y `:820`.
- En vivo, el botón del DatePicker se anuncia solo con la fecha ("09/10/2026"), sin "Fecha". Los inputs de hora y minutos del TimePicker (`components/ui/time-picker.tsx:70`) no tienen nombre. Incumple WCAG 4.1.2 y 1.3.1.
- En base era igual o peor, porque no había label visible. El plan prohibía cambiar las props, así que la desviación es correcta para esta fase.
- **Arreglo mínimo:**
  1. Líder: `id?: string` en `DatePickerFieldProps` (`DatePickerField.tsx:13-20`), pasado al `<button>` (`:47`).
  2. Líder: en `TimePickerField.tsx`, `id?: string` y `role="group"` + `aria-labelledby={id ? `${id}-label` : undefined}` en el `div` (`:48-49`). Además, `aria-label="Hora"` y `aria-label="Minutos"` en los dos `TimePickerInput` (`:56`, `:66`), que ya propagan `...props` al `<input>`.
  3. Implementer: `htmlFor`/`id` en los 13 Labels. En los de hora, `id="<campo>-label"` en el `Label`.
- Puede ir como micro-fix ahora o en 012.

**M4. Al hacer click o Enter en una tarea del calendario se abren dos diálogos.** Responsable: Implementer, como micro-fix de lógica fuera de esta fase.
- El chip (`CalendarView.tsx:178`, `onClick={() => onEdit?.(task)}`) está dentro de `MonthDayCell`, que tiene `onClick={onDayClick}` (`:384`). El click burbujea y se abren "Editar tarea" y "Crear tarea con objetivo" a la vez.
- En vivo pasa en las 4 sesiones de 1440: `dialogsAfterEnter` es `["Crear tarea con objetivo","Editar tarea"]`. Captura: `*-1440-*-agenda-chip-enter.png`. Un solo Esc deja un diálogo abierto.
- Ya ocurría en base (`CalendarView.tsx:179` y `:402` de base), así que no lo introduce 010. Pero el Líder lo verá en su prueba manual de "editar tarea desde calendario".
- **Arreglo mínimo:** `onClick={(e) => { e.stopPropagation(); onEdit?.(task) }}` en `:178`. Comprobar también las celdas de Semana y Día.

### Notas

- **N1. El foco de la tarea del calendario es débil.**
  - Mide `box-shadow 0 0 0 1px oklab(0.708 0 0 / 0.5)` en claro, en torno a 1.4:1 contra blanco. El chip tiene `border-0`, lo que anula el `focus-visible:border-ring` de `button-variants.ts:4`.
  - Lo compensa que el HoverCard se abre con el foco.
  - Captura: `seller1-1440-{light,dark}-agenda-chip-focus.png`.
  - Arreglo (Líder, 012): subir el anillo del primitivo a `ring-ring` sin alfa, o añadir `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset` en el chip (Implementer).
- **N2. El CTA "Registrar venta" de seller no da feedback con ratón** (`SalesPage.tsx:382-388`).
  - Enfoca el `ClientCombobox` (un `button`). El foco programático tras un click de ratón no activa `:focus-visible`, así que no cambia nada visible. En A/D sí se ve, porque el destino es un `Input`.
  - Arreglo opcional: `.focus({ focusVisible: true } as FocusOptions)`, que ignoran los navegadores que no lo soportan. Otra opción es aceptarlo, porque el formulario ya está a la vista.
- **N3. Los FieldError de Dirección y ATC repiten ids:** `date-error`, `units-error`, `amount-error` y `notes-error` (`SalesPage.tsx:684`/`:832`, `:740`/`:859`, `:766`/`:885` y `:787`/`:906`).
  - Solo se nota si ambos formularios tienen error a la vez. Ya era así en base (`:515`/`:654`).
  - Arreglo (Implementer): en ATC, `name="atc-date"` (y el resto) en `FieldError` y en `fieldErrorProps("atc-date", atcErrors.fieldErrors.date)`.
- **N4. En Actividades, el combobox no marca `aria-invalid` con el error local** (`ActivityForm.tsx:320`).
  - `error={!!fieldErrors.clientId}` ignora `clientError`, que sí muestra el FieldError (`:325`).
  - Arreglo (Implementer): `error={!!(clientError || fieldErrors.clientId)}`.
- **N5. `ClientCombobox` no acepta `aria-describedby`** (`ClientCombobox.tsx:16-25` y `:89`).
  - Tiene `aria-invalid` pero el lector de pantalla no enlaza el FieldError. Pasa en `task-client`, `sale-client` y `clientId`.
  - Arreglo: el Líder añade `"aria-describedby"?: string` y lo pasa al `button`. El Implementer pasa `` `${name}-error` `` cuando hay error.
  - TimePicker pone `aria-*` en un `div` no enfocable; se resuelve con el `role="group"` de M3.
- **N6. La tabla de Ventas no cabe a 390.**
  - Admin mide `scrollWidth` 414 frente a `clientWidth` 340, y la columna de acciones `…` queda fuera de pantalla al cargar (`admin-390-light-ventas.png`). Seller mide 348/340.
  - El impl dice que "Monto y el menú caben a 390px", pero no es así. Es el mismo patrón que Clientes en 009.
  - Arreglo (Implementer): en la celda Cliente (`SalesPage.tsx:270`), `min-w-32 max-w-36 sm:min-w-40 sm:max-w-56` en lugar de `max-w-56 min-w-40`, y medir de nuevo.
- **N7. La columna Tipo muestra el valor crudo** "seller", "atc" o "direction" (`SalesPage.tsx:311`). Ya era así en base (`:816`).
  - Arreglo (decisión de copy del Líder): un mapa de etiquetas, por ejemplo `{ seller: "Vendedor", atc: "ATC", direction: "Dirección" }`.
- **N8. Al cerrar EditSaleModal, el foco no vuelve al menú de la fila.** Va a `body`, porque el trigger era un `DropdownMenuItem` desmontado. Es el mismo patrón que en 009.
  - Arreglo (Implementer): guardar la ref del botón `…` de la fila y enfocarlo en `onCloseAutoFocus` del Dialog y del AlertDialog.
- **N9. "Cancelar" y "Cerrar" se duplican** con el formulario abierto (`ActivitiesPage.tsx:93` y `:102`). Ya era así en base.
- **N10. Los niveles de heading saltan de h2 a h5.**
  - En Ventas, el h2 "Registrar venta del día" (`SalesPage.tsx:405`) va seguido de h5 "Venta" (`:418`). En los diálogos, el título es h2 y las secciones h5.
  - Lo manda `DESIGN.md:109`, así que el Implementer cumple. No es un fallo WCAG, pero empeora la navegación por headings.
  - Arreglo (Líder): permitir `h3` con las mismas clases en `DESIGN.md`.
- **N11. En Mi día, el contacto de una tarea vencida mide 4.34 en claro** (`MiDiaPage.tsx:626`).
  - Es `text-muted-foreground` sobre la fila `bg-destructive/5` (`:595`). Superficie de 008: no lo introduce 010, y 008 no tenía ese dato.
  - Arreglo: `text-foreground` en el `span`, con el icono en `text-muted-foreground`. El Líder asigna la fase.
- **N12. Fuera de scope (shell 007):** el kbd "Ctrl K" y el avatar miden 4.35 en claro. Ya estaba anotado en 008 (N7) y en 009 (N9).

## Salida de gates y rg

```
$ pnpm run typecheck   -> exit 0
$ pnpm run lint        -> exit 0
$ pnpm run build       -> exit 0   (tsc -b && vite build, ✓ built in 1.90s)
  aviso previo: [INEFFECTIVE_DYNAMIC_IMPORT] @atlaskit/pragmatic-drag-and-drop/.../adapter.js
  is dynamically imported by CalendarView.tsx but also statically imported by ... DealCard.tsx, KanbanColumn.tsx

$ rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules/tasks frontend/src/modules/activities frontend/src/modules/sales
exit 1   (0 coincidencias)

$ rg -n "\bslabel\b|\bcard\b|\bkl\b|\bprog\b|\blog-card\b|\bai-box\b|\bempty-state\b|variant=\"success\"" (3 módulos)
frontend/src/modules/tasks/presentation/components/TaskCard.tsx:234:export { TYPE_TAG } from "./task-card.constants"
frontend/src/modules/tasks/presentation/components/CalendarView.tsx:6:} from "@/components/ui/hover-card"
(0 en className)

$ rg -n SaleFormBase frontend/src
exit 1   (0 coincidencias)
$ git status --short -- frontend/src/modules/sales
 M frontend/src/modules/sales/presentation/components/EditSaleModal.tsx
 D frontend/src/modules/sales/presentation/components/SaleFormBase.tsx
 M frontend/src/modules/sales/presentation/pages/SalesPage.tsx

$ rg -n "text-chart-" (3 módulos + shared/components/forms + components/ui/badge-variants.ts)
exit 1   (0 coincidencias)

$ rg -n "tracker-|text-slate-|#[0-9a-fA-F]{6}" frontend/src/shared/components/forms
exit 1   (0 coincidencias)

$ rg -n "variant=\"(navy|green|amber|yellow|red|gray|purple|blue)\"" (3 módulos)
exit 1   (0 coincidencias)
```

## Capturas

En `progress/redesign/phase-010/review/`, con el patrón `{admin|seller1}-{1440|390}-{light|dark}-<vista>.png`. Vistas:
- Agenda: `agenda-list`, `agenda-calendar`, `agenda-calendar-semana`, `agenda-calendar-dia`, `agenda-hovercard`, `agenda-create-task`, `agenda-create-task-400` (y `-full`), `agenda-edit-task`, `agenda-chip-enter` y `agenda-chip-focus`.
- Actividades: `actividades`, `actividades-form`, `actividades-form-error` y `actividades-historial`.
- Ventas: `ventas`, `ventas-seller-400`, `ventas-ad-400`, `ventas-edit` y `ventas-delete`.
- Mi día: `midia`.

## Qué debe revisar el Líder a ojo

1. **Smoke de CRUD real** (no se ejercitó aquí):
   - crear y editar tarea desde lista y calendario;
   - drag de tarea en el calendario;
   - registrar actividad y ver los puntos;
   - registrar venta Seller, Dirección y ATC, y editarla y borrarla.

   Al editar desde el calendario aparecerá M4.
2. **M1:** el HoverCard en oscuro, en `seller1-1440-dark-agenda-hovercard.png`. Tras subir el token, revisar el tinte de las pills success en claro y en oscuro.
3. **Ventas a 390:** columna de acciones fuera de pantalla (N6), en `admin-390-light-ventas.png`. También el orden: formularios primero y StatCards después.
4. **Decisión de M2:** centavos en la tabla de ventas.
5. **Foco de la tarea del calendario** (N1): `seller1-1440-{light,dark}-agenda-chip-focus.png`.
6. **Bento de Ventas y diálogos frente a la plantilla:** `admin-1440-light-ventas.png`, `seller1-1440-dark-agenda-create-task-400.png` y `template/form-1440.png`.
