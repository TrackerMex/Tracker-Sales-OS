# Review 83-timepicker-calendar

Fecha: 2026-10-11 UTC. Rama: `fix/bugs-pendientes`. Base: `105537b4b3d4eddea6e1f7d7dde5cd17dbb98a79`.

**What this change does:** El selector de hora conserva la primera cifra antes de normalizar el valor, por lo que `08` termina en `08`. El botón del chip detiene su click antes de que la celda abra Crear; la activación nativa con Enter utiliza ese mismo handler.

**Veredicto: PASSED.** Los cinco criterios del CHECKPOINT 83 están verificados desde source, logs técnicos y casos reales de navegador. No hay hallazgos bloqueantes.

## Source y contratos revisados

Leí los dos archivos modificados: `frontend/src/components/ui/time-picker.tsx` y `frontend/src/modules/tasks/presentation/components/CalendarView.tsx`. Leí también `TimePickerField.tsx`, `CreateTaskForm.tsx`, `EditTaskForm.tsx`, `ActivityForm.tsx`, `AgendaPage.tsx`, `tasks.types.ts` y el componente shadcn `Button` en sus paths del frontend.

El buffer usa las cifras crudas y se reinicia con tecla no numérica, focus y blur. No cambian las interfaces, límites ni la conversión 12/24 de `frontend/src/shared/components/forms/TimePickerField.tsx`. La navegación de foco sigue utilizando los refs existentes. `TaskChip` conserva el botón nativo, ref, hooks de drag/drop y navegación del calendario; el cambio no cancela la activación del botón.

Ejecuté además los handlers del source real en memoria, sin editar archivos: el baseline convierte `08` en `12`, el source actual en `8`; horas 01–09, minutos 00/59 y resets por tecla no numérica y blur/focus pasan. Esta comprobación complementa la evidencia de navegador, sin sustituirla.

## CHECKPOINT

| Criterio | Resultado | Evidencia concreta |
|---|---|---|
| Horas 01–09; 08:15 AM/PM; 12 AM/PM y minutos 00/59 correctos. | PASSED | `/tmp/tracker-sales-bugfix-qa/83-after3/result.json` comprueba la matriz en Crear y Editar. Los cuatro POST de tarea responden 201 con `08:15Z`, `20:15Z`, `00:00Z` y `12:59Z`; el PATCH de edición responde 200 con `20:15Z`. `/tmp/tracker-sales-bugfix-qa/83-activity/result.json` confirma la matriz completa del campo de ejecución. `/tmp/tracker-sales-bugfix-qa/83-activity-tail/result.json` confirma captura y próximo horario AM/PM, incluido un próximo horario que inicia vacío, y POST 201 con `executedAt`/`programmedAt` a `20:15Z` y `nextTime` igual a `20:15` en payload y respuesta. |
| Flechas, Tab, reset de foco y edición de tareas/actividades conservan comportamiento. | PASSED | Los casos individuales de `83-after3/result.json` (Crear/Editar) y `83-activity/result.json` (ejecución de actividad) pasan: wrap de horas 12↔01, minutos 59↔00, ArrowRight/ArrowLeft, Tab/Shift+Tab, avance automático a minutos y periodo, cifra parcial tras blur/focus y cifra parcial seguida de ArrowUp. Los guardados reales citados arriba confirman el estado del formulario. |
| Click y Enter en chip abren solo Editar; celda vacía abre solo Crear con fecha correcta. | PASSED | `83-after3/result.json` registra un único diálogo visible `Editar tarea` para click y Enter nativo (`keyboard.press('Enter')`). `/tmp/tracker-sales-bugfix-qa/83-calendar-tail/result.json` registra un único Crear visible tras click físico en celda vacía y fecha exacta `15/10/2026`. |
| Drag y navegación mes/semana/día siguen funcionando. | PASSED | `83-calendar-tail/result.json` confirma drag con PATCH 200 a `2026-10-15T10:15:00.000Z`, conservando hora y minutos. Prev cambia y Next restaura los tres labels: Octubre→Septiembre→Octubre, 12–18 oct→5–11 oct→12–18 oct y 15 oct→14 oct→15 oct. El segmento termina con 0 fallos. |
| Regresión reproducible, sin dependencias nuevas; typecheck/lint/build PASS. | PASSED | Runners persistidos en `progress/bugfix-qa/83-timepicker-calendar.cjs`, `83-calendar-tail.cjs`, `83-activity-tail.cjs` y helper `lib.cjs`. Leí sus acciones y aserciones; el runner principal incorpora los selectores comprobados en los segmentos. Leí `/tmp/tracker-sales-bugfix-qa/83-tsc-app.log`, `83-typecheck.log`, `83-lint.log` y `83-build.log`: todos exit 0. Las dos entradas de source no cambiaron después de esos gates; no repetí el build. Diff limitado a esos dos archivos: paquetes, lockfiles, tsconfigs, core y backend intactos. `git diff --check` independiente: exit 0. |

## Evidencia y alcance

Los resultados fueron leídos desde disco, junto con `progress/impl_83-timepicker-calendar.md`. Browser real Chromium, Seller, 1440 px, claro y zona UTC; Vite `127.0.0.1:3001`, API `127.0.0.1:3005` y Postgres aislado en 5434. Los resultados finales de calendario y actividad tienen 0 fallos, sin HTTP de error, errores de página/consola ni conexiones bloqueadas. La matriz general de roles, tamaños y temas pertenece al QA final de los lotes 82–88.

La evidencia es acumulada por caso. Los primeros runs se cortaron por esperas de navegación o selectores del runner; sus casos ya verificados se conservaron y los tramos restantes se completaron en los segmentos finales. No se interpreta el `complete: false` de un run parcial como una suite completa aprobada.

El build conserva la advertencia preexistente de importación dinámica inefectiva de Atlaskit. El Reviewer solo escribió este archivo: no modificó source, tests, configuración o metadatos; no hizo commit ni push.

**Verdict: Ship.**
