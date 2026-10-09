# Review 81-008: Patrones compartidos + Dashboard y Mi día

**Veredicto: FAILED.** Hay 1 bloqueante, 3 menores y 7 notas.

El bloqueante es el contraste AA en modo claro de las pills de estado y del delta del leaderboard. Se corrige en un solo sitio (`shared/lib/status.ts`) y en una línea de `LeaderboardTable`. Todo lo demás del plan cumple:
- scope;
- rg;
- gates;
- piezas;
- chart.js en vivo;
- h1;
- overflow;
- AlertDialog.

Las dos comprobaciones del coordinador no son fallos de la fase.
- La línea invisible en la captura clara es un artefacto de captura a mitad de la animación de entrada.
- La serie del gráfico es el mismo campo y la misma agregación que en 55b22e1.

Evidencias en `/tmp/claude-1002/-home-claude-sites/46174aa5-793e-4fa7-8eab-bf421086715c/scratchpad/review008/` (en adelante `R/`). Contiene los scripts `*.cjs`, `live/report.json`, las capturas `live/*.png` y los logs de gates `gate-*.log`.

## Comprobaciones del coordinador

### 1. Línea del gráfico invisible en `phase-008/admin-1440-light/dashboard.png`

**Conclusión: es un artefacto de captura, no un fallo. No es bloqueante.** Un usuario real ve la línea en menos de 1 s.

- **El color resuelve bien.** Medido en vivo, `--primary` llega a chart.js como `rgba(23, 23, 23, 1)` en claro y `rgba(229, 229, 229, 1)` en oscuro.
  - No es transparente ni el color del fondo.
  - Ya está resuelto en el primer frame dibujado, y la clase de `<html>` ya es `light`.
  - No hay lectura previa al CSS: `R/entry-pixels.cjs` registra cada frame con `borderColor` correcto desde el primero.
- **Causa de la captura vacía.** El gráfico se monta con `data=[]` mientras carga la query (`DashboardPage.tsx:221`, `trend.data ?? []`, renderizado en `:294`) y luego recibe los 14 puntos. La animación de entrada de chart.js arranca los puntos fuera del área del gráfico, así que se recortan:
  - en el primer frame, `y=200` con `chartArea.bottom=173`;
  - y `x` del último punto en 7800 con `chartArea.right=599`.
  - Durante unos 150 ms el canvas pinta ejes y rejilla 0-4 sin ningún píxel de línea. En `R/entry-pixels.cjs` los frames 1-3 tienen `dark=0`; desde el frame 4 hay de 640 a 940 píxeles oscuros.
  - Eso coincide exactamente con la captura del Líder: ejes 0-4 con 0 píxeles oscuros (`R/leader-light-crop.png`).
- **Por qué la captura cayó ahí.** Las capturas del Líder corrieron 4 sesiones en paralelo, todos los `dashboard.png` entre las 18:50:24 y las 18:50:25, con `networkidle` + 800 ms.
  - Reproduciendo ese procedimiento con 4 sesiones en paralelo (`R/repro-shots.cjs`), a +800 ms el gráfico seguía animando en las 4.
  - `R/repro-L1.png` captura otro frame intermedio, con la línea comprimida a la izquierda.
  - En una sesión sola, a +800 ms ya está asentado (`R/anim-diag.cjs`).
- **Mismo patrón que 55b22e1.** El original también montaba `<ActivityChart data={trend.data ?? []} />`. La animación de entrada no es nueva.
- **Para capturas estables.** Esperar al menos 2 s, o emular `reducedMotion: 'reduce'` una vez que se corrija el menor M1. Opcional: mostrar `Skeleton` hasta que `trend` cargue, para que el gráfico se monte ya con datos (nota N5).

### 2. Datos: antes 4.0 en 10-09, después pico en 2 y total 22

**Conclusión: no hay cambio de lógica.** Es el mismo campo y la misma agregación.

- **Código.** En 55b22e1, `labels = data.map(d => d.date.slice(5))` y la serie `data.map(d => d.count)`. En la versión actual, `DashboardPage.tsx` dentro de `ActivityChart` (106-130) hace exactamente lo mismo, y el hook `useActivityTrend` no cambió: el diff de `application/`, `domain/` e `infrastructure/` está vacío.
- **API.** La respuesta de `/dashboard/activity-trend`, campo `count` por día del 09-26 al 10-09:
  - 09-26 a 09-29: 1, 2, 2, 1;
  - 09-30 a 10-03: 1, 2, 1, 2;
  - 10-04 a 10-07: 1, 1, 1, 1;
  - 10-08 y 10-09: 2, 4.
  - Suman 22, que es el total de la cabecera (`DashboardPage.tsx:222`, `reduce` del mismo `count`). El máximo es 4, el `yMax` real del eje.
- **El "pico en 2".** Sale de un frame a mitad de animación en la captura oscura: el espaciado de vértices no coincide con el de las etiquetas. Asentado, el punto 10-09 vale 4 (`R/diag-light.json`, `R/chart-light-settled.png`).
- **El eje 0-4 a pasos de 1.** Antes iba a pasos de 0.5. Es presentación: `ticks.precision: 0` en `chart.ts`.

## Criterios

| Criterio | Resultado | Evidencia |
|---|---|---|
| Existen las 6 piezas y `status.ts` | PASS | `shared/components/layout/{PageHeader,DottedDivider}.tsx`, `shared/components/data/{StatCard,StatusBadge,EmptyState,DataTable}.tsx`, `shared/lib/{status,chart}.ts` |
| rg de clases legacy del plan | PASS (0) | exit 1 sin resultados |
| rg de hex y `tracker-` del plan | PASS (0) | exit 1 sin resultados |
| rg extra de `text-slate-`, `text-\[[0-9]+px\]` y `variant="success"` en dashboard y mi-dia | PASS (0) | lo mismo en las piezas nuevas |
| `KPICard.tsx` y `OverdueTasksList.tsx` borrados, sin referencias | PASS | `git status` D; `rg` 0 |
| Scope de 008 limitado a dashboard, mi-dia, las piezas nuevas y `shared/lib` | PASS | Por mtime (≥ 18:30): ver el detalle bajo la tabla. |
| Diff vacío en application, domain e infrastructure | PASS | `git diff --stat 55b22e1` vacío en los 6 directorios |
| Gates `typecheck`, `lint` y `build` | PASS | exit 0 en los tres (`R/gate-*.log`); el build solo muestra el aviso previo `INEFFECTIVE_DYNAMIC_IMPORT` |
| Un solo mapa en `status.ts` | PASS, parcial | Cubre `PipelineStage` (7), `TaskStatus` (2), `ActivityStatus` (4) y `ClientType` (3). Falta `PaymentMethod` (M3). |
| Sin mapas de color propios en dashboard y mi-dia | PASS | `TONE` (AlertsPanel), `ALERT_TONE` y `RANK_TONE` traducen a `StatusTone`, no a colores |
| Regla AA de "Pendiente" | PASS | pill y tile `text-foreground` sobre `bg-chart-4/15`: 18.21:1 en claro, 14.57:1 en oscuro |
| chart.js lee los colores de las CSS vars | PASS | ver el detalle bajo la tabla |
| Cambio de tema en vivo | PASS | toggle del header de claro a oscuro y vuelta, sin recargar |
| Sin listeners ni observers colgados | PASS | observers en `<html>` con filtro `class`: 1 con el dashboard montado, 0 tras navegar a `/mi-dia` |
| Un h1 por página | PASS | 7 vistas: "Dashboard de ventas" y "Mi día" (picker, vendedor seleccionado y vista seller1) |
| Contraste AA en oscuro | PASS | 0 fallos en dashboard (90 textos) y Mi día (59) |
| **Contraste AA en claro** | **FAIL** | B1 |
| Foco visible | PASS | Picker, ordenación de DataTable, hints de StatCard y botones: todos con indicador. En los tres primeros es débil (N1). |
| Filas clicables operables con teclado | FAIL, previo | M2 |
| Sin page errors ni errores de consola | PASS | 0 en las 7 sesiones (`R/live/report.json`) |
| Sin overflow horizontal a 390 | PASS | `scrollWidth - clientWidth = 0` en dashboard y en Mi día |
| AlertDialog "completar tarea" | PASS | ver el detalle bajo la tabla |
| `prefers-reduced-motion` (DESIGN.md:286) | FAIL | M1 |
| Impl con piezas, props y decisiones | PASS | `progress/impl_81-008-patterns-dashboard.md` |

Detalle de algunas filas:
- **Scope.** Por mtime (≥ 18:30), 008 solo tocó dashboard, mi-dia, `shared/components/data/*`, `PageHeader`, `DottedDivider`, `shared/lib/{chart,status}.ts`, más `plans/README.md` y el impl. `index.css` es de 006/007 (18:16). No toca `components/ui`, el shell 007, la lámina ni el backend.
- **Colores de chart.js.** En claro, línea `rgba(23,23,23,1)`, grid `rgba(229,229,229,1)` y ticks `rgba(115,115,115,1)`. En oscuro, línea `rgba(229,229,229,1)`, grid blanco al 10 % y ticks `rgba(161,161,161,1)`. El dash es `[4,4]`.
- **AlertDialog.** Como seller1, en la tarea "Completar":
  - se abre con el título "¿Completar esta tarea?";
  - el foco entra al diálogo;
  - Cancelar lo cierra y el foco vuelve al trigger;
  - la tarea sigue pendiente; **no se confirmó**.
  - Admin no ve "Completar" (0 botones), igual que antes.
  - Captura: `R/live/seller-midia-1440-light-alertdialog.png`.

## Hallazgos

### Bloqueante

**B1. Las pills de estado y el delta no llegan a AA en modo claro.**

DESIGN.md:282 exige WCAG AA en claro y oscuro. Medido en vivo con Playwright, con el color de texto compuesto sobre el fondo real (el tinte alfa sobre `bg-background`):

| Origen | Clase | Contraste en claro | Dónde se ve |
|---|---|---|---|
| `shared/lib/status.ts:20`, danger | `bg-destructive/10 text-destructive` | 3.97:1 (necesita 4.5) | Scores del semáforo (42.7, 44.5, 14.5, 0) y badges de StatCard en Mi día (0 %, 10 %, 20 %) |
| `shared/lib/status.ts:18`, progress | `bg-chart-1/10 text-chart-1` | 3.12:1 | Pill de rango 3 del leaderboard; también "En curso", "Negociación" y "Propuesta" en 009-010 |
| `shared/lib/status.ts:17`, success | `bg-chart-2/10 text-chart-2` | 3.24:1 | Badge "250 %" en Mi día; también "Cierre", "Completada" y "Nuevo" |
| `dashboard/presentation/components/LeaderboardTable.tsx:27` | `text-chart-2` sobre el fondo | 3.67:1 (14px, medium) | Delta "+14" y "+7" |

`text-destructive` sobre el fondo, sin tinte (`:32`), sí pasa: 4.77:1. En oscuro todos pasan, con valores de 5.13 a 6.19.

La fase sigue al pie de la letra la pill de DESIGN.md:72 (`bg-<token>/10 text-<token>`), pero el resultado incumple DESIGN.md:282. Como `StatusBadge` es la pieza que 009-011 van a repartir por Pipeline, Ventas, Actividades y Clientes, hay que corregirlo ahora, una vez. Ese es el criterio de "Maintenance notes" del plan.

Arreglo mínimo, en un solo sitio:
- Extender a los cinco tonos en claro la regla que ya se aplicó a "Pendiente": texto `text-foreground` sobre el tinte.
- O bien oscurecer el texto solo en claro. El tinte, el relleno y el icono mantienen el color.
- El delta del leaderboard, igual: `text-foreground` con flecha o signo, o el mismo token oscurecido.
- DESIGN.md:72 y :82 deberían recoger la regla general, para que 009-011 no la reintroduzcan.

Los iconos de los tiles sí pasan el 3:1 de contraste no textual en claro: destructive 3.84 y chart-2 3.17. Este último va justo.

### Menores

**M1. El gráfico ignora `prefers-reduced-motion`** (`shared/lib/chart.ts:77-124`).
- `lineChartOptions` no define `animation` y chart.js no lee la media query CSS de `index.css:777`.
- Comprobado con Playwright y `reducedMotion: 'reduce'`: la animación de entrada sigue (`R/entry-reduced.cjs`).
- DESIGN.md:286 lo exige.
- Arreglo: `animation: false` cuando `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- Además da capturas deterministas.

**M2. Las filas de "Desempeño del equipo" no se pueden usar con teclado** (`dashboard/presentation/components/SellerSemaphoreTable.tsx:59-65`).
- Son `role="article"` con `onClick` hacia `/coaching`, sin `tabIndex` ni manejo de Enter/Espacio. `tabIndex` medido: -1 en las 4.
- Ya pasaba antes y el impl lo declara.
- Arreglo: un `<Link>` o `<button>` que envuelva la fila.

**M3. `status.ts` no cubre los estados de venta** (`shared/lib/status.ts:42-66`).
- `PaymentMethod` (`sales/domain/sales.types.ts:4`) tiene `Pagado`, `Crédito`, `50% anticipo` y `Pendiente`.
- Solo `Pendiente` está en el mapa; los otros tres caen en el fallback `neutral`.
- El plan pedía "estados de tareas, ventas y deals que hoy existen".
- Se pueden añadir ahora o en 010, en el mismo mapa.

### Notas

- **N1. Foco débil en tres sitios.** El picker de Mi día (`MiDiaPage.tsx:255`), la ordenación de DataTable (`DataTable.tsx:117`) y el hint de StatCard (`StatCard.tsx:50-52`) solo tienen el outline base `auto 1px` en `ring/50`, gris al 50 %.
  - Es visible y cumple DESIGN.md:283.
  - En las cards del picker casi se confunde con la retícula de 1px (`R/live/focus-picker-card.png`).
  - Sugerencia: `focus-visible:ring-3 focus-visible:ring-ring/50`, como el `Button` de shadcn.
- **N2. `StatCard` pinta su badge con el `Badge` de shadcn más `STATUS_BADGE_CLASS`** (`StatCard.tsx:66-70`), no con `StatusBadge`. Hay dos renderizadores de pill con base distinta: `h-5 gap-1` frente a `py-0.5`. Mejor que use `<StatusBadge tone>`.
- **N3. `icon` es obligatorio en `StatCard`** (`StatCard.tsx:17`) y en el plan era `icon?`. Hoy no molesta; se hace opcional cuando un KPI de 009-011 no tenga icono.
- **N4. `Section` está duplicado** en `DashboardPage.tsx:49-85` y `MiDiaPage.tsx:137-151`. Ver las recomendaciones.
- **N5. El gráfico se monta con `[]` y luego recibe los datos** (`DashboardPage.tsx:221,294`).
  - Es igual que en 55b22e1, pero causa los frames vacíos o comprimidos de la animación de entrada.
  - Opcional: `Skeleton` hasta que `trend` cargue.
- **N6. `useChartColors` crea un objeto nuevo en cada mutación de `class`** (`chart.ts:58-67`). Eso dispara un re-render y un `chart.update()`. Coste trivial; el observer se desconecta bien.
- **N7. Contraste fuera de scope** (006/007 o `components/ui`, para seguirlo después):
  - `kbd` "Ctrl K" del buscador del header: `text-muted-foreground` sobre `bg-muted`, 4.35:1 en claro.
  - Iniciales del avatar: lo mismo, 4.35:1.
  - Tags de tipo de tarea con `Badge` variante `gray` ("Videoconferencia", `TYPE_TAG` de `tasks/TaskCard`): 4.35:1.

## Juicio de las desviaciones

- **StatCard con `badge`, `hint`, `description` y `children` en lugar de `delta` y `action`: aceptada.**
  - `badge{label,tone}` cubre el delta de la plantilla (`total-orders.tsx`: `bg-chart-2/10 text-chart-2` "40%"), y ningún KPI tiene hoy una tendencia real.
  - `action` no lo usaba nadie (YAGNI).
  - `hint` sustituye el tooltip CSS con hex.
  - Pendiente: N2 (que use `StatusBadge`) y B1 (contraste del tono).
- **DataTable sin búsqueda ni selector de filas: aceptada para 008.** La única tabla paginada es de servidor con límite fijo, y una búsqueda en cliente filtraría solo la página visible.
  - Ojo: la ordenación es de cliente sobre filas paginadas por servidor, así que ordena solo la página visible. Hoy no se nota (4 vendedores y 0 deals estancados), pero en 009 (Clientes) sí.
- **Total de 14 días en el gráfico: aceptada.** Es solo presentación: `reduce` sobre el mismo `count` que se pinta (`DashboardPage.tsx:222`), sin tocar hooks ni queries. Coincide con la API (22) y replica el número grande de la card de la plantilla (`total-sales.tsx:162`).
- **`Section` local en cada página: aceptada para 008**, para no crear una séptima pieza fuera del scope. Debe subir a shared antes de 009.
- **`PageHeader` con `h1` en lugar del `h2` de la plantilla: aceptada.** Mismo aspecto (`text-xl font-semibold`) y un solo h1 por página, verificado.
- **`<h2>` dentro de `CardTitle`: correcto.** `CardTitle` es un `div` (`components/ui/card.tsx:36-43`), así que no hay encabezados anidados.
- **`AlertItem.icon` obligatorio y `eslint-disable` de `react-hooks/incompatible-library` en DataTable: aceptadas.**

## Ajustes recomendados a las piezas antes de 009-011

1. **`status.ts`**:
   - B1, regla AA para todos los tonos;
   - M3, añadir `PaymentMethod`;
   - en 009/010, sustituir los tres mapas hex de etapas (`DealCard.tsx:16`, `DealPeek.tsx:7`, `ClientDetailPage.tsx:39`) por `statusTone`, como pide DESIGN.md:87.
2. **`Section` a `shared/components/layout/`** (nombre sugerido `SectionCard`), con `title`, `icon`, `description?`, `actions?` y `contentClassName?`.
   - Coaching, Reportes, el detalle de cliente y Configuración usan cards con cabecera icono más título.
   - El slot `actions` cubre el `Select` de rango de la card de gráfico de la plantilla.
   - Sin esto, 009 crearía una tercera copia.
3. **`DataTable`**, para no crear otra tabla en 009-011:
   - `onRowClick` con fila operable por teclado (`tabIndex=0`, Enter y Espacio), porque Clientes y Ventas navegan al detalle; si no, se repite M2;
   - `manualSorting`, o desactivar la ordenación cuando la paginación es de servidor;
   - la búsqueda y "Filas por página" de DESIGN.md "Tabla" solo cuando 009 los use.
4. **`StatCard`**: usar `StatusBadge` (N2) y hacer `icon` opcional cuando haga falta (N3).
5. **`chart.ts`**: M1 (reduced motion). Hoy solo registra `Line`; si Reportes necesita barras, registrar `BarElement` aquí, no en la página.
6. **Foco** (N1): un `focus-visible:ring` explícito en las cards clicables del picker, en el sort de la tabla y en el hint de StatCard. Más aún en las cards de 009-011 que hereden el patrón del picker.

## Qué debe revisar el Líder a ojo

1. **Pills de estado en claro tras el arreglo de B1.** Semáforo (rojo), rango 3 (naranja), badges de Mi día (rojo y teal) y delta del leaderboard. Hoy se ven correctas pero flojas: `R/live/admin-dashboard-1440-light.png` y `R/live/seller-midia-1440-light.png`.
2. **Gráfico asentado.**
   - Claro: `R/chart-light-settled.png`.
   - Oscuro tras el toggle: `R/live/admin-dashboard-1440-light-chart-after-toggle-dark.png`.
   - Rehacer las capturas de `phase-008` con más espera o con `reducedMotion` (tras M1).
3. **Foco del picker de Mi día:** `R/live/focus-picker-card.png`, que es débil (N1).
4. **AlertDialog:** `R/live/seller-midia-1440-light-alertdialog.png`.
5. **Leaderboard a 390:** Delta y Racha quedan con scroll dentro de la tabla. La página no desborda: `R/live/admin-dashboard-390-light.png`.

## Re-review

**Veredicto: PASSED.** B1, M1, M2, M3, N1, N2/N3 y N4 están corregidos y verificados en vivo. Los cambios de DataTable son correctos. No hay regresiones respecto a la primera pasada. Queda un hallazgo menor nuevo, M4, que es latente (no se ve hoy) y hay que corregirlo antes de que 009 use `onRowClick`. También hay tres notas.

`R` = `scratchpad/review008/`. Scripts: `live2.cjs` (auditoría completa adaptada al markup nuevo), `extra2.cjs` (stalled-deals simulado con `page.route` solo en el navegador de prueba, hover y foco asentados), `syn2.cjs` y `syn3.cjs` (pills y tiles sintéticos de los tres tonos sobre card, hover y `bg-muted/50`) y `entry-reduced.cjs` / `entry-normal.cjs` (M1). Resultados en `R/live2/report.json` y `R/live2/extra2.json`.

### Alcance de los fixes

Los archivos de `frontend/src` modificados después de la primera review (por mtime) son exactamente los 11 que lista el impl en "Fixes post-review". Fuera de `frontend/src` solo cambiaron `DESIGN.md`, `plans/012-redesign-cleanup.md`, `plans/README.md` y el impl. No se tocó `components/ui`, ni hooks, ni queries, ni tipos.

### Hallazgos de la primera pasada

| Hallazgo | Estado | Evidencia |
|---|---|---|
| B1, contraste AA en claro | Corregido | Ver la tabla de contraste. 0 fallos dentro del scope en 9 auditorías: admin `/dashboard` 1440 en claro y en oscuro y 390 en claro, picker y vista de vendedor de Mi día de admin en claro y en oscuro, y seller1 `/mi-dia` 1440 en claro y en oscuro y 390 en claro. |
| Tokens `--status-*` | Correcto | `index.css`: `@theme` :23-25, `:root` :99-101 (teal-700, orange-800, red-700), `.dark` :138-140 (`chart-2`, `chart-1`, `destructive`). `status.ts` :19-32 solo cambia el texto de success, progress y danger. |
| M1, reduced motion | Corregido | `chart.ts:80-84`. Con `reducedMotion: 'reduce'`, el primer frame ya está asentado (x13=599=`chartArea.right`, dark=945 en claro) y no hay frames intermedios: 1 frame distinto en claro y 1 en oscuro. Sin reduce, el control muestra la animación de entrada (x13 7800, 4393, 3714…, dark=0 en el primer frame). |
| M2, semáforo con teclado | Corregido | `SellerSemaphoreTable.tsx:57`, `<Link to="/coaching">`. Solo con teclado: 21 Tab hasta "Juan Pérez: puntuación 42.7, 1 seguimientos vencidos", `:focus-visible` true y anillo inset de 3px `ring/50` en claro y en oscuro. Enter lleva a `/coaching`. Captura: `R/live2/admin-dashboard-1440-light-semaphore-focus.png` y `R/live2/semaphore-focus-dark.png`. |
| M3, estados de venta | Corregido | `status.ts:61-63`: `Pagado` success, `50% anticipo` progress, `Crédito` pending. `Pendiente` sigue en pending. |
| N1, foco débil | Corregido | Foco medido ya asentado: hint de StatCard, botones de orden del leaderboard y filas del semáforo con `box-shadow` de 3px `ring/50` (inset en las filas). Las cards del picker de Mi día tienen `:focus-visible` con anillo inset (`MiDiaPage.tsx:231`): `R/live2/admin-midia-picker-focus-{light,dark}.png`. Dentro de `main` solo queda sin indicador el botón "Buscar… Ctrl K" del header, que es de 006/007 y ya estaba igual en la primera pasada. |
| N2/N3, StatCard | Corregido | Pinta el badge con `<StatusBadge tone>` (un solo renderizador de pill). `icon?` es opcional y sin él no se pinta la caja. |
| N4, Section duplicado | Corregido | `shared/components/layout/SectionCard.tsx`. Lo usan 5 secciones de DashboardPage y 4 de MiDiaPage. `rg "function Section\b"` da 0. |

### Contraste en vivo (texto 4.5:1, iconos 3:1)

Valor mínimo medido de cada clase, con el color compuesto sobre el fondo real:

| Elemento | Claro | Oscuro |
|---|---|---|
| Pill success `bg-chart-2/10 text-status-success` (badge 250 % de Mi día) | 4.74 | 4.96 |
| Pill progress (rango 3 del leaderboard) | 6.43 | 5.13 |
| Pill danger (scores del semáforo, badges 0 % y 10 % de Mi día) | 5.35 | 6.19 |
| Pill pending `text-foreground` (rango 1, "Atención") | 18.21 | 14.57 |
| Pill neutral (rango 2) | 14.50 | 12.93 |
| Icono del tile success `/12` | 4.63 | 4.85 |
| Icono del tile danger `/12` | 5.16 | 6.03 |
| Icono del tile pending y neutral | 18.21 / 13.97 | 14.57 / 12.21 |
| Delta del leaderboard y "N vencida(s)" | 0 fallos (todo el texto de `main` auditado) | 0 fallos |
| Pills dentro de filas en hover (semáforo y tablas, `bg-muted/30`) | danger 5.22, progress 6.27 | danger 5.76, progress 4.80 |
| Sintético en hover: pill success, tile success, tile progress, tile danger | 4.63, 4.52, 6.14, 5.04 | 4.63, 4.52, 4.67, 5.60 |

Los únicos fallos en claro son los de la nota N7 de la primera pasada, todos fuera del scope y todos a 4.35: el kbd "Ctrl K", el avatar y el Badge gris "Videoconferencia". En oscuro hay 0 fallos.

### DataTable y props para 009-011

- **Ordenación con paginación de servidor:** `enableSorting: !pagination` (`DataTable.tsx:75`). Con stalled-deals simulado (3 filas, `totalPages` 2): 0 botones de orden, 0 `aria-sort`, y el paginador tiene "Anterior" deshabilitado y "Siguiente" habilitado. El leaderboard no pasa `pagination` y conserva la ordenación de cliente con 5 botones, que es lo correcto porque tiene todos los datos. Las columnas actuales de stalled-deals usan `id` sin accessor, así que tampoco podrían ordenarse: la guarda se verifica por código y está bien planteada para los consumidores futuros.
- **`onRowClick`:** hoy no lo usa ninguna tabla (las filas tienen `tabindex` null), así que se verificó por código.
  - `tabIndex: 0` y `onClick` (:146-147).
  - Enter y Espacio solo cuando el foco está en la propia fila (`e.target !== e.currentTarget`, :150), con `preventDefault`, de modo que Espacio no hace scroll.
  - Anillo inset de foco (:143).
  - Ver M4 y N8.
- **Props de `SectionCard`, `StatCard` y `DataTable`:** son razonables para 009-011. `actions` en `CardAction` cubre selects y links de cabecera. `titleId` sirve para `aria-labelledby` y `contentClassName` para el padding. `StatCard` con `icon?`, `badge {label, tone}`, `hint` y `children` cubre los KPIs con barra. No sobra nada.

### Gates y comprobaciones con rg

- `pnpm run typecheck`, `pnpm run lint` y `pnpm run build` en `frontend/`: los tres con exit 0.
- Las dos rg del plan (clases legacy, y hex o `tracker-`) en dashboard y mi-dia: 0 resultados.
- Extra en dashboard, mi-dia y `shared/components/{data,layout}` + `shared/lib`: `text-slate-`, `text-[Npx]` y `variant="success"` dan 0. `text-chart-N` y `text-destructive` también dan 0. `KPICard` y `OverdueTasksList` dan 0. `useNavigate` solo queda en MiDiaPage, donde se usa para `/agenda` y `/clientes`, como es legítimo.

### Regresiones (frente a la primera pasada)

No hay ninguna:
- 0 page errors y 0 errores de consola en las 9 sesiones más las 2 de `extra2.cjs`.
- Un h1 por página y `overflowX` 0, también a 390.
- Los colores del gráfico cambian con el tema: claro `rgba(23,23,23,1)`, oscuro `rgba(229,229,229,1)`, y vuelven al cambiar de nuevo. El observer de `<html>` pasa de 1 a 0 tras desmontar.
- Admin ve 0 botones "Completar" en Mi día.
- El AlertDialog de seller1 se abrió y se canceló, sin confirmar: el foco queda dentro del diálogo y vuelve al trigger al cerrar, y la tarea sigue pendiente.
- Elementos enfocables en `main`: 13 antes, 17 ahora (las 4 filas del semáforo).

### Hallazgos nuevos

**M4 (menor, latente). El foco de fila de `DataTable` con `onRowClick` baja las pills de estado de AA en oscuro** (`DataTable.tsx:143`, `focus-visible:bg-muted/50`).
- Medido sintéticamente con las clases exactas de `StatusBadge` y `STATUS_TILE_CLASS` sobre una fila con `bg-muted/50`:
  - oscuro: pill success 4.34, tile success 4.24 y tile progress 4.39 (la pill progress da 4.52);
  - claro: tile success 4.45.
- Hoy no se ve porque nadie usa `onRowClick`. Pero 009-010 lo van a usar en Clientes y Ventas, y esas tablas llevan pills de estado.
- Arreglo de una clase: `focus-visible:bg-muted/30`, igual que el hover y que las filas del semáforo. Con `/30` se mide 4.63 en la pill y 4.52 en el tile.
- Debe corregirse antes de que el primer consumidor use `onRowClick`.

**Notas**
- **N8.** El `onClick` de la fila no tiene la guarda que sí tiene el teclado. Un click en un botón o un link dentro de la fila también dispara `onRowClick`. Los consumidores con acciones en la fila tendrán que hacer `stopPropagation`, o bien `DataTable` puede ignorar los clicks que vengan de `a, button, input, [role=menuitem]`. Además, un `<tr tabIndex=0>` no anuncia que es accionable. Si la fila navega, es mejor un `<Link>` en la celda principal.
- **N9.** El margen del tile success en hover es fino: 4.52 en claro y en oscuro. Cualquier tinte de hover más oscuro que `muted/30` lo rompe. El Implementer midió 4.49 sobre `--background`, que hoy no se da.
- **N10.** El anillo `ring/50` de 3px se ve, pero es sutil sobre las cards: gris claro en claro y gris medio en oscuro (capturas citadas en N1). Es el anillo estándar de shadcn en el resto de controles, así que lo acepto por consistencia.
