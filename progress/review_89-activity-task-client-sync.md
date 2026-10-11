# Revisión 89-activity-task-client-sync

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`. Base: `47595dce250bb856a95fd539ac283fb6c2d4ddb4`.

**What this change does:** Sincroniza el cliente y su contexto al seleccionar una tarea en Actividades, y conserva los vínculos válidos al cambiar cliente o llegar desde Agenda/Mi Día.

**Resultado: PASSED — 5/5 criterios del CHECKPOINT verificados.**

Leí AGENTS.md, docs/conventions.md, CHECKPOINT89, contratos existentes, ambos archivos implementados, diff contra la base, hooks y callers conectados, guard backend, runners y resultados desde disco. Los [resúmenes finales del Implementer](/home/claude/sites/Tracker-Sales-OS/progress/impl_89-activity-task-client-sync.md) y [QA](/home/claude/sites/Tracker-Sales-OS/progress/qa_89-activity-task-client-sync.md) coinciden con la evidencia.

## Criterios

| # | Veredicto | Evidencia verificada |
|---|---|---|
| 1 | PASSED | Baseline válido: 16/16 comprobaciones en cuatro perfiles. Cliente B/contacto B/oportunidad B → tarea A conserva B en UI/payload, responde 400 «La actividad debe conservar el cliente de la tarea.» y muestra el error. Snapshots SQL antes/después idénticos: cero nuevas actividades y sin cambios en pipeline/clientes. Hashes de `89-source-before.json` coinciden con la base, anteriores a la edición. Existen payloads y capturas antes/después sin tokens. |
| 2 | PASSED | La matriz after acredita ID/nombre A exactos, incluso fuera de las primeras 20 opciones, al seleccionar tarea A después de B. Limpia contacto/oportunidad incompatible y conserva el resumen. Cambiar A→B actualiza nombre/ID y limpia el contexto A. Veintiocho POST201 de la matriz conservan dueño/cliente/tarea/contacto en request, response y SQL real. El tail retiene GET A, cambia a B y libera A: no reaparecen nombre/contactos/etapa A ni el nombre de oportunidad nueva anterior; POST201 usa B. |
| 3 | PASSED | Cambiar manualmente a cliente incompatible desvincula la tarea y muestra un estado visible; quitar sólo la tarea conserva el cliente. Seleccionar una tarea sin cliente limpia el anterior y permite elegir B sin perder esa tarea; actividad no comercial sin cliente y actividad comercial sin tarea guardan 201. Agenda Admin y Mi Día Seller completan tareas reales por PATCH200 y preservan contexto, aunque ya no están entre Pendiente. Cliente prelinked fijo se hidrata por ID con contacto real; tarea prelinked sin cliente permite B. Tres handoffs guardan 201 con SQL exacto. |
| 4 | PASSED | Guard de CreateActivity leído y comparado con la base: dueño, cliente y tarea borrada se validan antes de crear actividad o sincronizar pipeline. HTTP negativo independiente: 22/22 checks en Seller/Admin/Director, todos 400 con snapshots de actividades/pipeline/clientes idénticos. Incluye cliente incompatible/ajeno/inexistente, tarea ajena/borrada/inexistente y vendedor inactivo/inexistente para managers. Seller controller conserva dueño JWT; sin relajación de permisos. |
| 5 | PASSED | QA real Seller1440 claro/Seller390 oscuro/Admin1440 claro/Director390 oscuro; 158/158 checks after, cero fallos inesperados. TypeScript app, typecheck app+node, lint y build exit0; diff-check exit0. Ejecuté tsc app y diff-check independientes, ambos exit0. Scope fuente exactamente dos paths autorizados; dependencias/core/permisos/scoring intactos. |

## Alcance y lógica conectada

1. [ActivityForm.tsx](/home/claude/sites/Tracker-Sales-OS/frontend/src/modules/activities/presentation/components/ActivityForm.tsx:171): usa `useClient(id)` y el contrato ClientDetail existente para nombre/contactos exactos, sin fabricar un Client ni métricas. Sólo acepta el objeto resuelto si coinciden ID y vendedor actuales. La limpieza de selección y el efecto de etapa conservan el contexto correcto ante respuestas tardías. Los handoffs usan los props iniciales, sin depender de encontrar la tarea completada en `pendingTasks`. Mantiene fecha programada, validación propia, payload, calidad y puntos existentes.
2. [ClientCombobox.tsx](/home/claude/sites/Tracker-Sales-OS/frontend/src/shared/components/forms/ClientCombobox.tsx:22): añade `valueLabel` opcional para la etiqueta externa. Sin esa prop conserva selección, etiqueta interna e hidratación onResolve. Crear/Editar tarea y Ventas siguen usando el contrato anterior; EditTaskForm pasó 8/8 checks browser, A→B→A, contacto real y cancelación con cero mutations. Usa shadcn existente, sin nuevos overlays ni remount forzado.

Recalculé los hashes de **389 archivos protegidos**, los seis paths del snapshot estable y ambos hashes after: cero diferencias. El diff frontend/backend contra la base contiene únicamente estos dos archivos. Comparé además backend guard/controller/DTO, package.json/lockfile, tipos, useClient y callers Agenda/Mi Día/Activities con la base: idénticos. La fuente sigue congelada y preserva las regresiones relacionadas de lotes anteriores.

## Evidencia y límites

Recalculé resultados individuales usando `tests[n].actual.pass` en browser y `tests[n].pass` en API; no dependí sólo del consolidado.

| Segmento | Checks PASS | Carpetas bajo `/tmp/tracker-sales-bugfix-qa/` |
|---|---:|---|
| Matriz principal, cuatro perfiles | 96 | `89-after-{seller-1440-light,seller-390-dark,admin-1440-light,director-390-dark}/` |
| Backend negativo, tres roles | 22 | `89-backend-after/` |
| Respuesta tardía/nueva oportunidad, dos perfiles | 10 | `89-rapid-after-{1440-light,390-dark}/` |
| Agenda/Mi Día/prelinked sin cliente | 22 | `89-handoff-after-{admin-1440-light,seller-390-dark,seller-1440-light-no-client}/` |
| EditTask compartido, dos perfiles | 8 | `89-edit-task-after-fixed-{1440-light,390-dark}/` |

Cada carpeta conserva result.json y capturas; los logs son 89-ui-after.log, 89-backend-after.log, 89-rapid-after.log, 89-handoff-after.log y89-edit-task-after-fixed.log. [Consolidado](/tmp/tracker-sales-bugfix-qa/89-results-summary.json) y [hashes finales](/tmp/tracker-sales-bugfix-qa/89-hashes-after.json) registran 158 checks válidos/0 fallos y fuente estable. Son comprobaciones acumuladas, no escenarios únicos. Los 33 POST201 se distribuyen en 28 matriz, dos rapid y tres handoff; SQL se verifica en matriz/handoffs y rapid acredita payload/respuesta reales.

Baseline separado: `89-before-fixed-*`, 16 checks de reproducción y 400 esperado. El primer baseline cortado por fixture de oportunidad y los dos primeros EditTask cortados por selector «Editar» frente a «Editar tarea» se preservan y quedan fuera de los positivos. Los retries pasan sin cambios de producto. Los 400 negativos son deliberados; las sesiones browser after válidas registran cero HTTP inesperado, errores de consola/página y tráfico externo bloqueado.

Logs de gates: `89-frontend-{tsc,typecheck,lint,build,diff-check}.log`, con comandos/cwd/timestamps/exit0. Última edición fuente07:21:36UTC; gates07:21:59–07:22:33UTC, anteriores a QA y con hashes actuales iguales. Lint sin --fix; build conserva avisos previos de Atlaskit y chunk mayor a500kB. No repetí build con entradas intactas. No se ejecutó otra vez toda la suite82–88 ni se llamó IA; se verificaron callers/guards relacionados en UI3001/API3005/DB aislada5434, con backend fijo.

No quedan criterios sin verificar ni hallazgos bloqueantes. El Reviewer escribió únicamente este archivo, sin editar fuente/tests/config/metadatos ni hacer commit/push.

**Verdict: Ship.**
