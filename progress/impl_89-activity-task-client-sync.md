# Implementación 89-activity-task-client-sync

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`. Base: `47595dc`.

## Cambio y conducta visible

Elegir o cambiar una tarea desde Actividades aplica su `clientId` y muestra su nombre. Se limpian contacto, oportunidad elegida, nombre de oportunidad nueva, etapa y sugerencias IA del contexto anterior. La fecha programada conserva el comportamiento existente del selector. Una tarea sin cliente limpia el cliente anterior; permite luego elegir cliente para una actividad comercial o registrar una actividad no comercial sin cliente.

Si el usuario elige manualmente otro cliente o «Sin cliente», se desvincula la tarea manual que tenía un cliente diferente. El selector queda en «Sin tarea vinculada» y aparece «Se quitó la tarea vinculada al cambiar de cliente.» como estado visible. Elegir de nuevo una tarea restablece su contexto. Quitar sólo la tarea conserva el cliente seleccionado. Cambiar vendedor conserva la limpieza existente y reinicia ese estado.

La tarea recibida desde Agenda/Mi Día mantiene su vínculo y vendedor bloqueados. Cuando trae cliente, el combobox de cliente también queda bloqueado y muestra «Se conserva el cliente de la tarea vinculada.»; una tarea sin cliente permite elegirlo. Durante guardado o sugerencia IA no se cambia cliente/tarea.

`ActivityForm` reutiliza `useClient(id)` para resolver nombre/contactos exactos por ID, incluso fuera de la primera página y con el combobox bloqueado. Usa el contrato `ClientDetail` existente, sin fabricar métricas ni convertirlo a `Client`. El cliente manual ya resuelto también se conserva; nombres/contactos se usan sólo si su ID y vendedor coinciden con el contexto actual.

`ClientCombobox` añade únicamente `valueLabel` opcional para la etiqueta controlada del valor externo. Cuando no se proporciona, conserva su etiqueta interna, selección e hidratación `onResolve` anteriores. Crear/Editar tarea y Ventas no requieren cambios. No se remonta el combobox al cambiar de valor.

## Archivos exactos

1. `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`: selección coherente tarea/cliente, resolución exacta por hook, limpieza de contexto, desvinculación visible y cliente fijo en tarea prelinked.
2. `frontend/src/shared/components/forms/ClientCombobox.tsx`: prop opcional `valueLabel` y uso exclusivo para la etiqueta visible.
3. `progress/impl_89-activity-task-client-sync.md`: este resumen y evidencia.

Leídos antes de editar: AGENTS.md, docs/conventions.md, CHECKPOINT 89, core common.types.ts, tipos Task/CreateActivityInput/Client/ClientDetail, hooks existentes, callers de ClientCombobox y validación backend de CreateActivity. Plan aprobado por Líder; fuente antigua conservada hasta aviso explícito de QA «BASELINE89 LISTO». Sólo UI shadcn existente; presentación usa hooks, sin llamadas directas a infrastructure ni nuevos overlays. Sin backend/core/deps/permisos/scoring/estructura/metadata ni commits/push.

## Baseline reproducido

QA ejecutó `node progress/bugfix-qa/89-before.cjs before-fixed`: **16/16 comprobaciones de reproducción**, proceso exit 0. Seller 1440 claro, Seller 390 oscuro, Admin 1440 claro y Director 390 oscuro. Managers seleccionan al vendedor propietario. Cliente A está fuera de las primeras 20 opciones.

En todos los contextos, elegir cliente B/contacto B/oportunidad B y después tarea A conserva B en UI/payload. POST responde 400 «La actividad debe conservar el cliente de la tarea.» visible. Lecturas SQL antes/después acreditan cero nuevas actividades y pipeline/clientes sin cambios. Carpetas `/tmp/tracker-sales-bugfix-qa/89-before-fixed-{seller-1440-light,seller-390-dark,admin-1440-light,director-390-dark}/` contienen `result.json`, `invalid-post.json` y capturas. Log: [`89-before-fixed.log`](/tmp/tracker-sales-bugfix-qa/89-before-fixed.log). Informe: `progress/qa_89-activity-task-client-sync.md`. El primer corte de fixture/selector se conserva y no se usa como reproducción válida.

Snapshot previo Implementer: [`89-implementer-before.json`](/tmp/tracker-sales-bugfix-qa/89-implementer-before.json). Registra hashes de los dos paths autorizados y cuatro archivos protegidos: Crear tarea, Editar tarea, Ventas y CreateActivity backend. QA mantiene su snapshot independiente `89-source-before.json`.

## Gates

Cinco gates PASS, ejecutados de 07:21:59 a 07:22:33 UTC. Logs con comando, cwd, timestamps UTC y exit bajo `/tmp/tracker-sales-bugfix-qa/`:

| Comando | Resultado | Log |
|---|---|---|
| `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit 0 | [89-frontend-tsc.log](/tmp/tracker-sales-bugfix-qa/89-frontend-tsc.log) |
| `pnpm run typecheck` | exit 0 | [89-frontend-typecheck.log](/tmp/tracker-sales-bugfix-qa/89-frontend-typecheck.log) |
| `pnpm run lint` | exit 0, sin errores/warnings | [89-frontend-lint.log](/tmp/tracker-sales-bugfix-qa/89-frontend-lint.log) |
| `pnpm run build` | exit 0 | [89-frontend-build.log](/tmp/tracker-sales-bugfix-qa/89-frontend-build.log) |
| `git diff --check` | exit 0 | [89-frontend-diff-check.log](/tmp/tracker-sales-bugfix-qa/89-frontend-diff-check.log) |

Build conserva la advertencia preexistente de chunk mayor a 500 kB. [`89-implementer-stable.json`](/tmp/tracker-sales-bugfix-qa/89-implementer-stable.json) registra hashes de fuente final y acredita que Crear/Editar tarea, Ventas y guard backend coinciden con el snapshot anterior. FRONTEND 89 ESTABLE: fuente congelada tras gates para QA/Reviewer.

## QA final

**QA funcional PASSED: 158/158 comprobaciones after, cero fallos inesperados.** Baseline 16/16 separado. Informe final leído desde [`qa_89-activity-task-client-sync.md`](/home/claude/sites/Tracker-Sales-OS/progress/qa_89-activity-task-client-sync.md); consolidado [`89-results-summary.json`](/tmp/tracker-sales-bugfix-qa/89-results-summary.json), log [`89-summary.log`](/tmp/tracker-sales-bugfix-qa/89-summary.log). El total cuenta comprobaciones acumuladas, no escenarios únicos.

| Segmento | Cobertura | Resultado | Carpeta/log bajo `/tmp/tracker-sales-bugfix-qa/` |
|---|---|---|---|
| Selección y registro | Seller 1440 claro/390 oscuro, Admin 1440 claro, Director 390 oscuro | 24 × 4 = 96 PASS | `89-after-{seller-1440-light,seller-390-dark,admin-1440-light,director-390-dark}/result.json`; `89-ui-after.log` |
| Guard backend inválido | Seller, Admin, Director | 22 PASS | `89-backend-after/result.json`; `89-backend-after.log` |
| Cambio rápido y respuesta tardía | Seller 1440 claro/390 oscuro | 5 × 2 = 10 PASS | `89-rapid-after-{1440-light,390-dark}/result.json`; `89-rapid-after.log` |
| Tarea completada desde Agenda | Admin 1440 claro | 7 PASS | `89-handoff-after-admin-1440-light/result.json` |
| Tarea completada desde Mi Día | Seller 390 oscuro | 7 PASS | `89-handoff-after-seller-390-dark/result.json` |
| Tarea completada sin cliente desde Mi Día | Seller 1440 claro | 8 PASS | `89-handoff-after-seller-1440-light-no-client/result.json`; log común `89-handoff-after.log` |
| EditTaskForm/combobox compartido | Seller 1440 claro/390 oscuro | 4 × 2 = 8 PASS | `89-edit-task-after-fixed-{1440-light,390-dark}/result.json`; `89-edit-task-after-fixed.log` |

La matriz principal acredita nombre/ID A exactos fuera de los primeros 20 al elegir tarea A después de B, contacto A real por GET de ID, limpieza de contacto/oportunidad B, cambio A→B, desvinculación manual visible, quitar sólo tarea conservando cliente, tarea sin cliente y actividad sin tarea. La validación propia de cliente/resumen impide el submit vacío con cero POST. Se registraron **33 POST 201 válidos**: 28 de matriz, dos de cambio rápido y tres de handoff. Payloads, respuestas y filas SQL de lectura conservan el vendedor, cliente, tarea y contacto esperados.

El tail de cambio rápido retiene el GET exacto del cliente A, cambia a tarea B y libera A tarde: nombre, contactos y etapa permanecen B; no reaparece el nombre de oportunidad nueva anterior ni se envía en el payload. El contacto queda bloqueado mientras A está pendiente, sin reutilizar opciones B antiguas. Los handoffs usan tareas realmente completadas por PATCH 200, fuera del listado pendiente: cliente y vendedor fijos, nombre exacto e hidratación de contacto incluso con combobox bloqueado. La tarea completada sin cliente admite elegir B sin perder su vínculo. EditTaskForm conserva su etiqueta interna e hidratación anteriores sin `valueLabel`, al cambiar A→B→A y cancelar con cero mutations.

Los 22 negativos backend se ejecutaron sin otros procesos escribiendo: 400 ante cliente incompatible, tarea de otro vendedor/borrada/inexistente y cliente ajeno/inexistente en tres roles; también vendedor inactivo/inexistente en Admin/Director. Cada caso compara snapshots idénticos de actividades, pipeline y clientes antes/después. No se retiró ni normalizó el guard del servidor.

[`89-hashes-after.json`](/tmp/tracker-sales-bugfix-qa/89-hashes-after.json) y log `89-hashes-after.log` acreditan **389 archivos protegidos sin cambios**, los dos archivos autorizados idénticos a la señal estable y cero cambios de fuente durante QA. Las tres tareas temporales de handoff se borraron mediante API; [`89-handoff-after-cleanup.json`](/tmp/tracker-sales-bugfix-qa/89-handoff-after-cleanup.json) y `89-cleanup-check.log` acreditan sus tres IDs/prefijos, estado Completado y soft delete. No hay errores de consola/página, HTTP inesperado ni tráfico externo en sesiones after válidas; los 400 negativos son deliberados.

## Reproducción y límites

Comandos finales, desde raíz; todos terminaron con exit 0:

```bash
node progress/bugfix-qa/89-before.cjs before-fixed
node progress/bugfix-qa/89-ui.cjs after
node progress/bugfix-qa/89-backend.cjs after
node progress/bugfix-qa/89-rapid.cjs after
node progress/bugfix-qa/89-handoff.cjs after
node progress/bugfix-qa/89-edit-task.cjs after-fixed
node progress/bugfix-qa/89-cleanup-check.cjs
node progress/bugfix-qa/89-hashes.cjs
node progress/bugfix-qa/89-summary.cjs
```

El primer baseline `89-before-*` se terminó manualmente por fixture/selector; no se le adjudica un código interno no acreditado. El primer EditTask `89-edit-task-after-*` tuvo exit 1 en ambos perfiles porque buscaba «Editar» en vez de «Editar tarea». Cortes/logs/capturas conservados, excluidos del total válido; el retry `after-fixed` pasó sin cambio de producto. Para repetir usar otra fase y conservar evidencia anterior; el segmento backend negativo debe correr sin guardados concurrentes.

No se repitió la suite completa 82–88: se verificaron callers y guards relacionados con los dos archivos, además de los cinco gates requeridos. No se llamó IA. Entorno sólo UI 3001/API QA 3005/DB aislada 5434; API final de QA 86 fija, sin recompilar/reiniciar backend ni tocar producción. Fuentes congeladas; sin commits/push. El dictamen independiente del Reviewer se registra por separado.
