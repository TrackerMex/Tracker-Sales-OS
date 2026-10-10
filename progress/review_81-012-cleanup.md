# Review 81-012: Limpieza final del rediseño

**Veredicto: PASSED.** Hay 0 bloqueantes, 0 menores y 10 notas.

Todo lo que pide el plan cumple:
- `index.css` pasa de 823 a 252 líneas. Los 68 selectores legacy y los 18 tokens borrados tienen 0 usos en `frontend/src`, también buscando usos dinámicos (`cn(...)`, plantillas y `var(--…)`).
- Solo quedan dos hooks de markup (`.pipe-col` y `.pipeline-scroll`). Ya no tienen regla CSS: su estilo sale entero de utilidades.
- La lámina está intacta:
  - `git diff HEAD` vacío en `ExecutiveSlide.tsx`, `LaminaPage.tsx` y `routes/lamina.tsx`;
  - las 4 capturas (lámina y popup, en claro y en oscuro) son idénticas byte a byte a `phase-012/lamina-before`.
- Las variantes cumplen:
  - Button `success` borrada (0 usos);
  - Badge conserva solo `navy`, `green`, `amber` y `gray`, que se usan de verdad vía `TYPE_TAG`.
- Contraste AA en claro y en oscuro: kbd, avatar, contacto vencido de MiDia y FieldError sobre background, card y popover.
- Paso 8 verificado en vivo:
  - 13 pickers con `htmlFor` válido y nombre accesible;
  - grupos de hora con nombre;
  - 0 ids duplicados en Ventas con los errores de Dirección y ATC a la vez;
  - el combobox de Actividad con `aria-invalid` y `aria-describedby`;
  - Tipo legible en Ventas;
  - `ROLE_LABELS` compartido;
  - las 3 listas de etapas leen `PIPELINE_STAGES` en el mismo orden.
- Lógica intacta.
- Gates en exit 0. El rg del paso 5 solo da los hits aceptados.
- Las capturas de las 14 vistas a 1440 en claro solo cambian donde se esperaba.

Las notas son, sobre todo, restos ya conocidos o fuera de scope:
- un texto desactualizado en `DESIGN.md`;
- el hex del scrollbar global;
- claves muertas en `TYPE_TAG`;
- dos errores sin `aria-describedby` fuera del alcance de N4/N5;
- un comentario obsoleto;
- archivos no relacionados en el árbol de trabajo.

Ninguna impide el commit.

Evidencias en `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/r012/` (en adelante `R/`):
- **CSS:**
  - `index.head.css`: `index.css` de HEAD;
  - `deleted-classes.txt` (68), `deleted-tokens.txt` (18) y `removed-selectors.txt` (99 líneas de selectores, entre ellas las `::-webkit-scrollbar` de `.pipeline-scroll`).
- **Lámina:** `lamina.cjs` (copia del script del Implementer, con el guard de esta review) y `cmp.cjs` (sha256 y diff de píxeles por carpeta).
- **Rutas:** `cmp2.cjs` (diff por pareja), `bbox.cjs` (bandas de diferencia y recortes en `R/crops/`) y `stack.cjs`.
- **Auditoría en vivo:**
  - `live.cjs` → `live.json`: rutas, DOM, selectores borrados y contraste;
  - `live2.cjs` → `live2.json`: pickers, Ventas con 400 falso y ActivityForm;
  - `live3.cjs`: EditTaskForm a mano.
- **Gates y rg:** `gate-*.log`, `gates.txt` y `rg-step5.txt`.
- **Capturas:** `progress/redesign/phase-012/review/`, con 27 PNG.

Todas las sesiones son de solo lectura. Un guard `**/*` deja pasar los GET y solo el login real (`POST /api/auth/login|refresh`). El resto se responde dentro del navegador de prueba:
- un 400 falso con mensajes por campo para `POST /api/sales`, para ver los FieldError de Dirección y ATC a la vez. Se bloquearon 4 peticiones;
- un 418 para todo lo demás. ActivityForm y los formularios de tareas no llegaron a enviar nada, porque la validación local sale antes.

El puerto 3000 y los hosts externos se abortan. No se escribió ningún dato. No se reinició ningún servidor: backend en 127.0.0.1:3005 y Vite en localhost:3001.

Las TanStack Router Devtools (solo en dev) se excluyen de la auditoría, igual que en la review 011: meten ids `*-cl-N` de goober y un badge en la esquina. No van en producción.

## Criterios

| Criterio | Resultado | Evidencia |
|---|---|---|
| Scope | PASS | Los archivos del plan: `index.css`, `button-variants.ts`, `badge-variants.ts` y `main.tsx`. Más el scope extra de los pasos 6 a 8: `Header.tsx`, `avatar.tsx`, los 3 archivos de etapas, los pickers, `ClientCombobox`, `ActivityForm`, `SalesPage`, `EditSaleModal`, `Create/EditTaskForm`, `MiDiaPage`, `constants.ts`, `nav-user.tsx` y `EquipoPage.tsx`. El cambio de `FieldError.tsx` es del Líder. Hay archivos no relacionados en `progress/` (N10). |
| Paso 1: clases legacy borradas sin usos | PASS | ver el detalle bajo la tabla |
| Paso 2: tokens `--tracker-*` | PASS | Los 18 borrados tienen 0 usos. Los 14 que usa la lámina siguen en `:root`, bajo el comentario «Lámina ejecutiva» (`index.css:173-196`), y el bloque `@theme` tiene su comentario en `:44`. |
| Paso 3: variantes | PASS | Button `success`: 0 usos (el `variant: "success"` de `MiDiaPage.tsx:396` es de una alerta local, no de Button). Badge solo conserva `navy`, `green`, `amber` y `gray` (`badge-variants.ts`), que se usan en `TYPE_TAG`, consumido en `MiDiaPage.tsx:588`. typecheck lo garantiza. |
| Paso 4: Montserrat | PASS | Lo usan `ExecutiveSlide.tsx`, `LaminaPage.tsx` y el popup de `ReportsPage.tsx`, así que el import de `main.tsx:9` y la dependencia se quedan. |
| Paso 5: barrido rg | PASS, con hits aceptados | ver gates y rg |
| Paso 6: kbd y avatar ≥ 4.5 | PASS | `Header.tsx:37` y `avatar.tsx:50` usan `text-foreground`. Miden 18.16 en claro y 14.5 en oscuro. `AvatarGroupCount` (`:95`) no tiene usos (N5). |
| Paso 7: `PIPELINE_STAGES` | PASS | `ClientesPage.tsx:15` (`:463`, `:1016`), `PipelinePage.tsx:19` (`:54`, `:90`) y `ClientDetailPage.tsx:46` (`filter` sin «Perdido», el mismo orden que antes). En vivo, los botones de etapa de Clientes y del detalle salen en el mismo orden que en 010. Las reglas webkit de `.pipeline-scroll` se borraron (N3). |
| Paso 8, M3: pickers | PASS | ver el detalle del paso 8 |
| Paso 8, N3: ids únicos en Ventas | PASS | ver el detalle del paso 8 |
| Paso 8, N4/N5: combobox | PASS | `ClientCombobox.tsx:25`, `:37` y `:91-92`. `ActivityForm.tsx:320-328`. Ver el detalle del paso 8. |
| Paso 8, N7: Tipo en Ventas | PASS | `SALE_TYPE_LABELS` (`SalesPage.tsx:82`) se usa en `:318`. En vivo muestra «ATC», «Dirección» y «Vendedor». |
| Paso 8, N11: contacto vencido en MiDia | PASS | `MiDiaPage.tsx:626` usa `text-foreground`. Mide 18.11 en claro y 18.17 en oscuro sobre el tinte `bg-destructive/5`. |
| Paso 8: `ROLE_LABELS` | PASS | Se exporta en `constants.ts:49` y lo importan `nav-user.tsx:15` y `EquipoPage.tsx:60`, sin copias locales. |
| Lógica intacta | PASS | ver el detalle bajo la tabla |
| Lámina y popup | PASS (idénticos) | ver la comparación de la lámina |
| Aspecto de las rutas | PASS | ver la comparación de rutas |
| Gates | PASS | `typecheck`, `lint` y `build` en exit 0. `build` solo muestra el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT` de `@atlaskit`. |
| DOM en vivo | PASS | 14 vistas en claro y en oscuro: 0 ids duplicados, 0 `htmlFor` rotos, overflow 0 y 0 page errors |

**Paso 1, clases legacy borradas.** Los 68 selectores de `R/deleted-classes.txt` tienen 0 usos con rg en `frontend/src`, incluidos los dinámicos (`cn(`, plantillas y concatenación).

En vivo se buscaron 79 selectores de `removed-selectors.txt` con `querySelectorAll` en las 12 rutas, el login y el detalle de cliente, en claro y en oscuro. Solo aparecen:
- `.pipe-col` (7 nodos, `KanbanColumn.tsx:41-47`);
- `.pipeline-scroll` (1 nodo, `PipelinePage.tsx:83-87`).

Sus estilos calculados salen enteros de utilidades. Como todas las reglas legacy estaban en `@layer components`, las utilidades ya ganaban antes, así que borrarlas no cambia la cascada.

**Detalle del paso 8.**
- **M3: pickers.** Los 13 pickers se revisaron en vivo. El `htmlFor` de cada uno apunta a un id que existe, y también existe `<id>-label`.
  - `DatePickerField.tsx:53-54` nombra el trigger con la etiqueta y la fecha: «Fecha 09/10/2026», «Fecha próxima * Seleccionar fecha».
  - `TimePickerField.tsx:53-54` es un `role="group"` con el nombre de su etiqueta («Hora», «Hora de captura», «Hora próxima *»). Sus inputs se llaman «Hora» y «Minutos».
  - Pickers cubiertos: `sale-date` (seller1), `sale-dir-date`, `sale-atc-date`, `edit-sale-date`, `task-date/time`, `edit-task-date/time` y los de ejecución, captura y próximo paso de ActivityForm.
  - Los dos de `EditTaskForm`, que el Implementer solo revisó en el código, se comprobaron en vivo con `R/live3.cjs` (calculados a mano, por N9): «Fecha 05/10/2026» y el grupo «Hora».
- **N3: ids únicos en Ventas.** Con el 400 falso se muestran los errores de Dirección y de ATC a la vez. Aparecen 9 ids `*-error`, todos únicos, y cada `aria-describedby` apunta a un nodo que existe. Captura: `ventas-ad-400-1440-light.png`.
- **N4/N5: combobox.** En vivo, `#clientId` tiene `role=combobox`, `aria-invalid="true"` y `aria-describedby="clientId-error"`, que apunta a «Selecciona un cliente para actividades comerciales.». El error es local (`:220`) y no hay petición. Captura: `actividades-form-error-1440-light.png`.

**Lógica.** Los diffs de los módulos solo tocan:
- `className`;
- atributos `id`, `htmlFor`, `aria-*` y `role`;
- los imports de `PIPELINE_STAGES`, `ROLE_LABELS` y `SALE_TYPE_LABELS`.

En concreto:
- Los payloads, schemas, hooks, mutaciones y handlers no cambian.
- `REQUIRES_NEXT_STEP` sigue en `ActivityForm.tsx:157`.
- `PIPELINE_STAGES` reproduce el orden de los arrays locales que reemplaza.
- `TimePickerField` emite el mismo valor `HH:mm`.
- Los pickers nuevos solo reciben `id` opcional y `...ariaProps`.

## Comparación de la lámina

Script del Implementer (`R/lamina.cjs`) a 1440, con `reducedMotion: "reduce"`, una espera de 1500 ms y `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`, porque en el popup `document.fonts` se queda en «loading» (pendiente 4 del impl, un bug previo).

| Captura | Tamaño | sha256 (12) frente a `lamina-before` | Píxeles distintos |
|---|---|---|---|
| `lamina-1440-light.png` | 1440x1719 | `0565473d5536`, idéntico | 0 |
| `lamina-1440-dark.png` | 1440x1719 | idéntico | 0 |
| `popup-1440-light.png` | 1440x1719 | `d70b08b1eff3`, idéntico | 0 |
| `popup-1440-dark.png` | 1440x1719 | idéntico | 0 |

`git diff HEAD` de `ExecutiveSlide.tsx`, `LaminaPage.tsx` y `routes/lamina.tsx` está vacío. El guard bloqueó 0 peticiones.

## Comparación de rutas (1440, claro, admin)

Comparación píxel a píxel con `R/cmp2.cjs`. Las bandas de diferencia se revisaron en `R/crops/`.

| Vista | Base | Diff | Causa |
|---|---|---|---|
| coaching, reportes, equipo, configuración, import-export | phase-011/review | 0.02-0.03 % | kbd «Ctrl K» y las iniciales del avatar en el header y el sidebar (el cambio del paso 6), más el badge de las devtools |
| mi-dia, agenda, actividades/nueva | phase-010/review | 0.02 % | los mismos 251 px del paso 6 |
| ventas | phase-010/review | 1.44 % | Tipo legible (`atc` pasa a «ATC», etc.), con un desplazamiento de 2 px en la columna (N7 de 010, esperado) |
| dashboard | phase-009 | 0.14 % | marcas de tiempo y datos |
| pipeline | phase-009 (después del drag) | solo datos | mismo estilo de columnas y del scroll |
| clientes, detalle de cliente | phase-009 | datos | mismo estilo, y los botones de etapa en el mismo orden |
| login | phase-011/review | 0.41 % | N1 de 011, aplicado por el Líder en HEAD `f543ea6` (Labels `text-sm text-muted-foreground`). No es de 012. |

Ningún cambio de estilo inesperado.

## Contraste (texto 4.5:1; iconos 3:1)

Medido con Playwright sobre el fondo compuesto real.

| Elemento | Claro | Oscuro |
|---|---|---|
| kbd «Ctrl K» (`Header.tsx:37`) | 18.16 | 14.5 |
| Iniciales del avatar (`avatar.tsx:50`) | 18.16 | 14.5 |
| Contacto vencido en MiDia (`MiDiaPage.tsx:626`), sobre `rgb(254,242,243)` | 18.11 | 18.17 |
| Icono del contacto vencido (no es texto) | 4.34 | 7.34 |
| FieldError `text-status-danger` sobre background | 6.42 | 6.85 |
| FieldError sobre card | 6.42 | 6.85 |
| FieldError sobre popover (inyectado) | 6.42 | 6.21 |
| FieldError dentro de un popover real | 6.42 | 6.21 |
| FieldError reales (Ventas 400 y ActivityForm) | 6.42 | 6.85 |

Todo pasa. El cambio del Líder en `FieldError.tsx:9` (`text-destructive` a `text-status-danger`) resuelve el pendiente 2 del impl.

## Hallazgos

### Bloqueantes

Ninguno.

### Menores

Ninguno.

### Notas

- **N1. `DESIGN.md:235` sigue diciendo «mensaje `text-xs text-destructive`».** Responsable: Líder.
  - Arreglo: cambiar a `text-xs text-status-danger`, para que coincida con `FieldError.tsx:9`.
- **N2. El scrollbar global (`index.css:202-214`) sigue con el hex `#cbd5e1` en `:211`.** No tiene tema oscuro. Ya pasaba antes y es el pendiente 3 del impl. Responsable: Líder, cuando decida.
  - Arreglo: `background: var(--border);`, o bien acotarlo a la lámina.
- **N3. En Safari, el scrollbar del pipeline se ve distinto** desde que se borraron las reglas webkit de `.pipeline-scroll`. Chromium no cambia, porque ignora `::-webkit-scrollbar` cuando hay `scrollbar-color` (`PipelinePage.tsx:83-87`). Es el pendiente 9 del impl. Responsable: Líder.
  - Arreglo: aceptarlo, o añadir `[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border` en ese `className`.
- **N4. `TYPE_TAG` tiene claves muertas** que no coinciden con los tipos reales (Videoconferencia, Visita física y WhatsApp), así que esas tareas caen en `gray`. Ya pasaba antes y está fuera de scope. Responsable: Implementer, en un follow-up.
  - Claves: `Videoconf` (`task-card.constants.ts:5`), `Visita` (`:7`) y `WA` (`:13`), más `Videoconf` en `CalendarView.tsx:33`.
  - Arreglo: renombrar las claves al valor real del enum del tipo de tarea.
- **N5. `AvatarGroupCount` (`avatar.tsx:95`) sigue con `bg-muted text-muted-foreground`,** que mide 4.35 en claro. Tiene 0 usos, así que el fallo es latente. Es el pendiente 5 del impl. Responsable: Implementer.
  - Arreglo: `text-foreground`, igual que en `:50`.
- **N6. Hay errores sin `aria-describedby`, fuera del alcance de N4/N5.** Es el pendiente 6 del impl. Responsable: Implementer, en un follow-up.
  - El grupo `activity-next-time` (`ActivityForm.tsx:780`) solo tiene `aria-invalid`. Arreglo: `aria-describedby={fieldErrors.nextTime ? "nextTime-error" : undefined}`.
  - `ClientCombobox` no recibe `aria-describedby` en `CreateTaskForm`, `EditTaskForm` ni `SalesPage`. Arreglo: el mismo patrón que `ActivityForm.tsx:321`.
- **N7. Los ids de los FieldError de Dirección son genéricos** (`date-error`, `product-error`, `units-error`, `amount-error` y `notes-error`; `SalesPage.tsx:690-794`). Ahora son únicos, porque ATC usa `atc-*`, pero podrían chocar con otro formulario de la misma página. Opcional. Responsable: Implementer.
  - Arreglo: prefijo `dir-` en los `fieldErrorProps` de Dirección y en el `name` de sus `FieldError`.
- **N8. El comentario de `KanbanColumn.tsx:42`** sigue diciendo que la regla legacy «se puede borrar en 012». Ya está borrada. Es el pendiente 7 del impl. Responsable: Implementer.
  - Arreglo: borrar la frase.
- **N9. Al pulsar Enter en un chip del calendario se abren dos diálogos,** «Crear tarea con objetivo» y «Editar tarea». Es la M4 de la review 010, que sigue abierta y no es de 012. El árbol de accesibilidad del diálogo de edición sale vacío porque lo tapa el otro modal. Responsable: Implementer, en la fase que corresponda.
- **N10. Hay archivos sin seguimiento que no son de 012:** `progress/fichero`, `progress/jev-backtest-etiquetado.md` y `progress/jev-backtest-lote.json`. `plans/012-redesign-cleanup.md` y `plans/README.md` aparecen modificados (lo segundo lo pide el plan). Responsable: Líder.
  - Arreglo: no incluirlos en el commit de 012, salvo `plans/README.md`.

Pendientes del impl que no son hallazgo:
- el 1 (los alias de Badge se conservan porque se usan) es correcto;
- el 8 (candidatos viejos de Tailwind en memoria del dev server) no aparece en el build;
- el 10 (la lámina a 390 y su contraste interno) sigue abierto por decisión, como la N8 de 011.

## Salida de gates y rg

```
$ pnpm run typecheck   -> exit 0
$ pnpm run lint        -> exit 0
$ pnpm run build       -> exit 0   (✓ built in 1.18s)
  aviso previo: [INEFFECTIVE_DYNAMIC_IMPORT] @atlaskit/pragmatic-drag-and-drop/.../adapter.js

$ rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules frontend/src/shared frontend/src/components
  82  reports/presentation/components/ExecutiveSlide.tsx   (lámina, permitido)
   4  reports/presentation/pages/LaminaPage.tsx            (lámina, permitido)
   4  reports/presentation/pages/ReportsPage.tsx           (:37 STORAGE_KEY "tracker-report-goals"; :230, :232 y :235 popup, intocable)
   1  shared/store/app.store.ts:31                         (clave de persist "tracker-sales-app", falso positivo)
   1  import-export/application/hooks/useExportData.ts:12  (prefijo "tracker-backup-", falso positivo)
  total 92 líneas (R/rg-step5.txt)

$ rg de los 68 selectores legacy y los 18 tokens borrados en frontend/src (estáticos y dinámicos)
  0 coincidencias fuera de index.css de HEAD

$ rg -n "variant=\"success\"" frontend/src
  0 coincidencias (MiDiaPage.tsx:396 es `variant: "success"` de una alerta local)

$ rg -n "PIPELINE_STAGES|ROLE_LABELS" frontend/src
  constants.ts:37 y :49; ClientesPage.tsx:15; PipelinePage.tsx:19; ClientDetailPage.tsx:9; ActivityForm.tsx:6; nav-user.tsx:15; EquipoPage.tsx:60

$ git diff HEAD --stat -- ExecutiveSlide.tsx LaminaPage.tsx routes/lamina.tsx
  (vacío)
```

## Capturas

En `progress/redesign/phase-012/review/` (27 archivos):
- Lámina: `lamina-1440-{light,dark}.png` y `popup-1440-{light,dark}.png`.
- Rutas (`routes/`): `login-1440-light.png` y `admin-{mi-dia,dashboard,clientes,clientes-detalle,pipeline,agenda,actividades-nueva,ventas,coaching,reportes,equipo,configuracion,import-export}-1440-light.png`.
- Flujos:
  - `ventas-ad-400-1440-light.png`: Dirección y ATC con el 400 falso;
  - `agenda-create-task-1440-light.png` y `agenda-edit-task-1440-light.png`;
  - `actividades-form-error-1440-light.png` y `actividades-form-next-1440-light.png`;
  - `seller1-mi-dia-1440-{light,dark}.png` y `seller1-mi-dia-overdue-1440-{light,dark}.png`, con el reloj fijado a 2026-10-09T12:00-06:00 para que haya filas vencidas.

## Qué debe revisar el Líder a ojo

1. `ventas-ad-400-1440-light.png`: la columna Tipo legible y los errores de Dirección y ATC a la vez.
2. `seller1-mi-dia-overdue-1440-{light,dark}.png`: el contacto vencido en `text-foreground` sobre el tinte.
3. Safari (N3): el scrollbar del pipeline, si importa en esa plataforma.
4. N1 y N10 antes del commit: `DESIGN.md:235` y qué archivos sin seguimiento entran.
