# Implementación 83-timepicker-calendar

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`.

## Cambios

- `frontend/src/components/ui/time-picker.tsx`: conserva la primera cifra cruda en un ref, en lugar de reconstruirla a partir del valor normalizado. Antes, al teclear `08`, el primer `0` se convertía en `1`, la segunda tecla producía `18` y el límite de 12 horas mostraba `12`. El buffer se reinicia con teclas no numéricas, focus y blur; dos cifras siguen adelantando el foco. Se conservan límites, flechas y Tab.
- `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`: el click del botón `TaskChip` detiene la propagación antes de abrir edición. La activación nativa mediante Enter usa el mismo click, evitando que la celda del mes abra además creación. No cambian refs, nodo del botón, handlers de drag/drop ni navegación.

`frontend/src/shared/components/forms/TimePickerField.tsx` permanece intacto: su conversión 12/24 horas ya era correcta. No se añadieron dependencias ni se modificaron core, backend, contratos o componentes adicionales.

## Verificación técnica

Todos los comandos desde `frontend/`, con logs que registran comando, directorio, timestamps UTC y exit:

| Comando | Exit | Log |
|---|---|---|
| `pnpm exec tsc --noEmit -p tsconfig.app.json` | 0 | [`83-tsc-app.log`](/tmp/tracker-sales-bugfix-qa/83-tsc-app.log) |
| `pnpm run typecheck` | 0 | [`83-typecheck.log`](/tmp/tracker-sales-bugfix-qa/83-typecheck.log) |
| `pnpm run lint` | 0 | [`83-lint.log`](/tmp/tracker-sales-bugfix-qa/83-lint.log) |
| `pnpm run build` | 0 | [`83-build.log`](/tmp/tracker-sales-bugfix-qa/83-build.log) |

`git diff --check` también termina con exit 0. Build conserva la advertencia preexistente de importación dinámica inefectiva del adaptador Atlaskit.

## Regresión en navegador

Coordinada con `qa_bugfix_stack`, exclusivamente contra API `127.0.0.1:3005`, Vite `127.0.0.1:3001` y Postgres aislado en 5434. El baseline reprodujo ambas fallas (08:15 se normalizaba a 12:15 y un chip abría Crear y Editar).

Evidencia real acumulada, con Seller a 1440px, claro y timezone UTC:

| Caso | Resultado | Evidencia |
|---|---|---|
| Crear y Editar: 01–09, 08:15 AM/PM, 12 AM/PM, minutos 00/59, avance de foco a minutos/período, flechas con wrap, Tab/Shift+Tab, reinicio de cifra parcial al salir/volver y tras tecla no numérica | PASS | [`83-after3/result.json`](/tmp/tracker-sales-bugfix-qa/83-after3/result.json), [`83-after3.log`](/tmp/tracker-sales-bugfix-qa/83-after3.log) |
| Crear tareas reales 08:15 AM/PM y 12:00 AM/12:59 PM; editar a 08:15 PM | POST 201 conserva 08:15 / 20:15 / 00:00 / 12:59; PATCH 200 conserva 20:15 | Mismos archivos `83-after3` |
| Click y Enter en chip | Ambos abren un único diálogo Editar | Mismos archivos `83-after3` |
| Matriz en ejecución de actividad y captura AM/PM | PASS | [`83-activity/result.json`](/tmp/tracker-sales-bugfix-qa/83-activity/result.json), [`83-activity.log`](/tmp/tracker-sales-bugfix-qa/83-activity.log) |
| Actividad real: ejecución, captura y hora próxima inicialmente vacía, entrada 08:15 AM/PM | POST 201; executedAt y programmedAt guardan 20:15, nextTime guarda 20:15 | [`83-activity-tail/result.json`](/tmp/tracker-sales-bugfix-qa/83-activity-tail/result.json), [`83-activity-tail.log`](/tmp/tracker-sales-bugfix-qa/83-activity-tail.log): 10 checks PASS, 0 fallos |
| Celda vacía, arrastre y navegación Mes/Semana/Día | Abre sólo Crear con fecha 15/10/2026; drag PATCH 200 a ese día preserva 10:15; anterior cambia rango y siguiente restaura el inicial en los tres modos | [`83-calendar-tail/result.json`](/tmp/tracker-sales-bugfix-qa/83-calendar-tail/result.json), [`83-calendar-tail.log`](/tmp/tracker-sales-bugfix-qa/83-calendar-tail.log): 6 checks PASS, 0 fallos |

Los resultados anteriores contienen 123 checks exitosos en `83-after3` y 56 en `83-activity`, seguidos respectivamente por un timeout de autoespera del click de celda y un selector de tipo de actividad demasiado estricto. Esos runners iniciales no terminaron con exit 0: se conserva el diagnóstico y no se presenta como suite completa aprobada. QA corrigió los selectores/esperas del runner y completó los escenarios restantes mediante los dos segmentos tail; no hubo cambios adicionales de source. Los segmentos finales registran cero errores de página y cero HTTP fallidos.

Scripts reproducibles del agente QA, desde la raíz con el stack y fixtures aislados disponibles:

- `node progress/bugfix-qa/83-timepicker-calendar.cjs after3`: matrices de Crear/Editar y persistencia, click/Enter y calendario.
- `node progress/bugfix-qa/83-timepicker-calendar.cjs activity activity`: matriz de actividad.
- `node progress/bugfix-qa/83-calendar-tail.cjs`: celda vacía, fecha, drag y navegación; restaura la tarea de fixture al terminar.
- `node progress/bugfix-qa/83-activity-tail.cjs`: captura, ejecución, hora próxima vacía y POST real.

Pasos del runner: teclear las cifras mediante `page.keyboard.press` sobre los inputs reales; comprobar valores y elemento con foco; enviar los formularios y leer payload/respuesta de la API; contar diálogos; arrastrar el botón real entre celdas; comparar el rango del calendario antes/anterior/siguiente. Los asserts prueban el componente ejecutado y datos guardados, sin reimplementar el parser. Credenciales y fixtures locales se resuelven por `progress/bugfix-qa/lib.cjs` y no se imprimen. QA completo de tres roles, móvil y temas sigue en el lote global.

No se realizaron commits, push ni acciones en producción. No se avanzó al lote 84.
