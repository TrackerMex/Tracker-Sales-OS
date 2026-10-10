# Impl 81-012: limpieza final del rediseño

- **Rama:** `81-visual-redesign`, HEAD `f543ea6`, sin commit.
- **Plan:** `plans/012-redesign-cleanup.md`.
- **Estado:** DONE, pendiente de review. No se alcanzó ninguna condición de STOP.

## Diff

Se modificaron 21 archivos en `frontend/src`, con 114 inserciones y 672 borrados. El cambio que aparece en `plans/012-redesign-cleanup.md`, en la frase sobre el push a `dev`, es una edición anterior del Líder; no es mío.

## Cambios por paso

### 1. Clases legacy (`index.css`)

El archivo pasa de 823 a 252 líneas. Se borró entero el bloque legacy de `@layer components`: 68 nombres de selector, todos con 0 usos en `frontend/src` según rg, contando también la lámina. El listado completo está en «CSS y tokens borrados».

La lámina no usa ninguna clase legacy: solo usa utilidades `tracker-*`. Por eso el comentario «Lámina ejecutiva» marca los tokens (paso 2) y no un bloque de clases.

### 2. Tokens

**Borrados**, con 0 usos fuera de `index.css`:
- `--tracker-blue`, `--tracker-surface`, `--tracker-danger` y `--tracker-warning`, cada uno con su `--color-tracker-*`.
- `--sp-1` a `--sp-12` y `--page-gap`.
- `--sidebar-width: 276px`. shadcn ya lo define inline en el `SidebarProvider`.

**Conservados** (14), en un `:root` con el comentario «Lámina ejecutiva» y en `@theme inline` bajo `/* Lámina ejecutiva only */`:
- dark, green, bg, surface-alt, border;
- text, text-secondary, text-muted, text-dim;
- danger-dark, success, success-dark, warning-dark, purple.

Con `@theme inline`, las utilidades compilan a `var(--tracker-*)`. Por eso hay que conservar también las variables de `:root`.

### 3. Variantes

- **Button:** se quitó la variante `success`.
- **Badge:** se quitaron `red`, `purple`, `blue` y `yellow`. Se mantienen `navy`, `green`, `amber` y `gray`, porque las usa `TYPE_TAG` en tasks, que también lee MiDia. Se actualizó el comentario.

### 4. Montserrat

Se queda. La usan `ExecutiveSlide` y `/lamina`. En `main.tsx` se añadió un comentario que lo explica, y `package.json` y el lockfile no se tocaron.

### 5. Barrido rg

Ver «Barrido del paso 5». Solo quedan la lámina, el popup y tres falsos positivos.

### 6. Contraste

Se cambió `text-muted-foreground` por `text-foreground` en el `kbd` "Ctrl K" (`Header.tsx`) y en `AvatarFallback` (`avatar.tsx:50`). Ver «Contraste».

### 7. Etapas y scrollbar

- `ClientesPage` (`pipelineStages`) y `PipelinePage` (`ALL_STAGES`) usan ahora `PIPELINE_STAGES.map`.
- `ClientDetailPage` usa `STAGE_ORDER = PIPELINE_STAGES.filter((s) => s !== "Perdido")`.
- Se borraron las reglas `.pipeline-scroll::-webkit-scrollbar*`.
- La clase `pipeline-scroll` se queda en el markup solo como gancho para los scripts de QA, y el comentario de `PipelinePage` lo dice. El scrollbar ya lo definen las utilidades.

### 8. Review 010 e impl 011

**M3: `id` en los pickers**
- `DatePickerField` y `TimePickerField` aceptan un prop `id` opcional.
- En la fecha, el botón recibe `id` y `aria-labelledby="ID-label ID"`, así que su nombre accesible es la etiqueta más la fecha.
- En la hora, el contenedor es `role="group"` con `aria-labelledby="ID-label"`. Los inputs tienen `aria-label` «Hora» y «Minutos», y el `id` va en el de la hora.
- Los 13 `Label` llevan `htmlFor` e `id="ID-label"`:

| Archivo | Ids |
|---|---|
| CreateTaskForm | task-date, task-time |
| EditTaskForm | edit-task-date, edit-task-time |
| EditSaleModal | edit-sale-date |
| ActivityForm | activity-exec-date, activity-exec-time, activity-capture-date, activity-capture-time, activity-next-date, activity-next-time |
| SalesPage | sale-date, sale-dir-date, sale-atc-date |

**N3: ids de los FieldError en Ventas**
- En la sección ATC, los nombres de `fieldErrorProps` y `FieldError` pasan a ser `atc-date`, `atc-units`, `atc-amount` y `atc-notes`.
- Ya no se repiten con los de Dirección.
- Las llamadas a `clearField` no cambian.

**N4/N5: combobox de cliente**
- `ClientCombobox` acepta `aria-describedby`.
- `ActivityForm` le pasa `error={!!(clientError || fieldErrors.clientId)}` y `aria-describedby="clientId-error"` cuando hay error.

**N7: columna Tipo**
- `SALE_TYPE_LABELS` (`seller`: Vendedor, `atc`: ATC, `direction`: Dirección), con fallback al valor crudo.

**N11: contacto vencido en MiDia**
- El texto del contacto es `text-foreground`.
- El icono se queda en `text-muted-foreground`.

**Impl 011, pendiente 1: `ROLE_LABELS`**
- Se exporta desde `shared/lib/constants.ts`.
- `nav-user.tsx` y `EquipoPage.tsx` lo importan y ya no tienen copias locales.

### 9. Gates

Exit 0. Ver «Gates».

## CSS y tokens borrados

Los 68 selectores legacy, por familias:
- `.card`, `.card-header`, `.page-title`;
- `.input*`, `.tag*`, `.kpi-*`, `.seller-*`, `.alert-item*`, `.dt*`, `.dt-scroll`;
- `.sb-*`, `.navbtn*`;
- `.pipeline-scroll` y sus `::-webkit-scrollbar*`, `.pipe-col*`;
- `.task-item`, `.thermo-alert*`, `.modal-blur`;
- las media queries asociadas.

`pipe-col` y `pipeline-scroll` siguen en el markup como ganchos, sin regla CSS. Sus reglas antiguas ya quedaban anuladas por las utilidades.

Los tokens borrados y los conservados son los del paso 2.

**Se quedan sin cambios en `index.css`:**
- El scrollbar global `::-webkit-scrollbar`: 5px, track transparente, thumb `#cbd5e1` y radio 99px. Tiene un comentario y sigue en `@layer components`.
- El bloque de `prefers-reduced-motion`.
- El bloque del sidebar mini.

La copia del archivo original está en el scratchpad, en `i012/index.css.orig`.

## Comparación de la lámina

Las capturas se hicieron a 1440, en claro y oscuro, como admin, en `http://localhost:3001`:
- **Antes:** `progress/redesign/phase-012/lamina-before/`, capturado antes de tocar `index.css`.
- **Después:** `progress/redesign/phase-012/lamina-after/`, con Vite ya sirviendo el CSS limpio.

| Captura | Antes (sha256, 16 caracteres) | Después |
|---|---|---|
| lamina-1440-light | 0565473d55368106 | 0565473d55368106 |
| lamina-1440-dark | 0565473d55368106 | 0565473d55368106 |
| popup-1440-light | d70b08b1eff306e7 | d70b08b1eff306e7 |
| popup-1440-dark | d70b08b1eff306e7 | d70b08b1eff306e7 |

Las capturas son idénticas píxel a píxel.

**Notas sobre la captura:**
- La lámina y el popup no dependen del tema: el popup no tiene clase de tema, así que el claro y el oscuro coinciden.
- Para que fuera determinista, aborté los hosts externos (Google Fonts), así que el popup se renderiza con fuentes fallback.
- El `document.fonts` del popup nunca termina de cargar, así que capturé con `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`. Dos ejecuciones dieron el mismo hash.

## Contraste

Medido con Playwright sobre el fondo compuesto. Archivo: `progress/redesign/phase-012/contrast-after.json`.

| Elemento | Antes (reviews 008, 010, 011) | Claro | Oscuro |
|---|---|---|---|
| kbd "Ctrl K" | 4.35 | 18.16 | 14.5 |
| Iniciales del Avatar | 4.35 | 18.16 | 14.5 |
| Contacto vencido en MiDia (seller1, 1 fila vencida) | 4.34 | 18.11 | 18.17 |

Todos superan 4.5.

## Nombres accesibles

Comprobados en claro con CDP. Archivo: `progress/redesign/phase-012/ax-after.json`.

**Fechas:** el nombre es la etiqueta más la fecha. Por ejemplo:
- «Fecha de ejecución 09/10/2026»;
- «Fecha 12/09/2026», en el modal de edición de venta;
- «Fecha próxima * Seleccionar fecha».

**Horas:** el grupo toma el nombre de su etiqueta («Hora», «Hora de captura», «Hora próxima *») y el input de la hora se llama «Hora».

**Cobertura:** de los 13 pickers, 12 se verificaron en vivo. Los dos de `EditTaskForm` (edit-task-date y edit-task-time) se revisaron solo en el código, porque siguen el mismo patrón.

**N4/N5, en vivo:** el combobox tiene `aria-invalid="true"` y `aria-describedby="clientId-error"`, que apunta a «Selecciona un cliente para actividades comerciales.». El handler sale antes de enviar, así que no hay POST.

**N7, en vivo:** los badges de Tipo muestran «ATC», «Dirección» y «Vendedor».

**N3, solo en el código:** los FieldError aparecen solo tras un 400 de la API, que no se puede provocar en solo lectura. Los ids son ahora `atc-*-error`, distintos de los de Dirección (`date-error` y los demás).

**Peticiones:** el guard de Playwright bloqueó 0 peticiones distintas de GET.

## Gates

`pnpm run typecheck && pnpm run lint && pnpm run build` sale con exit 0.

La única salida aparte de las líneas normales del build es el aviso preexistente `[INEFFECTIVE_DYNAMIC_IMPORT]` de `@atlaskit/pragmatic-drag-and-drop`, que importa `CalendarView`.

El CSS del build (`dist/assets/index-xnP4Wkdv.css`, 128.27 kB, 20.59 kB en gzip) contiene:
- solo los 14 tokens tracker conservados;
- 0 clases legacy;
- el scrollbar global.

El log completo está en el scratchpad, en `i012/gates.log`.

## Barrido del paso 5

Comando: `rg -n "#[0-9a-fA-F]{3,6}\b|tracker-|text-slate-|text-\[[0-9]+px\]" frontend/src/modules frontend/src/shared frontend/src/components`

| Coincidencias | Archivo | Motivo |
|---|---|---|
| 82 | `reports/.../ExecutiveSlide.tsx` | lámina, permitido |
| 4 | `reports/.../LaminaPage.tsx` | lámina, permitido |
| 4 | `reports/.../ReportsPage.tsx` | popup (230, 232, 235) más la clave de storage `tracker-report-goals` (37) |
| 1 | `shared/store/app.store.ts:31` | clave de storage `tracker-sales-app`, falso positivo |
| 1 | `import-export/.../useExportData.ts:12` | nombre de archivo `tracker-backup-`, falso positivo |

No queda ningún uso de colores o tokens legacy fuera de la lámina y el popup.

**Comprobaciones de 0 usos con rg en todo `frontend/src`:**
- 68 selectores legacy;
- los tokens borrados, `--sp-*` y `--page-gap`;
- las variantes de Badge y Button. typecheck también lo garantiza.

## Evidencia

- `progress/redesign/phase-012/lamina-before/` y `lamina-after/`, con 4 PNG en cada carpeta.
- `progress/redesign/phase-012/contrast-after.json`.
- `progress/redesign/phase-012/ax-after.json`.
- En el scratchpad de la sesión (`i012/`):
  - los scripts `lamina.cjs`, `contrast.cjs` y `axcheck.cjs`;
  - `gates.log` y `classes.txt`;
  - `index.css.orig`.

## Pendiente Líder

1. **Alias de Badge:** `TYPE_TAG` (tasks) sigue usando los alias `navy`, `green`, `amber` y `gray`. Se conservaron porque se usan.
2. **Color de `FieldError`:** usa `text-destructive` y no `text-status-danger`.
3. **Scrollbar global sin verificar:** las capturas headless ocultan el scrollbar, así que el global que se conservó no se puede verificar píxel a píxel. Además, sigue con el hex `#cbd5e1`.
4. **Popup de la lámina:** `document.fonts` se queda en «loading» para siempre (Montserrat Variable). Es un bug del popup hecho con `document.write`, fuera del scope de este plan.
5. **`AvatarGroupCount`:** no tiene usos y sigue con texto muted.
6. **Errores sin `aria-describedby`:**
   - `nextTime` y los TimePicker solo tienen `aria-invalid`.
   - `task-client`, `sale-client` y `edit-task-client` no pasan `aria-describedby` al `ClientCombobox`. Esos archivos o esos cambios quedaban fuera del scope permitido.
7. **Comentario de `KanbanColumn`:** sigue diciendo «se puede borrar en 012». El archivo estaba fuera de scope.
8. **CSS viejo en el dev server:** Vite guarda en memoria candidatos antiguos de Tailwind, como `bg-[var(--tracker-blue)]`. No están en ningún archivo y no aparecen en el build. Desaparecen al reiniciar el dev server, y eso solo lo puede hacer el usuario.
9. **Scrollbar en Safari:** al quitar las reglas webkit de `.pipeline-scroll`, el scrollbar del pipeline se ve distinto en Safari. Chromium ignora `::-webkit-scrollbar` cuando hay `scrollbar-color`.
10. **Lámina (`ExecutiveSlide`):** el recorte a 390 y el contraste interno de la review 011 (N8) siguen abiertos. Por decisión, la lámina no se toca.

## Fixes post-review

La review es `progress/review_81-012-cleanup.md`. Solo apliqué N4, N6 y N8, como pidió el Líder. No toqué `DESIGN.md`, `index.css` ni `avatar.tsx`, porque los está editando el Líder.

### N4: claves muertas de los mapas de color

El tipo de tarea es `string | null`. Sus valores reales son los de `TASK_TYPES` en `CreateTaskForm` y `EditTaskForm`, que coinciden con `ActivityType` de `shared/lib/constants.ts` y con el enum del backend.

**Cambios:**
- `task-card.constants.ts`: `Videoconf` pasa a ser `Videoconferencia`, `Visita` pasa a ser `"Visita física"` y `WA` pasa a ser `WhatsApp`.
- `CalendarView.tsx`: `Videoconf` pasa a ser `Videoconferencia` (línea 33) y `Visita` pasa a ser `"Visita física"` (línea 35). Esta segunda clave también estaba muerta y no aparecía en la review.

**Comprobación:** todas las claves que quedan en `TYPE_TAG` y `TYPE_ACCENT` están en `TASK_TYPES`. rg no encuentra `Videoconf`, `Visita` ni `WA` como clave en `frontend/src` ni en `backend/src`. Solo cambió el mapeo de color.

### N6: `aria-describedby` en los errores

**Hora próxima:** el grupo `activity-next-time` de `ActivityForm.tsx` recibe `aria-describedby={fieldErrors.nextTime ? "nextTime-error" : undefined}`. `TimePickerField` ya pasaba ese prop al grupo.

**Selector de cliente:** el `ClientCombobox` recibe `aria-describedby="clientId-error"` cuando hay error, con el mismo patrón que `ActivityForm`. Se aplicó en:
- `CreateTaskForm` (`task-client`);
- `EditTaskForm` (`edit-task-client`);
- `SalesPage` (`sale-client`, con `sellerErrors.fieldErrors.clientId`).

En los tres casos el id existe, porque el `FieldError` tiene `name="clientId"` y renderiza el id `${name}-error`. En `SalesPage` es el único `FieldError` llamado `clientId`.

### N8: comentario de `KanbanColumn`

En `KanbanColumn.tsx:42` borré la frase «so the legacy rule can be deleted in 012».

### Gates

`pnpm run typecheck && pnpm run lint && pnpm run build`, ejecutado desde `frontend/`, sale con exit 0. Solo aparece el aviso preexistente `INEFFECTIVE_DYNAMIC_IMPORT` de atlaskit. El log está en el scratchpad, en `i012/gates-postreview.log`.

Ese build también incluye los cambios que el Líder tiene en curso en `index.css` y `avatar.tsx`.

### Corrección al pendiente 2

`FieldError` ya usa `text-status-danger`. El cambio está en el working tree y no es mío; HEAD usaba `text-destructive`.
