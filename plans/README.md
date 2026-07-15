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
| 001 | Registrar tokens `--tracker-*` en Tailwind theme | P1 | S | — | DONE (commit `73ab7ed` en branch `worktree-agent-a874e0049278422a7`, pendiente de merge por el usuario; smoke visual del header pendiente post-merge) |
| 002 | Migrar 23 botones nativos a shadcn Button | P1 | M | 001 | TODO |
| 003 | Eliminar estilos inline: módulos núcleo | P1 | L | 001, 002 | TODO |
| 004 | Eliminar estilos inline: módulos restantes | P2 | L | 001, 003 | TODO |
| 005 | Paleta de comandos + peek de deal | P2 | M | 001, 003 | TODO |

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
