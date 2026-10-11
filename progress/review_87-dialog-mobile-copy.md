# Revisión 87-dialog-mobile-copy

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`. Base revisada: `8f72394ce32a9c79340454541e348cd64b659d98`.

**What this change does:** Restaura el foco de los diálogos a su control actual o a un respaldo que sobrevive al refetch, mantiene accesibles las acciones de Ventas en móvil y corrige etiquetas de rol y Configuración.

**Resultado: PASSED — 6/6 criterios del CHECKPOINT verificados.**

Leí AGENTS.md, docs/conventions.md, CHECKPOINT87, el [resumen final del Implementer](/home/claude/sites/Tracker-Sales-OS/progress/impl_87-dialog-mobile-copy.md), contratos, componentes UI y todos los callers desde disco. Revisé el diff completo contra la base y el delta final de Agenda/TaskCard. Los 16 paths efectivos coinciden con los autorizados y enumerados en el resumen. Core, backend, dependencias, configuración, componentes UI globales y DataTable permanecen intactos; Equipo sólo cambia labels y Settings sólo copy.

## Criterios

| # | Veredicto | Evidencia verificada |
|---|---|---|
| 1 | PASSED | Crear/Editar/Reactivar/Eliminar tarea, clientes y ventas devuelven foco al control identificado de la fila o cabecera al cancelar, escapar y completar. La eliminación confirmada de tarea distingue el cierre de Cancelar/Escape y usa `agenda-create-task`; el efecto local espera que terminen los GET. Browser final DELETE200 retira la fila y conserva ese foco. Crear desde `agenda-create-empty` guarda201 y, después del refetch real retenido800ms que elimina el opener, enfoca la misma cabecera estable. Los botones actuales de Clientes/Ventas se resuelven por ID tras su remount. Pipeline pérdida vuelve a la oportunidad exacta, incluido el card nuevo en Perdido después de PATCH200/refetch. Cada caso acredita Tab visible. |
| 2 | PASSED | Todos los callers están cubiertos: formularios de tarea desde lista, chip y celda; Clientes desde lista y ficha; ventas; Sheet de oportunidad desde card y peek; historial desde Activities y dentro del Sheet; paleta por clic y Ctrl+K, con cierre Escape/Ctrl+K. El historial anidado devuelve foco al action de esa actividad y mantiene exactamente un Sheet; se comprueban Escape y Close. El Sheet usa el opener conectado o el card del mismo dealId cuando el popover desaparece. La paleta navega Clientes→Agenda y, al desmontarse el opener, devuelve foco al SidebarTrigger visible del destino; Tab sigue usable. Completar nativo de Agenda/Mi Día conserva foco y cero escrituras al cancelar/escapar después del ajuste final. |
| 3 | PASSED | Baseline Admin390 claro/oscuro: documento390, tabla client340/scroll408, acciones x389..417 fuera del viewport. After en ambos temas: acciones x321..349 con scrollLeft0, hit físico exacto y menú x173..349. Al desplazar la tabla68px las acciones permanecen visibles; el documento sigue390. El overflow horizontal queda en su wrapper existente. Los cuatro perfiles 1440/390 claro/oscuro pasan8/8; sólo se fija la columna actions con los tokens existentes. |
| 4 | PASSED | Ambos SelectItem de Equipo usan ROLE_LABELS; browser muestra Vendedor/Administrador y el select nativo conserva valores Seller/Admin y las mismas dos opciones. No cambia enums, permisos ni payloads. Settings cambia exclusivamente dos labels a oportunidades estancadas; keys y valores se conservan. QA de los cuatro perfiles comprueba la copia y GETsettings200. |
| 5 | PASSED | Continúan Dialog, AlertDialog, Sheet, DropdownMenu y Command de shadcn/Radix. El retorno usa onCloseAutoFocus, callbacks opcionales y refs/IDs locales de cada caller. No se modifica UI global ni se añade una abstracción global de foco, overlay custom, alert o confirm. Los diálogos nativos intactos tienen regresión browser positiva. |
| 6 | PASSED | QA real con teclado/clic en Seller1440 claro y390 oscuro, más layout/copy Admin en las cuatro combinaciones. Typecheck app+node, lint y build finales exit0; tsc app independiente y diff-check exit0. Regresiones83 de fecha/hora/drag y navegación, y86 de roles/caché/feedback también pasan. No quedan criterios sin evidencia. |

## Evidencia funcional

Leí runners persistentes, JSON, logs, medidas y capturas. El [consolidado final](/tmp/tracker-sales-bugfix-qa/87-final-summary.json) contiene **460 comprobaciones válidas acumuladas**, cero fallos pendientes; no representa escenarios únicos. Recalculé independientemente los positivos de cada JSON:460, sin discrepancias ni fallos adicionales. Los cinco cortes de runner tienen comprobaciones posteriores que cierran exactamente lo pendiente.

| Segmento | Evidencia y comprobaciones positivas |
|---|---|
| Tareas finales | [1440 claro](/tmp/tracker-sales-bugfix-qa/87-final-focus-tasks-1440-light/result.json) y [390 oscuro](/tmp/tracker-sales-bugfix-qa/87-final-focus-tasks-390-dark/result.json):38+38; log `87-final-focus-tasks.log`. |
| Opener vacío y refetch demorado | [1440](/tmp/tracker-sales-bugfix-qa/87-empty-task-final-1440-light/result.json) y [390](/tmp/tracker-sales-bugfix-qa/87-empty-task-final-390-dark/result.json):4+4; log `87-empty-task-final.log`. |
| Nativos y calendario exacto | `87-final-focus-native-{1440-light,390-dark}`:13+13; [calendario1440](/tmp/tracker-sales-bugfix-qa/87-final-focus-calendar-1440-light/result.json) y [calendario390](/tmp/tracker-sales-bugfix-qa/87-final-focus-calendar-390-dark/result.json):21+21. Logs `87-final-focus-native.log` y `87-final-focus-calendar.log`. |
| Callers con hashes conservados | Clientes37+37; ventas20+20 y DELETE204 tail3+3; Sheet11+11; pérdida13+13; historial10+10 y Close tail3+3; paleta7 escritorio/4 móvil y navegación tail3+3. Rutas exactas y logs en el consolidado y [reporte QA final](/home/claude/sites/Tracker-Sales-OS/progress/qa_82-88-bugfixes.md:175). |
| Ventas, labels y copy | [390 claro](/tmp/tracker-sales-bugfix-qa/87-layout-390-light/result.json), [390 oscuro](/tmp/tracker-sales-bugfix-qa/87-layout-390-dark/result.json),1440 claro/oscuro:8 por perfil. Logs `87-layout-hit-{width}-{theme}.log`; imágenes `sales-actions.png` y `settings-copy.png`. Baseline en `baseline/visual-390-{light,dark}/result.json` y `sales-mobile.png`. |
| Regresiones | Roles/caché86:9Admin+10Director+10Seller+5SPA. Drag83:3 positivos en `87-calendar-regression/result.json`; PATCH200 mantiene15oct10:15. Navegación por teclado [1440](/tmp/tracker-sales-bugfix-qa/87-calendar-navigation-1440-light/result.json)/[390](/tmp/tracker-sales-bugfix-qa/87-calendar-navigation-390-dark/result.json):4+4, Mes/Semana/Día seleccionados y rangos cambian/restauran. Equipo [usuario](/tmp/tracker-sales-bugfix-qa/87-team-normal-user/result.json)/[vendedor](/tmp/tracker-sales-bugfix-qa/87-team-normal-seller/result.json):10+10, con pending/error/retry/toast/foco y estados persistidos. |

Los dos fallos reales iniciales de Agenda — DELETE y creación desde estado vacío dejaban BODY tras refetch — permanecen en sus carpetas before. La aprobación usa retests finales distintos. Los cortes por etiqueta Agenda, título Historial, clic vertical fuera del viewport, celda genérica y estabilidad de Mes se conservan; los tails prueban destino y comportamiento concretos. DELETE de venta204 coincide con `sales.controller.ts`; el predicado inicial200/201 era incorrecto y el tail acredita204, fila retirada y foco estable. Equipo conserva exclusivamente el500 local forzado y su error de recurso esperado; no hay errores HTTP/consola/page ni tráfico externo inesperados en la matriz válida.

## Verificación técnica

La última edición de fuente fue **05:37:12.294UTC**. Los gates finales comenzaron05:37:22UTC y finalizaron05:37:49UTC; leí sus secciones FINAL AFTER AGENDA FIX:

| Gate | Resultado | Log bajo /tmp/tracker-sales-bugfix-qa |
|---|---|---|
| tsc app --noEmit | exit0 | `87-frontend-tsc.log` |
| typecheck app+node | exit0 | `87-frontend-typecheck.log` |
| lint, sin --fix | exit0 | `87-frontend-lint.log` |
| build | exit0 | `87-frontend-build.log` |
| git diff --check | exit0 | `87-diff-check.log` |

Ejecuté independientemente `pnpm exec tsc --noEmit -p tsconfig.app.json` sobre la fuente final y `git diff --check`: ambos exit0. Comparé los16 hashes actuales con [87-source-final.json](/tmp/tracker-sales-bugfix-qa/87-source-final.json): todos iguales. Respecto del primer after,14 archivos conservan hash y únicamente Agenda/TaskCard se corrigieron durante la pausa; sus segmentos relacionados se repitieron. No repetí build con las mismas entradas. Se conservan las advertencias previas de Atlaskit y tamaño de chunk.

No quedan hallazgos bloqueantes ni criterios pendientes. El Reviewer escribió únicamente este archivo, sin editar fuente/tests/config/metadatos ni hacer commit/push.

**Verdict: Ship.**
