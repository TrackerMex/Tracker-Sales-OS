# Implementación 87-dialog-mobile-copy

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`. Base86: `8f72394`.

## Resultado

Los diálogos shadcn existentes restauran el foco mediante onCloseAutoFocus y callbacks/IDs locales. Los menús vuelven al botón actual de acciones de la fila; no al menuitem desmontado. Los formularios de tarea y venta y el historial aceptan un callback opcional del caller. Clientes/Ventas buscan por ID después de cerrar porque sus botones se vuelven a montar; las páginas esperan el refetch de una edición para recuperar el control actualizado si quedó BODY. No cambian el foco si el usuario ya lo movió a otro control.

Agenda guarda el control de Crear, el chip de calendario o el botón de acciones que abre Editar. La celda mensual tiene ID y tabIndex=-1 para restaurar su foco real; callbacks privados transportan HTMLElement opcional sin alterar Task ni core. Se conserva stopPropagation del chip83, Enter nativo, fecha, drag y navegación. Crear/Editar marcan el opener como retorno pendiente y esperan los GET de tareas: si Crear desde la lista vacía desmonta su botón, usan Crear tarea del header. Al confirmar Eliminar, TaskCard vuelve al header en el cierre y Agenda reafirma el destino estable después del éxito/refetch; Escape/Cancelar siguen volviendo a las acciones de la fila; al borrar cliente/venta el retorno usa Nuevo cliente/Registrar venta, controles que sobreviven al refetch. Los diálogos nativos de Completar en TaskCard y Mi Día permanecen intactos.

Pipeline devuelve el foco al opener conectado del expediente o al card por ID si el popover desaparece. Los cards son enfocables y abren con Enter/Espacio sin duplicar las teclas de sus botones internos. Pérdida por DnD vuelve al mismo card; tras confirmación y refetch busca el card nuevo en Perdido, con respaldo al contenedor enfocable del board. Historial tiene dos callers; dentro del Sheet retorna al botón de esa actividad dentro del propio Sheet, con respaldo al botón Cerrar del detalle.

CommandPalette captura activeElement sólo al abrir por botón/evento o Ctrl+K. Cerrar con Ctrl+K conserva el opener original. Al navegar a un comando cuyo opener desaparece, onCloseAutoFocus usa SidebarTrigger del shell existente; no enfoca el nodo desconectado ni cambia la navegación.

En Ventas sólo la columna actions usa sticky right-0, z local y bg-background opaco mediante ColumnDef.meta.className, aplicado por DataTable existente a cabecera/celdas. No cambia Cliente ni DataTable/Table; mantiene los datos y el scroll interior. Equipo usa ROLE_LABELS para los valores Seller/Admin existentes, sin añadir Director ni alterar permisos86. Settings cambia únicamente sus dos labels a oportunidades estancadas.

## Archivos exactos

1. `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`: opener por ID, callback de retorno y retorno tras refetch de creación/edición/eliminación.
2. `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`: prop opcional onReturnFocus y onCloseAutoFocus.
3. `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`: mismo callback.
4. `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`: botón actions estable, opener Editar y retorno en Reactivar/Eliminar; Completar nativo intacto.
5. `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`: IDs de chip/celda, celda tabIndex=-1 y HTMLElement opcional sólo en props privadas.
6. `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`: IDs actuales, apertura/cierre de Crear/Editar/Eliminar y foco actualizado después del refetch.
7. `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`: Sheet y pérdida DnD; retorno al card actual/refetch y board estable.
8. `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`: caller de historial dentro del Sheet y respaldo al Cerrar del detalle.
9. `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`: IDs, foco real al clic y operación Enter/Espacio del card.
10. `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`: actions sticky local, opener por ID, cierres/éxito/refetch y respaldo tras eliminación.
11. `frontend/src/modules/sales/presentation/components/EditSaleModal.tsx`: callback opcional onReturnFocus.
12. `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`: caller historial con botón actions actual y respaldo Registrar actividad.
13. `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx`: callback opcional compartido por ambos callers.
14. `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`: únicamente los dos labels de opciones de rol.
15. `frontend/src/modules/settings/presentation/pages/SettingsPage.tsx`: únicamente los dos labels de oportunidades estancadas.
16. `frontend/src/shared/components/command/CommandPalette.tsx`: captura/restauración de opener y respaldo del shell tras navegación.

Core, AGENTS.md, conventions y tipos/props existentes leídos antes de implementar. Sin core, backend, componentes UI globales, DataTable, dependencias, valores/enums, metadata ni estructura nuevos. Se conservan83–86; no cambios88. No tests unitarios que dupliquen la manipulación del DOM: la regresión significativa es browser con teclas/clic/HTTP reales por QA.

## Gates

Logs con comando, cwd, timestamps UTC y exit:

| Directorio | Comando | Resultado | Evidencia |
|---|---|---|---|
| frontend | `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit0 | [`87-frontend-tsc.log`](/tmp/tracker-sales-bugfix-qa/87-frontend-tsc.log) |
| frontend | `pnpm run typecheck` | exit0 | [`87-frontend-typecheck.log`](/tmp/tracker-sales-bugfix-qa/87-frontend-typecheck.log) |
| frontend | `pnpm run lint` | exit0, sin errores/warnings | [`87-frontend-lint.log`](/tmp/tracker-sales-bugfix-qa/87-frontend-lint.log) |
| frontend | `pnpm run build` | exit0 | [`87-frontend-build.log`](/tmp/tracker-sales-bugfix-qa/87-frontend-build.log) |
| repo | `git diff --check` | exit0 | [`87-diff-check.log`](/tmp/tracker-sales-bugfix-qa/87-diff-check.log) |

Gates repetidos tras los dos ajustes de Agenda/TaskCard: **cinco exit0**, sección FINAL AFTER AGENDA FIX de los mismos logs; frontend comenzó05:37:22UTC y terminó05:37:49UTC. Lint sin errores/warnings. Build conserva advertencias preexistentes del adaptador Atlaskit y tamaño de chunk. Los cambios ajenos concurrentes en docs/metadata y runners QA no fueron escritos por Implementer.

## QA y medidas

Baseline87 capturado antes de editar: [`progress/qa_82-88-bugfixes.md`](/home/claude/sites/Tracker-Sales-OS/progress/qa_82-88-bugfixes.md), sección Baseline foco87 ampliado. Runner `node progress/bugfix-qa/87-focus-baseline.cjs`; logs [`87-focus-baseline.log`](/tmp/tracker-sales-bugfix-qa/87-focus-baseline.log) y [`87-focus-baseline-tail.log`](/tmp/tracker-sales-bugfix-qa/87-focus-baseline-tail.log), JSON `87-focus-baseline-{seller-1440-light,admin-390-dark}{,-tail}/result.json`. Documenta BODY en los cierres afectados y Completar nativo correcto. TaskEdit/History no fallaron uniformemente en ambos callers/roles. Los cortes por selectores searchbox/Buscar oculto fueron corregidos en el runner y se conservan; no se atribuyen al producto.

Ventas390 antes: documento390 sin overflow, wrapperclient340/scroll408 (68px), actionsx389..417 fuera de viewport; wrapper overflow-x:auto. Capturas baseline [`sales-mobile.png claro`](/tmp/tracker-sales-bugfix-qa/baseline/visual-390-light/sales-mobile.png) y [`sales-mobile.png oscuro`](/tmp/tracker-sales-bugfix-qa/baseline/visual-390-dark/sales-mobile.png), medidas en result.json de esas carpetas.

FRONTEND87 ESTABLE notificado al Líder y QA después de los cinco gates PASS, y de nuevo tras la pausa de corrección. **QA funcional completo, sin bloqueantes pendientes**: Escape/Cancelar/éxito/delete en todos los callers, identidad exacta de tarea/oportunidad/fila, celda/chip, historial dentro de Sheet, paleta con navegación desde opener que desaparece, navegación/drag preservados y acciones de Ventas390 acreditados por browser real. Fuente congelada durante cada matriz. Entorno sólo UI3001/APIQA3005/DB aislada5434, sin producción. Dictamen independiente corresponde al Reviewer.


Primer after de tareas conservado: `87-focus-tasks-1440-light/result.json`: 37/38 checks PASS; único fallo foco tras DELETE200. `87-focus-tasks-390-dark/result.json`: 37/38 checks PASS; único fallo foco tras DELETE200. Log [`87-focus-tasks.log`](/tmp/tracker-sales-bugfix-qa/87-focus-tasks.log). Crear/Editar/Reactivar y cancelaciones pasaron; DELETE200 dejaba BODY porque el cierre priorizaba task-actions mientras existía y el refetch lo quitaba. Reviewer/Líder confirmaron el orden. Tras pausa explícita de QA se aplicó la corrección local: TaskCard distingue DELETE confirmado de Cancelar/Escape y Agenda marca pendingFocusId tras éxito para recuperar el header al terminar el refetch. No usa timers ni modifica el diálogo nativo de Completar. Retest tras corrección: `87-final-focus-tasks-{1440-light,390-dark}/result.json`, **38/38PASS por perfil**, log `87-final-focus-tasks.log`; DELETE200 devuelve a agenda-create-task después de desaparecer la fila. Los anteriores37/38 permanecen como evidencia del fallo real corregido.


Tail de opener vacío conservado: `node progress/bugfix-qa/87-empty-task.cjs before`, [`87-empty-task-before.log`](/tmp/tracker-sales-bugfix-qa/87-empty-task-before.log), JSON `87-empty-task-before-{1440-light,390-dark}/result.json`: **3/4 PASS por variante**, único fallo BODY después de POST201 desde agenda-create-empty y refetch real retenido800ms que desmonta el botón. SQL/tareas existentes no se borraron; se interceptó sólo la respuesta inicial vacía en APIQA. Tras la misma pausa explícita se marcó el retorno de Crear en pendingFocusId de Agenda para elegir el respaldo cuando termina el refetch. No cambia inputs, submit ni datos. Retest tras corrección: `node progress/bugfix-qa/87-empty-task.cjs final`, `87-empty-task-final-{1440-light,390-dark}/result.json`, **4/4PASS por perfil**, log `87-empty-task-final.log`. Después de POST201 y GET retenido800ms, el opener vacío desaparece y el foco vuelve a agenda-create-task. Los anteriores3/4 permanecen.

Medición after Ventas390 en claro/oscuro: acciones x321..349, visibles y clicables sin scroll previo; documento390 y wrapper340/scroll408 preservados (68px de scroll interno). Al desplazar el interior68px las acciones mantienen x321..349. El menú queda dentro del viewport (x173..349). Evidencia `87-layout-{390-light,390-dark}/result.json`; el sticky local bastó sin cambiar ancho de Cliente. ROLE_LABELS conserva valores Seller/Admin y sólo esas dos opciones; Settings muestra oportunidades estancadas. QA indica cobertura no afectada completa; Agenda ya tiene retest PASS. Calendario exacto y regresiones relacionadas completados abajo. `87-final-focus-native-{1440-light,390-dark}/result.json`, **13/13PASS por perfil**, log `87-final-focus-native.log`, confirma otra vez los diálogos nativos de Completar preservados después de cambiar TaskCard.

### After ya verificado, sin cambios de fuente durante QA

Los siguientes segmentos no quedaron afectados por el ajuste final local de Agenda/TaskCard. QA confirmó los resultados; se conservan los primeros intentos y los tails que cierran sus límites.

| Segmento | PASS | JSON bajo /tmp/tracker-sales-bugfix-qa | Log |
|---|---|---|---|
| Clientes Crear/Editar/Eliminar + Editar desde detalle | 37/37 por perfil | `87-focus-clients-{1440-light,390-dark}/result.json` | `87-focus-clients.log` |
| Expediente desde card/quickview, Escape/Cerrar | 11/11 por perfil | `87-focus-pipeline-{1440-light,390-dark}/result.json` | `87-focus-pipeline.log` |
| Pérdida DnD Escape/Cancelar/éxito y oportunidad exacta tras refetch | 13/13 por perfil | `87-pipeline-loss-{1440-light,390-dark}/result.json` | `87-pipeline-loss.log` |
| Historial ambos callers + Close dentro del Sheet | 10/10 + 3/3 por perfil | `87-focus-history-*` y `87-tail-history-close-*/result.json` | `87-focus-history-fixed.log`, `87-tail-history-close.log` |
| Paleta cierres por botón/CtrlK + navegación con opener desmontado | 7 desktop + 4 mobile; nav3/3 por perfil | `87-focus-palette-*` y `87-tail-palette-nav-*/result.json` | `87-focus-palette.log`, `87-tail-palette-nav.log` |
| Ventas Crear inline/Editar/cierres/foco + DELETE204 | 20 por perfil + tail3/3 por perfil | `87-focus-sales-*` y `87-tail-sales-delete-*/result.json` | `87-focus-sales.log`, `87-tail-sales-delete.log` |
| Ventas geometría/clic/scroll + labels/copy | 8/8 en1440/390 claro/oscuro | `87-layout-{1440,390}-{light,dark}/result.json` | `87-layout-final-{1440,390}-{light,dark}.log` |
| Roles/caché86 preservados | 34/34 | `86-roles-87-{admin,director,seller}/result.json`, `86-cache-87/result.json` | `87-role-regression.log` |

Reproducción secuencial: `QA87_PHASE=repeat node progress/bugfix-qa/87-focus.cjs all`; `node progress/bugfix-qa/87-tail.cjs history-close`, `palette-nav`, `sales-delete`; `node progress/bugfix-qa/87-pipeline-loss.cjs`; `node progress/bugfix-qa/87-layout-copy.cjs`; `node progress/bugfix-qa/86-roles.cjs 87`; `node progress/bugfix-qa/87-empty-task.cjs repeat`. Los tails son argumentos separados en ejecuciones individuales. QA usa perfiles seller1440claro/seller390oscuro para foco y admin para Ventas; geometría/copy usa cuatro combinaciones.

Límites conservados: primer Calendar usaba un clic ambiguo sobre celda vecina y un selector de título, por eso se repite con ID de tarea/celda y elementFromPoint; no se aprueba por el primer run. History/Palette tuvieron cortes por selector/espera de navegación, cerrados con tails. Sales inicial esperaba200/201 y marcó DELETE204 como fallo del runner; tail comprueba204 real, fila retirada y foco estable. Layout inicial no desplazó verticalmente las acciones fuera del alto de pantalla; el runner final comprueba hit físico tras scroll vertical y scroll horizontal inicial0. Esos intentos siguen en logs/resultados/HTML/capturas. No se confunden con los dos fallos reales de Agenda corregidos arriba.

Calendar final `87-final-focus-calendar-{1440-light,390-dark}/result.json` terminó **21/21PASS por perfil**, log `87-final-focus-calendar.log`: chip exacto, hit celda16 verificado por elementFromPoint, Escape/Close/Enter y guardados PATCH200/POST201. POST mantiene16/10/2026 y el foco vuelve a calendar-day-2026-10-16. Sin HTTP/page/console inesperados. Regresión Equipo86 final: `87-team-normal-{user,seller}/result.json`, **10/10PASS por acción**, log `87-team-regression.log`, fixture del vínculo normal users.seller_id. Mantiene pending/error/retry, éxito/foco y estados de ambas listas/cuenta. Drag83 PATCH200 preserva15oct10:15 y restaura fecha original al limpiar; navegación por teclado **4/4PASS en1440claro y390oscuro**, JSON `87-calendar-navigation-{1440-light,390-dark}/result.json`, log `87-calendar-navigation.log`. El corte del clic anterior queda preservado como límite del runner, completado por teclado real, aria-selected y rango que cambia/restaura Mes/Semana/Día. No se repitió el drag mutante.

Consolidado oficial QA: [`87-final-summary.json`](/tmp/tracker-sales-bugfix-qa/87-final-summary.json) y [`87-final-summary.log`](/tmp/tracker-sales-bugfix-qa/87-final-summary.log), generado por `node progress/bugfix-qa/87-summary.cjs`: **460 assertions válidas acumuladas, cero fallos pendientes**, no escenarios únicos. `currentStable=true`; `87-source-final.json` confirma14paths idénticos a la primera fuente estable y sólo AgendaPage/TaskCard corregidos durante la pausa. Cinco cortes de runner y las reproducciones históricas de los dos bugs reales permanecen separados. Reporte independiente de QA en `progress/qa_82-88-bugfixes.md`, sección Resultado QA87 final.

Comandos finales de segmentos afectados/regresiones: `QA87_PHASE=final node progress/bugfix-qa/87-focus.cjs tasks` (también `native` y `calendar`, ejecuciones separadas); `node progress/bugfix-qa/87-empty-task.cjs final`; `node progress/bugfix-qa/83-calendar-tail.cjs 87-calendar-regression`; `node progress/bugfix-qa/87-calendar-nav.cjs`; `node progress/bugfix-qa/86-team-feedback.cjs normal 87-team`. Drag guarda sus3PASS y corte posterior en `87-calendar-regression/result.json`/`87-calendar-regression.log`; navigation-tail cierra el contexto restante. Todos los procesos finales terminaron. Sin HTTP/consola/pageerrors/tráfico externo inesperados; Equipo conserva únicamente500 forzado y su error de recurso, como respuesta esperada. Fuente backend86 y producción intactas.

Sin commits/push. No se avanzó al lote88; dictamen independiente corresponde al Reviewer.
