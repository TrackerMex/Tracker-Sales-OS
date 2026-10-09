# Review 81-009: Clientes y Pipeline

**Veredicto: PASSED.** Hay 0 bloqueantes, 2 menores y 10 notas.

Todo lo que pide el plan cumple:
- scope;
- rg;
- un solo mapa de etapas;
- gates;
- DnD intacto por código;
- hooks `.pipeline-scroll` y `.pipe-col`;
- un h1 por página;
- overflow 0;
- foco visible;
- fila operable con teclado;
- el menú de fila no navega;
- el peek no abre el Sheet;
- 0 errores de consola.

Los dos menores no bloquean:
- M1 es contraste de primitivos de `components/ui`, que ya estaba en 55b22e1 y queda fuera de las piezas autorizadas.
- M2 es una regresión de semántica para lector de pantalla en la fila de Clientes. El teclado sí funciona.

Se confirman los 2 fallos legacy de FieldError, con los valores exactos. Aparece un tercero del mismo tipo en Actividades (N8). Los tres son superficies que migran 010 y 011, no un fallo de FieldError.

Evidencias en `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/review009/` (en adelante `R/`):
- `live.cjs`: auditoría de 8 sesiones (admin, director1 y seller1; 1440 y 390; claro y oscuro). Resultados en `R/live/report.json` y `R/live/*.png`.
- `live2.cjs`: foco medido ya asentado, semántica de la fila, contraste del menú, labels del modal, foco del peek y nombres del stepper. Resultados en `R/live2/`.
- `formerr.cjs` y `act.cjs`: FieldError y FormErrorSummary en otras pantallas. Resultados en `R/formerr/`.
- `actcheck.cjs`: confirma que no se creó ninguna actividad.
- Logs de gates: `R/gate-*.log`.

Todas las sesiones son de solo lectura: cada petición no-GET a `/api` se responde en el navegador de prueba con un 400, 401 o 418 falso. Solo pasa el login real. No hubo drag ni CRUD. Los diálogos se abrieron y se cancelaron.

## Criterios

| Criterio | Resultado | Evidencia |
|---|---|---|
| Scope: solo la presentación de `modules/clients` y `modules/pipeline`, más las 4 piezas autorizadas | PASS | `git status`: solo cambian `ClientesPage`, `DealCard`, `DealPeek`, `KanbanColumn`, `ClientDetailPage` y `PipelinePage`, todos en `presentation/`. Shared: `Peek.tsx`, `FieldError.tsx`, `FormErrorSummary.tsx` y la guarda de portal de `DataTable.tsx` (impl, "Fixes Líder"). `status.ts` no se tocó. |
| Diff vacío en application, domain e infrastructure | PASS | `git diff --stat 55b22e1` sobre los 6 directorios de clients y pipeline: 0 líneas |
| rg de hex, `tracker-` y `text-slate-` en clients y pipeline | PASS (0) | también 0 en `peek/`, `FieldError.tsx` y `FormErrorSummary.tsx` |
| rg de `slabel`, `log-card`, `ai-box` y `empty-state` | PASS (0) | |
| Un solo mapa de colores de etapa | PASS | 0 `Record<PipelineStage, string>` y 0 mapas de color locales; todo pasa por `status.ts` (`StatusBadge` y `STATUS_TILE_CLASS`). Quedan 3 arrays de orden de etapas duplicados, que no son mapas de color (N3). |
| Gates `typecheck`, `lint` y `build` (más `tsc` de la app) | PASS | exit 0 en los cuatro (`R/gate-*.log`) |
| DnD intacto | PASS | ver el detalle bajo la tabla |
| Diálogo de pérdida | PASS | `PipelinePage.tsx:285-344`. Mismo flujo: `handleChangeStage` intercepta "Perdido", el motivo es opcional con `__none__` y `handleConfirmLoss` llama al mismo `mutate`. Solo cambia la presentación. |
| `stopPropagation` del peek | PASS | `DealCard.tsx:96` y `:104`. En vivo: popover 1, Sheet 0, en ratón y en teclado. "Abrir expediente" abre el Sheet. |
| Clases-hook | PASS | `.pipeline-scroll` (`PipelinePage.tsx:96`) y `.pipe-col` (`KanbanColumn.tsx:47`) |
| Un h1 por página | PASS | "Clientes", el nombre del cliente en el detalle y "Pipeline", en las 8 sesiones. El Sheet usa h2 y h3. |
| Overflow horizontal | PASS (0) | `scrollWidth - clientWidth = 0` en todas las vistas, también a 390. A 390 la tabla hace scroll dentro de su contenedor (1068/340). El tablero hace scroll dentro de `.pipeline-scroll`. El Sheet no desborda por dentro. |
| Contraste AA en las superficies de 009 | PASS, salvo M1 | ver la tabla de contraste |
| Foco visible | PASS | 32 elementos enfocables en `main` de Clientes y 0 sin indicador dentro de 009. Ver el detalle bajo la tabla. |
| Fila operable con teclado | PASS | `tabindex=0`. Enter y Espacio abren el detalle, y Espacio no hace scroll (delta 0). |
| Semántica de la fila | FAIL, menor | M2 |
| El menú de fila no navega | PASS | Abrir el menú, cerrarlo con Esc, abrirlo con teclado, "Editar" (abre el Dialog y lo cancela) y "Eliminar" (abre el AlertDialog y lo cancela): en todos los casos `inDetail` es false |
| El peek no abre el Sheet | PASS | ver la fila de `stopPropagation` |
| Sheet | PASS | Título del diálogo "Detalle de oportunidad". El foco no sale del Sheet en 25 Tab, todos con indicador, y se cierra. |
| Errores de consola y page errors | PASS (0) | 8 sesiones de `live`, 2 de `live2` y 4 de `formerr` |
| FieldError y FormErrorSummary en otras pantallas | PASS, con 3 fallos legacy | ver la tabla de errores de formulario |
| Aspecto frente a la plantilla | PASS a ojo | ver el detalle bajo la tabla |

Detalle de algunas filas:
- **DnD.** El diff contra 55b22e1 no tiene ninguna línea añadida ni borrada que toque `draggable`, `dropTargetForElements`, `getData`, `onDrop`, `canDrop` ni `onDragEnter`/`onDragLeave`.
  - `draggable` está en `DealCard.tsx:59`.
  - `dropTargetForElements` está en `KanbanColumn.tsx:28`.
  - `autoScrollForElements` está en `PipelinePage.tsx:88`.
  - El drop target usa `bg-primary/5 ring-1 ring-primary` (`KanbanColumn.tsx:48`).
  - En vivo: 7 columnas, 16 cards `draggable="true"` y el tablero hace scroll.
- **Foco visible.**
  - Anillo inset de 3px en las filas, en el peek "Vista rápida" y en los botones.
  - Inputs y selects marcan el foco con `border-primary`, el primitivo de `components/ui`.
  - El modal de cliente atrapa el foco: 0 salidas en 30 Tab.
  - Lo único sin indicador es "Buscar… Ctrl K" del header (shell 007, N9).
- **Aspecto.** Revisado a ojo con `R/live/*-clientes.png`, `*-detail.png`, `*-pipeline.png`, `*-peek.png` y `*-sheet.png` frente a la plantilla de `progress/redesign/`. Tabla, cabecera, pills, columnas `bg-muted/30` y cards cuadradas siguen el patrón de la plantilla, en claro y en oscuro.

### Contraste en vivo (mínimo por superficie; texto 4.5:1)

| Superficie | Claro | Oscuro | Notas |
|---|---|---|---|
| Lista de Clientes | 4.35 | 4.96 | En claro, el 4.35 es del kbd "Ctrl K" y del avatar del shell (N9). El mínimo propio de 009 es 4.62. |
| Fila en hover | 4.62 | 4.63 | |
| Pills de etapa (Perdido, Negociación, Contactado, Cierre) | 5.35, 6.43, 14.50, 4.74 | 6.19, 5.13, 12.93, 4.96 | |
| Toggles "Sin contacto" y "Datos incompletos" (`aria-pressed`) | 9.24 | 9.16 | |
| Detalle de cliente | 4.62 propio | 4.96 | En oscuro, el botón de la etapa actual mide 3.22, pero está `disabled` y queda exento (N1). |
| Modal nuevo/editar | 4.62 | 7.10 | |
| AlertDialog "Eliminar" | **3.97** | 4.64 | M1 |
| Menú de fila; "Eliminar cliente" con foco | 4.77; **3.97** | 6.21; 4.64 | M1 |
| Tablero del Pipeline | 4.35 (shell) | 4.96 | |
| Card del Pipeline en hover | 4.54 | 6.92 | |
| Peek (Popover) | 4.74 | 6.94 | El impl midió 2.56 y 1.00 antes del fix de `Peek.tsx`; ahora pasa. |
| Sheet | 4.74 | 6.94 | |

### Errores de formulario en otras pantallas (mínimo, claro y oscuro)

| Pantalla | Claro | Oscuro | Clasificación |
|---|---|---|---|
| Login: resumen | 5.16 | 6.03 | PASS |
| Clientes (modal): resumen y FieldError | 4.77 | 6.03 | PASS |
| Agenda (crear tarea) | 4.77 | 6.03 | PASS |
| Configuración | 4.77 | 6.03 | PASS |
| Actividades: resumen | 5.16 | 6.03 | PASS |
| **Ventas: FieldError en el panel `bg-tracker-dark`** | **3.89** | 6.03 | Legacy. Confirmado. Lo migra 010. |
| **Login: FieldError en la card `bg-white` fija** | 4.77 | **2.89** | Legacy. Confirmado. Lo migra 011. |
| **Actividades: FieldError en la `.card` blanca fija** | 4.77 | **2.89** | Legacy, nuevo (N8). Lo migra 010. |

Cómo se ejercitó Actividades (`R/act.cjs`): se elige un cliente real en `#clientId`, se rellena "¿Qué pasó?" y se envía con el POST respondido en local con un 400 falso. Así aparecen el resumen y 3 FieldError (`clientId`, `result` y `summary`). Capturas: `R/formerr/{light,dark}-1440-actividades-selected.png`.

`R/actcheck.cjs` confirma que no se creó nada. Muestra "Sin actividades registradas hoy" y "0 / 30 pts", con 0 peticiones no-GET.

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

**M1. El texto destructivo de los primitivos no llega a AA en claro (3.97:1).**
- `components/ui/button-variants.ts:16`, variante `destructive`: `bg-destructive/10 text-destructive`. Se ve en el botón "Eliminar" del AlertDialog de borrado (`ClientesPage.tsx:806`).
- `components/ui/dropdown-menu.tsx:76`, item `data-[variant=destructive]` con foco: `focus:bg-destructive/10 focus:text-destructive`. Se ve en "Eliminar cliente" del menú de fila (`ClientesPage.tsx:674`).
- En oscuro pasan (4.64).
- Es el mismo problema de B1 en 008, pero en primitivos que 009 no tenía autorizados, y ya estaba igual en 55b22e1.
- **Arreglo mínimo:** cambiar `text-destructive` por `text-status-danger` en el texto de ambas líneas (y `focus:text-status-danger` en el item). El tinte y el icono se quedan como están. `--status-danger` ya es red-700 en claro y `destructive` en oscuro.
- El Líder asigna la fase: un micro-fix ahora o 012. Afecta a todas las pantallas que usan esos primitivos.

**M2. La fila de Clientes no tiene nombre ni rol accionable** (`ClientesPage.tsx:553-562`, con `onRowClick` en `:765`).
- La fila es un `<tr tabindex=0>` sin `role` ni `aria-label`. La celda "Cliente" es texto plano.
- En 55b22e1 el nombre era un `Button variant="link"` que llamaba a `goToDetail`. Un lector de pantalla anunciaba "botón, Seguridad Privada Centinela"; ahora no anuncia que la fila es accionable. Es la nota N8 de 008.
- El teclado funciona: Enter y Espacio, con foco visible.
- **Arreglo mínimo:** en la celda, el nombre como `<button type="button" onClick={() => goToDetail(row.original.id)} className="truncate font-medium hover:underline">`. La guarda de `DataTable` ya ignora los clicks sobre `button`, así que no hay doble navegación. La fila puede seguir siendo clicable con ratón.

### Notas

- **N1. El botón de la etapa actual se ve atenuado** (`ClientesPage.tsx:476-486`).
  - Con un deal, la etapa activa queda `disabled` y se pinta con la opacidad de deshabilitado. En oscuro mide 3.22.
  - WCAG exime a los controles deshabilitados, y base tenía el mismo `disabled`. Pero la etapa actual, que es el dato importante, se lee apagada.
  - Arreglo: `className={isActive ? "disabled:opacity-100" : undefined}` en el `Button`. O bien no deshabilitar la activa y no hacer nada en su `onClick`, porque `aria-pressed` ya comunica el estado.
- **N2. Los botones del stepper del Sheet se llaman "1" a "6"** (`ClientDetailPage.tsx:137` y `:152`). El `title={s}` no sustituye al texto visible como nombre accesible. Ya era así en base. Arreglo: `aria-label={s}`.
- **N3. Hay tres arrays locales de orden de etapas:** `ClientesPage.tsx:90`, `ClientDetailPage.tsx:45` y `PipelinePage.tsx:46`. Ya existe `PIPELINE_STAGES` en `shared/lib/constants.ts:37`. No son mapas de color, así que el criterio cumple. Se puede importar el compartido (filtrando "Perdido" donde haga falta) en 012.
- **N4. Quedan reglas webkit con hex en `index.css:492-495`** (`.pipeline-scroll::-webkit-scrollbar*`). En Chromium no aplican porque gana `scrollbar-color` (medido `oklch(0.922 0 0) transparent`), pero los navegadores que solo leen webkit sí las pintan. Para 012.
- **N5. `DealCard` no es enfocable** (`DealCard.tsx:70`: `div` con `onClick` y `tabIndex` -1). Con teclado se llega por "Vista rápida" y "Abrir expediente", que funcionan. Ya era así en base.
- **N6. seller1 ve un fragmento de id ("92d7c21d") como vendedor.** Lo produce el fallback `id.slice(0, 8)` de `sellerName()` (`ClientesPage.tsx:387-388`) cuando la lista de vendedores no incluye al dueño. Ya era así en base.
- **N7. Tipo y Datos se ocultan por debajo de 2xl.** Justificado en el impl. Los nombres largos de cliente se truncan en las cards del Pipeline, igual que en base.
- **N8. FieldError sobre superficies legacy que no siguen el tema.** FieldError no tiene fondo propio y usa `text-destructive`, que cambia con el tema. Sobre fondos fijos falla:
  - Ventas, panel navy: 3.89 en claro (010).
  - Login, card blanca: 2.89 en oscuro (011).
  - Actividades, `.card` blanca en oscuro: 2.89, en `clientId-error`, `result-error` y `summary-error` (010).
  - Se arregla al migrar esas superficies, no en FieldError. El resumen pasa en las tres porque tiene tile propio.
  - En Actividades oscuro, el tile rojo oscuro queda sobre una card blanca, lo cual es raro pero legacy.
- **N9. Fuera de scope (shell 007):** el kbd "Ctrl K" y el avatar miden 4.35 en claro, y el botón "Buscar… Ctrl K" no tiene indicador de foco. Ya estaba anotado en 008 (N7).
- **N10. `ActivityForm` aún tiene su propio error legacy:** `text-red-500` en `ActivityForm.tsx:313` (`clientError`) y `.slabel` en `:291` y siguientes. Ese error local corta el submit antes de que se vea FieldError. Para 010.

## Qué debe revisar el Líder a ojo

1. **DnD real:** arrastrar entre columnas, soltar en "Perdido" con el Dialog de motivo (cancelar y confirmar) y el auto-scroll horizontal al arrastrar cerca del borde. Comprobar también el anillo `ring-primary` del drop target. Ninguna de estas cosas se ejercitó aquí.
2. **Smoke de CRUD** en Clientes: crear, editar y borrar, y el cambio de etapa desde el detalle.
3. **Etapa actual atenuada en oscuro** (N1): `R/live/admin-1440-dark-detail.png`.
4. **Truncado de nombres en las cards** y la decisión de ocultar Tipo y Datos por debajo de 2xl: `R/live/admin-1440-light-pipeline.png` y `R/live/admin-1440-light-clientes.png`.
5. **Clientes a 390:** la tabla hace scroll dentro de su contenedor y la columna de acciones queda fuera de pantalla al cargar. `R/live/admin-390-light-clientes.png`.
6. **Aspecto del stepper del Sheet:** `R/live2/light-sheet.png` y `R/live2/dark-sheet.png`.
7. **Foco de fila y del peek:** `R/live2/light-table-row-focus.png` y `R/live2/{light,dark}-eye-focus.png`.
8. **M1:** botón "Eliminar" del AlertDialog en claro, en `R/live/admin-1440-light-delete-alert.png`, y el menú de fila en `R/live2/light-row-menu.png`.
