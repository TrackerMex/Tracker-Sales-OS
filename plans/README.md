# Implementation Plans

Generados por el skill improve el 2026-07-14 (commit base `cc0b102`), a partir
de la invocación "plan: consolidar el sistema visual del frontend, eliminar
estilos inline, migrar botones nativos a shadcn/ui y preparar los componentes
para popover de deal y paleta de comandos". La petición se dividió en 5 planes
ejecutables en vez de uno monolítico: cada uno es verificable de forma
independiente y del tamaño adecuado para un executor.

Cada executor: lee el plan completo antes de empezar, respeta sus STOP
conditions y actualiza su fila al terminar.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Registrar tokens `--tracker-*` en Tailwind theme | P1 | S | — | DONE y mergeado a `main` (commit `73ab7ed`); smoke visual del header verificado 2026-07-16 |
| 002 | Migrar 23 botones nativos a shadcn Button | P1 | M | 001 | DONE y mergeado a `main` (PR #22); implementación, gates, smoke autenticado y drag-and-drop verificados; CHECKPOINT 10/10 |
| 003 | Eliminar estilos inline: módulos núcleo | P1 | L | 001, 002 | DONE y mergeado a `main` (commits `1ca2db7`–`13587fc`); review PASSED; smoke autenticado verificado 2026-07-16 |
| 004 | Eliminar estilos inline: módulos restantes | P2 | L | 001, 003 | DONE y mergeado a `main` (commits `e00b70d`–`14645ee`); review Líder PASS: typecheck/lint/build exit 0; smoke de la lámina ejecutiva con datos reales verificado 2026-07-16 |
| 005 | Paleta de comandos + peek de deal | P2 | M | 001, 003 | DONE y mergeado a `main` (fast-forward, commits `840f901`–`cf556fc`); typecheck/lint/build exit 0 verificados post-merge; checklist manual completa con Admin y Seller vía backend Docker real, incluido drag-and-drop del DealCard |

Los 5 planes están mergeados a `main` (fast-forward desde `review-ui`, 2026-07-16). Sin
pendientes de smoke: ver "Smoke visual de cierre" abajo.

## Smoke visual de cierre (2026-07-16)

Ejecutado con Docker real (api + db + ui + nginx) y `admin/Admin123!` en Chrome 1440x900.
Cierra los pendientes de smoke de los planes 001, 003 y 004.

- `/login`, `/dashboard`, `/reportes`, `/mi-dia`, `/coaching`: renderizan con datos reales,
  **0 errores de consola** en las 4 rutas.
- **Barras `scaleX` verificadas en ambos extremos**: lámina ejecutiva `/reportes` con
  Unidades al 222% (clamped a 100, barra llena) y Ventas al 0.1% (barra casi vacía);
  semáforo del dashboard con score 2.4 en rojo y score 0 sin fill. Confirma el fix
  `width`→`scaleX` del plan 003/004.
- Lámina ejecutiva completa con datos reales ($444, 333 unidades, funnel win/loss,
  motivos de pérdida, análisis IA); Montserrat conservada según lo decidido.
- Tamaños de icono medidos con `getBoundingClientRect` sobre el DOM: 18px en todo
  el sistema; los únicos SVG fuera de 18px son los devtools de TanStack y los
  `reicon` dentro de `Button` (16px por su propia regla `[&_svg]:size-4`).

Hallazgo anotado, fuera de alcance (lógica de negocio, no del sistema visual): en
`/reportes` la Salud Comercial marca 100/100 mientras Focos Rojos reporta "volumen de
actividad comercial muy bajo" — incoherencia del scoring, preexistente.

Status values: TODO | IN PROGRESS | DONE | BLOCKED (con razón de una línea) | REJECTED (con justificación)

## Dependency notes

- **002 requiere 001**: los reemplazos de botones usan clases `text-tracker-*`.
- **003 requiere 001** (clases de tokens) y conviene tras **002** porque ambos
  tocan CalendarView, ActivityForm, CreateTaskForm y ClientDetailPage —
  hacerlos en orden evita conflictos de merge.
- **004 requiere 001** y usa las reglas/tabla de mapeo definidas en 003
  (referencia cruzada explícita en el plan).
- **005 requiere 001** (tokens en Peek/palette) y conviene tras **003** para
  integrar el peek sobre un DealCard ya limpio.
- 003 y 004 podrían ejecutarse en paralelo por executors distintos (archivos
  disjuntos), siempre después de 001/002.

### Plan 003 — whitelist de estilos dinámicos

La implementación deja 8 atributos `style=` dinámicos (6 coinciden con el
patrón literal `style={{`):

- `DealCard.tsx`: color de badge derivado de la etapa.
- `ClientDetailPage.tsx`: color del step activo derivado de `STAGE_COLORS`.
- `SellerSemaphoreTable.tsx`: escala y color derivados del score.
- `KPICard.tsx`: color opcional proporcionado por el caller.
- `ActivitiesPage.tsx`: escala/color del progreso diario y de calidad.
- `ActivityForm.tsx`: escala/color de calidad y color de su etiqueta.

Las cuatro barras usan `scaleX`, `origin-left` y utilidades importantes de
transición transform-only para prevalecer sobre el `transition-all` legacy de
`.prog-fill`. Typecheck, lint y build pasaron; el smoke visual autenticado queda
pendiente después del merge.

### Plan 004 — whitelist de estilos dinámicos

`style={{` sobrevivientes (6, todos justificados):

- `MiDiaPage.tsx:390` — `transform: scaleX(ptsPct/100)`, puntos del día.
- `ExecutiveSlide.tsx:57` (Bar) — `transform: scaleX(clamped/100)`, patrón del ejemplar del plan.
- `ExecutiveSlide.tsx:94` — `fontFamily: Montserrat Variable`, identidad de la lámina (conservada a propósito).
- `ExecutiveSlide.tsx:596` — `color: healthColor(ai.health)`, color de salud comercial por dato real.
- `LaminaPage.tsx:37` — `fontFamily: Montserrat/Inter`, misma identidad en ruta standalone.
- `CoachingPage.tsx` (helper `ProgressBar` nuevo) — `transform: scaleX(clamped/100)`, mismo patrón consolidado para no exceder presupuesto.

`transition.*width` en `frontend/src` solo aparece en `components/ui/sidebar.tsx` (shadcn, fuera de alcance, animación de colapso del sidebar — no una barra de progreso).

Pendiente real antes de mergear a `review-ui`: smoke visual de `/reportes` (lámina ejecutiva con datos de ventas reales) — el executor no tuvo backend/DB disponibles en su sandbox.

## Contexto compartido

- Verificación frontend (igual que CI): `cd frontend && npm run typecheck && npm run lint && npm run build`. No hay tests de frontend.
- Fuente del diagnóstico: `.impeccable/critique/2026-07-15T03-30-46Z__frontend-src.md`
  (461 estilos inline, 23 botones nativos, sistema visual desviado de sus
  propios componentes — problema P1).

## Findings considered and rejected

- **Reemplazar los 3 botones de acciones rápidas del Header por la barra de
  búsqueda** (P2 de la crítica): deferido — decisión de producto; la paleta del
  plan 005 deja lista la infraestructura.
- **Migrar `seller-pick-card` (MiDiaPage:190) a Button**: rechazado — es una
  tarjeta clickeable completa; forzarla dentro de Button pelea con las clases
  base con alto riesgo visual. Queda como excepción documentada en el plan 002.
- **Quitar Montserrat de ReportsPage**: rechazado — identidad documentada de la
  lámina ejecutiva (la propia crítica lo marca de baja prioridad).
- **Consolidar los 47 usos de `.card` / rediseñar jerarquía del Dashboard**
  (P1 de la crítica): fuera del alcance pedido — es rediseño de layout, no
  consolidación del sistema visual; candidato a `/impeccable layout` posterior.
- **Unificar los `formatCurrency` duplicados (SalesPage vs shared/lib/format)**:
  hallazgo menor anotado en el plan 004; no amerita plan propio.
- **Limpiar los 3 lockfiles coexistentes en `frontend/` (bun.lock,
  pnpm-lock.yaml, package-lock.json)**: fuera de alcance de esta invocación;
  CI usa `npm ci` con package-lock.json. Anotado para una futura auditoría DX.
