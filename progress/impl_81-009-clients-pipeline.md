# Impl 81-009: Clientes y Pipeline

Plan: `plans/009-redesign-clients-pipeline.md` · Rama `81-visual-redesign` · Sin commit.

## Estado

**DONE (sin commit; pendiente review).** Steps 1-5 aplicados. Los gates pasan y
los dos `rg` de Done dan 0. No se disparó ninguna condición de STOP:
- El DnD sigue igual.
- El peek abre sin abrir el Sheet.
- No cambió ninguna lógica de datos.

Hay una salvedad que decide el Líder. El peek de deal usa la pieza compartida
`shared/components/peek/Peek.tsx`, todavía con tokens tracker. En oscuro su
texto es ilegible (contraste 1.0). No la toqué; está fuera de alcance. Ver
"Hallazgos fuera de alcance".

## Archivos

Modificados, solo la capa de presentación:
- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx` (el Sheet)
- `frontend/src/modules/pipeline/presentation/components/KanbanColumn.tsx`
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
- `frontend/src/modules/pipeline/presentation/components/DealPeek.tsx`

Otros archivos: `plans/README.md` (solo la fila 009) y este archivo.

No modifiqué `shared/lib/status.ts`: ya tenía todas las etapas, los estados de
actividad y los tipos de cliente (Prospecto/Nuevo/Existente).

`git status` no muestra cambios en `application/`, `domain/` ni
`infrastructure/` de los dos módulos. Prettier se pasó solo sobre las carpetas
`presentation/`.

Respaldo de los originales, por si hace falta comparar:
`scratchpad/impl009/orig/`.

## Decisiones

### Clientes, lista: `DataTable` en vez de cards

1. Respeta toda la información que mostraban las tarjetas:
   - nombre y pain
   - primer contacto con su teléfono
   - etapa y "Fría"
   - tipo y calidad de datos
   - vendedor
   - siguiente paso con su fecha
   - última actividad
   - acciones
2. Es el patrón "Tabla" de DESIGN.md y de `tables-1440`.
3. La fila se opera con teclado: Enter o Espacio abre el detalle.
4. Ordena en cliente las columnas Cliente, Etapa, Tipo, Datos y Última
   actividad. La query trae como máximo 50 filas, sin paginación de servidor.

Las acciones van en un `DropdownMenu` por fila (Editar / Eliminar). El
AlertDialog de borrado no cambia.

La tabla medía 1419px y no cabía ni a 1920. Para que quepa:
- Acoté el ancho de Cliente (`max-w-52`), Contacto (`max-w-40`, con truncate)
  y Siguiente paso (`max-w-44`).
- Tipo y Datos se ocultan por debajo de `2xl` (`hidden 2xl:table-cell`).

Las dos columnas ocultas siguen visibles en el detalle: Tipo en "Datos del
cliente" y la calidad en la pill del encabezado. El toggle "Datos incompletos"
sigue filtrando.

Resultado medido:

| Viewport | Tabla / contenedor | Comportamiento |
|---|---|---|
| 1440 | 1142 / 1142 | cabe entera |
| 1920 | 1365 / 1365 | cabe con todas las columnas |
| 1280 | 1106 / 982 | scroll horizontal dentro de la card; la página no hace scroll |

### Clientes, detalle: vista de perfil, no maestro-detalle

Conserva el estado de vista lista/detalle que ya existía, sin cambiar la
navegación.

Estructura:
- Botón "Volver a clientes".
- `PageHeader`: el nombre, las pills de etapa, "Datos N%" y "Fría", y el botón
  "Editar cliente".
- Bento `grid-cols-12` responsive, con secciones `bg-background p-6`:
  - "Datos del cliente" (`lg:col-span-7`): pares label/valor
  - "Contactos" (`lg:col-span-5`): `ul.divide-y`
  - "Actualizar etapa"
  - "Historial de actividad" en `divide-y`, que sustituye a `.log-card`

El `grid-cols-[280px_1fr]` fijo y el panel navy desaparecen.

### Pipeline

- `PageHeader` con el Select de vendedor A/D. Total bruto y Forecast ponderado
  van como texto `text-sm`, en un `<dl>` dentro de las acciones; no son
  StatCards.
- Columnas `bg-muted/30` sin hex, con `rounded-none` y header `text-sm
  font-medium` más un contador.
- El drop target se resalta con `bg-primary/5 ring-1 ring-primary`.
- El ancho sigue en 252px (`w-63`) y la altura de la lista en
  `calc(100vh-260px)`.

Las tarjetas (`DealCard`):
- `rounded-lg border bg-background p-3`, con hover `bg-muted/30`.
- Etapa con `StatusBadge`.
- Pill de días parado: `pending` o `danger`.
- Vendedor como `Badge secondary` en modo equipo.

### Sheet (`ClientDetailPage`)

- Header sticky con `border-b` y botón cerrar `ghost size="icon"`.
- Footer sticky con `border-t`.
- Stepper con `status.ts`:
  - etapa actual: tile del tono
  - pasadas: `bg-primary`
  - futuras: outline
  - Perdido: tono `danger`
- Las etiquetas del stepper muestran el nombre completo truncado; antes eran
  `slice(0,4)` en `text-[9px]`.
- Timeline con un punto coloreado por el estado de la actividad.

### Un solo mapa de etapas

Desaparecen los tres mapas de etapas:
- `STAGE_BADGE_COLORS` en DealCard
- el mapa hex de DealPeek
- `STAGE_COLORS` en ClientDetailPage

Desaparece también `stageBadgeVariant` en ClientesPage. Todo sale de
`shared/lib/status.ts`, vía `StatusBadge`, `STATUS_TILE_CLASS`,
`STATUS_FILL_CLASS`, `STATUS_BADGE_CLASS` y `statusTone`.

## Clases-hook conservadas

`.pipeline-scroll` (en el board) y `.pipe-col` (en cada columna) siguen en el
JSX solo como selectores, para `progress/test_pipeline_scroll.mjs` y el smoke
del Líder.

El DnD no las necesita:
- `draggable`, `dropTargetForElements` y `autoScrollForElements` reciben refs.

Ninguna aporta estilo propio. Las utilidades pisan todas sus propiedades
visuales, porque la regla legacy vive en `@layer components`:
- `w-63`
- `bg-muted/30`
- `border-border`
- `rounded-none`
- `p-3`
- `[scrollbar-color:var(--border)_transparent]`

En 012 se puede borrar su CSS de `index.css` sin cambiar nada aquí.
`.pipe-col-h` y `.pipe-col-body` salieron del JSX.

## Desviaciones del plan

1. **Tipo y Datos** se ocultan por debajo de 2xl para que la tabla quepa a
   1440 (ver arriba).
2. **Seller en el detalle de Clientes**: muestra el nombre del vendedor en vez
   de `Seller <id.slice(0,8)>`.
3. **Botones**:
   - "Registrar avance" de DealPeek pasa de `variant="success"` a default.
   - "Cancelar" del Dialog de pérdida pasa de ghost a outline, dentro de un
     `DialogFooter`.
4. **Puntos del timeline**: se colorean con `status.ts`. Cancelada y Vencida
   salen `danger`, Pendiente sale `pending`. Antes solo Completada tenía
   color.
5. **Accesibilidad**: añadí `aria-label`, `aria-pressed` en los toggles y en
   los botones de etapa, y `Label htmlFor` en el formulario. Los Skeleton de
   carga llevan `role="status"`.
6. **Menú de acciones de la fila**: `DropdownMenuContent` lleva
   `onClick={(e) => e.stopPropagation()}`. Motivo: el menú vive en un portal y
   React propaga el click hasta la fila, así que sin esto se abría el detalle
   (ver hallazgos).

## Verificación

Gates, desde `frontend/`:
- `pnpm run typecheck && pnpm run lint && pnpm run build` sale con exit 0
  (log en `scratchpad/impl009/gates3.log`).
- Además, `pnpm exec tsc -p tsconfig.app.json --noEmit` sale con exit 0.
- `prettier --check` sobre las dos carpetas `presentation/` queda limpio.

Done:
- `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-" frontend/src/modules/clients frontend/src/modules/pipeline` devuelve 0.
- `rg -n "\bslabel\b|\blog-card\b|\bai-box\b|\bempty-state\b" frontend/src/modules/clients frontend/src/modules/pipeline` devuelve 0.
- `rg "STAGE_COLORS|STAGE_BADGE|badgeColor|stageBadgeVariant" frontend/src` devuelve 0.
- Tampoco quedan `text-[Npx]` ni `variant="success"` en los dos módulos.

Playwright de solo lectura: `scratchpad/impl009/check009.cjs`. No arrastra
deals, no guarda y no borra; los diálogos se cierran con Escape o Cancelar.
Se pasó en light-1440, dark-1440 y light-390, con estos resultados:

| Comprobación | Resultado |
|---|---|
| Columnas | 7 en orden de etapa, 252px, fondo `bg-muted/30` (oklab .97/.3 en claro, .269/.3 en oscuro), radius 0 |
| DealCards | 16 con `draggable` |
| Scroll del board | `scrollbar-color` por token; el board hace scroll horizontal |
| Peek | `{popover: true, sheet: false}` |
| Sheet | abre al click en la card, cierra con "Cerrar", sin scroll horizontal |
| Lista de Clientes | 16 filas |
| Menú Editar | abre el Dialog y la vista sigue en la lista |
| Menú Eliminar | abre el AlertDialog y la vista sigue en la lista |
| Detalle | abre con click y con Enter en la fila; "Volver" presente |
| Modal de alta | abre sin scroll horizontal (no se envía) |
| Global | ningún scroll horizontal de página y 0 errores de consola o de página |

Capturas:
- `scratchpad/impl009/check/*.png`, las más recientes, con las 7 vistas en los
  3 modos.
- `scratchpad/impl009/shots-1440-light`, `shots-1440-dark` y `shots-390-light`
  (shots.cjs), tomadas antes de los últimos ajustes de ancho de la tabla.

### Contrastes medidos (texto hoja, WCAG, mínimo por área)

| Área | Claro | Oscuro | Fallos |
|---|---|---|---|
| Pipeline (columnas, cards, pills) | 4.35 | 4.96 | solo el shell (ver abajo) |
| Sheet | 4.74 | 6.94 | ninguno |
| Clientes, lista | 4.35 | 4.96 | solo el shell |
| Clientes, detalle | 4.35 | 4.96 | solo el shell |
| Modal crear/editar | 4.62 | 7.26 | ninguno |
| Peek (Popover) | 2.56 | 1.00 | `Peek.tsx` compartido |

Los fallos "del shell" son siempre los mismos:
- el kbd "Ctrl K" del Header
- el fallback "A" del avatar, `bg-muted text-muted-foreground`, 4.35 en claro

Las pills nuevas de este módulo pasan AA en los dos modos:
- etapa, tipo, Fría, Datos N% y días parado
- el contador de columna, que medía 4.35 con `text-muted-foreground` y ya no
  lo usa

## Hallazgos fuera de alcance (no tocados; decide el Líder)

1. **`shared/components/peek/Peek.tsx`.**
   - `PeekHeader` y `PeekRow` usan `text-tracker-blue`, `text-tracker-text`,
     `text-tracker-text-muted`, `text-[13px]` y `text-[11px]`.
   - En claro, los labels dan 2.56.
   - En oscuro, el título da 1.23 y los valores 1.0: texto invisible.
   - Solo lo usa `DealPeek`.
   - Opciones:
     - (a) autorizar migrar `Peek.tsx` a tokens. Son 3 componentes pequeños.
     - (b) que `DealPeek` deje de usarlo y pinte sus filas inline. Así
       `Peek.tsx` queda sin uso hasta 012.
   - Lo detecta el `rg` de 012 sobre `shared/`, pero hoy el peek en oscuro es
     ilegible.
2. **`shared/components/forms/FormErrorSummary.tsx` y `FieldError.tsx`.**
   Siguen con `border-red-300 bg-red-100 text-tracker-danger-dark` y
   `text-[11px]`, así que el formulario de Clientes los muestra con la estética
   vieja. El plan 010 ya prevé reportarlo.
3. **`shared/components/data/DataTable.tsx`, `onRowClick`.**
   - La guarda `closest(...)` más `currentTarget.contains(hit)` no frena los
     clicks dentro de portales: menús, diálogos y popovers que se abren desde
     la fila.
   - React los propaga a la fila y dispara `onRowClick`.
   - Lo resolví localmente con `stopPropagation` en el `DropdownMenuContent`.
   - Cualquier otra tabla con menú por fila tendrá el mismo problema.
   - Arreglo central: ignorar los eventos cuyo `target` no esté dentro de
     `currentTarget` en el DOM real.
4. **Shell, 4.35 en claro.** El kbd "Ctrl K" y el avatar "A"
   (`Header.tsx`/`avatar.tsx`). El plan 012 ya los menciona.
5. **`pnpm run typecheck` no comprueba nada.** Es `tsc --noEmit` contra el
   `tsconfig.json` raíz, que tiene `files: []`. El check real es
   `tsc -p tsconfig.app.json --noEmit`; `build` lo cubre vía `tsc -b`.

## Pendiente para la verificación manual del Líder

En claro y en oscuro, a 1440 y a 390, contra Vite `http://localhost:3001`.

Pipeline:
1. Arrastrar un deal entre columnas y comprobar el resaltado del drop target
   (`ring-1 ring-primary bg-primary/5`).
2. Soltar en "Perdido": aparece el Dialog de motivo con su Label y su Select.
   Probar Cancelar y Confirmar.
3. Auto-scroll horizontal al arrastrar hacia el borde del board.
4. Peek: el ojo abre el Popover sin abrir el Sheet. "Registrar avance" y
   "Abrir expediente" desde el peek.
5. Sheet:
   - abrir y cerrar
   - clicks en el stepper, incluido Perdido
   - acordeón de información
   - "Ver más" del historial
   - footer "Registrar avance"

Clientes:
1. Crear un cliente con el modal: validación, añadir y quitar contacto,
   Decisor.
2. Editar desde el menú y desde el detalle.
3. Borrar desde el menú (AlertDialog).
4. Abrir el detalle (click o Enter), cambiar la etapa y volver.
5. Probar los filtros "Sin contacto" y "Datos incompletos", y la búsqueda.

## Fixes Líder

El Líder autorizó corregir hallazgos de 4 piezas compartidas. No se cambió
lógica, props ni comportamiento a11y.

### Archivos

| Archivo | Cambio |
|---|---|
| `frontend/src/shared/components/peek/Peek.tsx` | Título `text-sm font-medium text-foreground`; label `text-xs text-muted-foreground`; valor `text-sm text-foreground`; divisor `border-border`. API sin cambios, así que `DealPeek` y `DealCard` no se tocan. |
| `frontend/src/shared/components/forms/FieldError.tsx` | `mt-1 text-xs text-destructive`. Se conservan `id={name}-error` y el `return null` sin mensaje. |
| `frontend/src/shared/components/forms/FormErrorSummary.tsx` | Tile `STATUS_TILE_CLASS.danger` con `border px-3.5 py-3` y texto `text-sm`. Se conservan `role="alert"`, el icono `aria-hidden` y la lista de detalles. |
| `frontend/src/shared/components/data/DataTable.tsx` | En el `onClick` de la fila, `if (!e.currentTarget.contains(e.target as Node)) return` antes de la guarda existente. |
| `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx` | Fuera el parche local: el `stopPropagation` y su comentario en `DropdownMenuContent`. |

Desviación en FormErrorSummary: el tile va dentro de un contenedor
`bg-background`, que lleva `role="alert"` y `className`. El tinte de
`STATUS_TILE_CLASS` es translúcido. Sobre el panel navy legacy de Ventas
("Ventas Dirección") el texto quedaba en 2.82 en claro; con la capa opaca debajo
pasa en cualquier superficie. Ningún consumidor pasa `className`.

### Verificación

- Los gates (`typecheck && lint && build`) salen con exit 0, igual que
  `tsc -p tsconfig.app.json --noEmit`. Prettier queda limpio.
  Log: `scratchpad/impl009/gates5.log`.
- Los dos rg del plan siguen en 0.
- `rg -n "tracker-|text-\[[0-9]+px\]"`:
  - Sobre `peek/`, `FieldError.tsx` y `FormErrorSummary.tsx` da 0.
  - Sobre la carpeta `forms/` completa da 2 hits, fuera de los 4 archivos
    autorizados: `DatePickerField.tsx:51` y `TimePickerField.tsx:51`. Usan
    `var(--tracker-*)` y `text-[13px]`. No los toqué.
- Peek abierto, medido en vivo (`check009.cjs`): mínimo 4.74 en claro, 6.94 en
  oscuro y 4.74 a 390. Sin fallos; antes daba 2.56 en claro y 1.0 en oscuro.
- DataTable sin el parche local:
  - Editar y Eliminar desde el menú abren su diálogo y la vista sigue en la
    lista.
  - Click y Enter en la fila siguen abriendo el detalle.
  - El peek sigue sin abrir el Sheet.
  - 0 errores.
- Formularios: script de solo lectura `scratchpad/impl009/formerr.cjs`.
  - Toda petición no-GET a `/api` se responde localmente con
    `route.fulfill`: un 400 con mensajes de validación, o un 401 en login.
    Nada llega al backend.
  - Capturas en `scratchpad/impl009/formerr/*.png`, en light-1440, dark-1440
    y light-390.

| Superficie | Claro | Oscuro | Nota |
|---|---|---|---|
| Clientes (modal) | 4.77 | 6.03 | resumen y FieldError |
| Agenda (crear tarea) | 4.77 | 6.03 | resumen y 3 FieldError |
| Configuración | 4.77 | 6.03 | |
| Ventas: resumen | AA (≥4.5) | 6.03 | el resumen pasa también sobre el panel navy |
| Ventas: FieldError en el panel navy | **3.89** | 6.03 | superficie legacy, la migra 010 |
| Login: resumen (401 simulado) | 5.16 | 6.03 | |
| Login: FieldError | 4.77 | **2.89** | la card del login es blanca fija aunque el tema sea oscuro; legacy, la migra 011 |
| Registrar actividad | — | — | la validación local propia ("Selecciona un cliente…") corta antes; no renderiza ni FieldError ni el resumen; sin roturas visuales |

### Pendiente (decide el Líder)

1. **FieldError sobre superficies legacy que no siguen el tema.**
   - `text-destructive` cambia con el tema; FieldError no tiene fondo propio.
   - Por eso falla en dos sitios:
     - el panel navy de Ventas en claro, con 3.89 (antes, rojo oscuro sobre
       navy, era peor)
     - la card blanca fija del login en oscuro, con 2.89 (antes pasaba)
   - Se resuelve al migrar esas superficies en 010 y 011, no en FieldError.
2. **`DatePickerField.tsx` y `TimePickerField.tsx`** siguen con tokens tracker.
   Caen en el `rg` de 012.

## Fixes post-review

Hallazgos de `progress/review_81-009-clients-pipeline.md`. M1 (texto destructive
en `components/ui`) lo arregló el Líder; no lo toqué.

- **M2.** `ClientesPage.tsx`, celda Cliente: el nombre vuelve a ser un
  `<button type="button">` que llama a `goToDetail(row.original.id)`.
  - Su nombre accesible es el propio nombre del cliente.
  - Clases: `block max-w-full truncate text-left font-medium hover:underline`,
    más un anillo de foco visible (`focus-visible:ring-3 ring-ring/50`).
  - La fila conserva `onRowClick`. El guard de DataTable ignora los clicks en
    botones, así que no hay doble navegación.
- **N1.** `ClientesPage.tsx`, botones de "Actualizar etapa":
  - La etapa actual ya no lleva `disabled`: opacidad completa y
    `aria-current="step"` en lugar de `aria-pressed`.
  - Su `onClick` es `undefined`, así que no dispara ningún cambio de etapa.
  - Las demás etapas siguen deshabilitadas cuando la transición no está en
    `ALLOWED_TRANSITIONS`.
- **N2.** `ClientDetailPage.tsx`, stepper: `aria-label={s}` en los botones de
  etapa y `aria-label="Perdido"` en el botón de Perdido.

### Verificación

- Gates desde `frontend/`, todos con exit 0 (`scratchpad/impl009/gates6.log`):
  - `pnpm run typecheck`
  - `pnpm run lint`
  - `pnpm run build`
  - `pnpm exec tsc -p tsconfig.app.json --noEmit`
- Prettier limpio en los 6 archivos de presentación modificados.
  - `prettier --check` sobre los módulos completos marca 10 archivos de
    `application/` e `infrastructure/`.
  - Es formato previo: esos archivos no están modificados y tengo prohibido
    tocarlos.
- `check009.cjs` (solo lectura; `out6/`), en light-1440, dark-1440 y light-390:
  - **Etapa actual** (detalle de "Seguridad Privada Centinela", deal en
    Perdido):
    - hay un solo botón con `aria-current="step"`
    - no está `disabled`, tiene opacidad 1 y no tiene `aria-pressed`
    - Contraste: 17.18 en claro y 14.23 en oscuro (antes, 3.22 en oscuro).
    - Pulsarlo con todo no-GET interceptado: 0 peticiones de mutación.
  - **Nombre**:
    - existe un botón con el nombre exacto del cliente en la primera fila
    - Pulsarlo abre el detalle.
    - El click en el texto del pain (resto de la fila) también lo abre.
    - Enter sobre la fila también.
  - **Stepper**: las 7 etapas tienen `aria-label` igual al `title`, y
    `getByRole('button', { name: 'Perdido' })` lo encuentra en el Sheet.
  - Sin regresiones:
    - Editar y Eliminar desde el menú siguen en la lista.
    - El peek sigue sin abrir el Sheet.
    - El Sheet abre y cierra.
    - 0 errores de consola.
    - Contrastes iguales a los de antes: los únicos fallos son los del shell
      ("Ctrl K" y el avatar, 4.35 en claro), ya reportados.

## Smoke del Líder

Hecho con `scratchpad/tools/smoke009.cjs` y `drag390.cjs` contra el runtime local (3001 → 3005), en claro 1440, oscuro 1440 y claro 390. Resultados en `progress/redesign/phase-009/smoke-{light,dark,390}/smoke.txt`.

- Pipeline:
  - Pasa: arrastrar una columna y volver; soltar en "Perdido" abre el Dialog de motivo, y al cancelar el deal se queda donde estaba; auto-scroll horizontal durante el arrastre (scrollLeft 0 → 692); el peek abre sin el Sheet; el Sheet abre y cierra.
  - A 390, el arrastre con eventos de ratón funciona.
- Clientes: crear (Admin tiene que elegir vendedor), editar desde el menú de fila sin navegar, abrir el detalle, "Volver a clientes" y eliminar (borrado lógico, `deleted_at`). Todo pasa.
- Datos locales: las etapas de los deals quedan como estaban. Los clientes "Smoke 81 …" quedan con borrado lógico.
- Hallazgo previo, fuera de alcance porque es lógica: soltar un deal en su propia columna manda `PATCH /deals/:id/stage` con la misma etapa. El backend responde 400 ("Transition … is not allowed") y aparece el toast "No se pudo cambiar la etapa". `KanbanColumn` `onDrop` no tiene guarda `source.stage === stage`. Ya pasaba en 55b22e1.
