# QA bugs 1–14 / features 82–88

Estado 2026-10-11: entorno local aislado **USABLE**. Baseline conservado; implementación/validación secuencial en curso. Este informe no declara PASSED de un lote sin su review independiente.

## Entorno y operaciones

- Postgres `postgres:17-alpine`, contenedor exclusivo `tracker-sales-bugfix-db`, bind `127.0.0.1:5434`, DB `tracker_sales_bugfix_qa`, usuario de prueba `tracker_bugfix_qa`. No comparte datos ni volúmenes con producción.
- API compilada desde fuente a `/tmp/tracker-sales-bugfix-qa/backend-dist`; bind `127.0.0.1:3005`. Inicialmente sesión `34642`/PID `3115231`; detenida sólo esa sesión y recompilada para84 estable: sesión activa `42351`, PID `3135487`, log privado `/tmp/tracker-sales-bugfix-qa/api-84.log`. Salud GET `/`200 después del reinicio.
- Vite fuente/HMR en `127.0.0.1:3001`, sesión activa `76644`, PID inicial `3113720`; variable efectiva `VITE_API_URL=http://127.0.0.1:3005`.
- Salud API `GET /` = `status: ok`; UI responde 200; login Admin/Director/Seller = 200. Se comprobó configuración efectiva del proceso sin imprimir secretos.
- `.env` del repo se conserva. Overrides privados en `/tmp/tracker-sales-bugfix-qa/qa.env`; credenciales DB en `db.env`, ambos modo 0600 y directorio modo 0700. Nunca se versionan.
- `TYPEORM_SYNCHRONIZE=false`, `TYPEORM_MIGRATIONS_RUN=false`, logging SQL desactivado. El esquema QA se inicializó una vez desde entidades mediante `seed.cjs` sobre DB vacía y con assertions que obligan host/puerto/DB aislados.
- LLM `openrouter` con ambas claves vacías; `NODE_OPTIONS` precarga `/tmp/tracker-sales-bugfix-qa/disable-external.cjs`, que rechaza `fetch` hacia hosts externos. Evita gasto externo incluso al pulsar sugerencias.
- Scripts Playwright sólo permiten orígenes UI3001/API3005; cualquier `/api` en Vite se aborta para evitar su proxy antiguo hacia3000. Ninguna prueba escribe fuera de3005. Dependencia Playwright/Chromium existente reutilizada (`/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright`); se puede sobreescribir con `QA_PLAYWRIGHT_MODULE`. Sin nuevas dependencias.
- Producción `tracker-sales-api/ui/nginx` no se reinició ni modificó;3000 pertenece a Dokploy.

Reinicio API QA: detener únicamente su sesión/PID anterior y ejecutar `bash progress/bugfix-qa/start-api.sh`. Compila `tsconfig.build.json` a `/tmp`, exporta overrides y arranca Node. Vite: `bash progress/bugfix-qa/start-vite.sh`. No ejecutar compose del repo para este QA.

Limitación de arranque preexistente: `ts-node src/main.ts` carga el spec de migración incluido en el glob TypeORM y falla `describe is not defined`. La compilación con `tsconfig.build.json` excluye specs y permite verificar fuente actual sin cambiar source.

## Fixtures y evidencia

`progress/bugfix-qa/seed.cjs` creó datos sólo QA con prefijo `QA-BUGFIX`: Admin/Director/Seller y Seller ajeno; vendedores activos, ajeno, inactivo y objetivo de acciones Equipo;123 clientes vivos (>100 del propietario), cliente antiguo fuera de los primeros100, cliente borrado con deal histórico, tres tareas, cinco actividades y tres ventas (Seller/ATC/Dirección). Identidades y IDs privados: `/tmp/tracker-sales-bugfix-qa/fixtures.json`.

Baseline API: `/tmp/tracker-sales-bugfix-qa/baseline/api.json`; observaciones UI: `baseline/core.log` y `baseline/seller-1440-light/result.json`. El script amplio inicial se interrumpió después de recoger los fallos principales para priorizar83; el log identifica observaciones incompletas y cambios concurrentes.

| Baseline | Evidencia observada |
|---|---|
|83 / bug1|Seller tecleó08:15 y se mostró12:15 antes del fix.|
|83 / bug3|Clic chip abrió Crear+Editar simultáneamente. PNG `baseline/seller-1440-light/calendar-chip-dialogs.png`.|
|84 / bug2|Admin Crear tarea devolvió500; conserva formulario. Captura/log baseline.|
|85 / bug8|Cliente borrado todavía visible en pipeline; GET por ID carece de ruta y devuelve404 `Cannot GET` incluso para cliente válido.|
|86 / bug6|Seller produjo403 para `/users`, `/reports/monthly`, `/reports/win-loss`; `/settings` y coaching propio devolvieron200 y deben preservarse.|
|87 / bug9|Escape de Crear devuelve foco a BODY.|
|88 / bug13|Ver medidas/capturas debajo.|
|82 / bug14|Fallo previo documentado en backlog. Paquete cambió concurrentemente al preparar QA; Líder/Reviewer verificaron el lote82 y commit105537b.|

Baseline backend comunicado por Líder: `tsc --noEmit` PASS;15 suites/78 tests PASS. ESLint sin `--fix` fallaba únicamente por formato Prettier en `src/main.ts:40`; corregido y verificado dentro de82. No se ejecutó el lint backend con mutación automática.

### Lámina antes del cambio88

Capturas PNG y `result.json` en `/tmp/tracker-sales-bugfix-qa/baseline/visual-{1440,390}-{light,dark}/`: `lamina-route.png`, `report-popup.png`; también `sales-mobile.png` a390. PNGs sólo en `/tmp`; no se añaden al git.

| Ancho | Ruta | Popup |
|---|---|---|
|1440|slide1080, scrollWidth1078, overflowdocumento0|slide1080, scrollWidth1078, overflowdocumento0|
|390|slide326, scrollWidth530, overflowdocumento0|slide326, scrollWidth541, overflowdocumento0|

El contenedor recorta contenido interno móvil pese a documento sin overflow. Contraste:96 nodos de texto medidos por composición sRGB sobre fondos computados,20 fallos AA en ruta/popup y ambos temas. Detalle por texto/color/ratio en result.json. La identidad Montserrat/navy/verde se registra para comparación posterior.

`PW_TEST_SCREENSHOT_NO_FONTS_READY=1` evita bloqueo del popup en fuentes externas (preexistente); redes externas se abortan. Las capturas verifican composición y contraste computado, y el lote88 debe comprobar explícitamente que Montserrat local esté lista.

## Regresiones por checkpoint

| Feature | Script/evidencia y cobertura requerida |
|---|---|
|82|Gates y prueba negativa implementada/revisada por agentes del lote; no editar source desde QA.|
|83|`progress/bugfix-qa/83-timepicker-calendar.cjs`: matrices teclado01–09/AM-PM/12/min00-59 en Crear,Editar y actividad; conversiones reales guardadas; chipclic/Enter; celda fecha completa; drag y navegación verificando cambio/restauración de rango. Ejecuciones `/tmp/tracker-sales-bugfix-qa/83-*/result.json` y `83-*.log`; primer run cortó por espera de navegación después de click y se corrige el runner antes de concluir.|
|84|Tres roles, selección vendedor activo, falta selección sin petición, consultas del mismo vendedor, validación inválido/inactivo, overrideJWT Seller, actividad desde tarea conserva dueño y cliente.|
|85|Dropmismaetapa sin PATCH/toast, tarea→actividad contexto visible, endpointID200/403/404 y cliente fuera100, exclusión borrados personal/equipo, validación vacía propia sin POST.|
|86|Registrar requests tres roles y rutas directas; respuestas lenta/fallida locales en acciones Equipo, dialogpersistente/disabled/error/reintento/éxito.|
|87|Foco Escape/Cancelar/éxito y tras eliminación para flujos enumerados; teclado,1440/390 y claro/oscuro; bounds acciones Ventas y scroll tabla, etiquetas rol/copy.|
|88|`progress/bugfix-qa/visual.cjs baseline|after`: cuatro combinaciones ruta+popup, dimensiones/documento+interno, contraste compuesto, datos/labels/identidad conservados.|

Pendiente: completar las regresiones después de cada Implementer, actualizar resultados aquí y entregar evidencia al Reviewer independiente. Sin PASSED anticipado.

Baseline adicional87 medido en Ventas admin390: acciones x389..417 quedan fuera del viewport390; wrapper de tabla clientWidth340/scrollWidth408 (68px), `overflow-x:auto`. Documento390, sin overflow global. Detalle en `baseline/visual-390-{light,dark}/result.json` y `sales-mobile.png`.

## Resultado QA83

**Cobertura funcional completa, PASS** con evidencia acumulada. Implementer/Reviewer mantienen sus gates y review independiente. Los primeros runs se cortaron por selectores/autowait del runner; esos fallos están conservados y no se presentan como fallos del producto.

- `/tmp/tracker-sales-bugfix-qa/83-after3/result.json` y `83-after3.log`: matrices Crear/Editar01–09, minutos00/59,08AM/PM,12AM/PM, flechas,Tab/Shift+Tab, resetblur/focus y tras tecla no numérica; auto-foco minutos/periodo. POSTs reales201 con08:15Z/20:15Z/00:00Z/12:59Z, PATCH20:15Z; clic y Enter abren únicoEditar.
- `/tmp/tracker-sales-bugfix-qa/83-activity/result.json` y `83-activity.log`: matriz completa del campo ejecución y capture08AM/PM; se detuvo sólo en etiqueta de opción.
- `/tmp/tracker-sales-bugfix-qa/83-calendar-tail/result.json` y `83-calendar-tail.log`: **6checksPASS,0fallos**. Celda15 abrió únicoCrear con15/10/2026; drag200 a15manteniendo10:15; rangosMes/Semana/Día cambianPrev y vuelven exactamenteNext. Fixture restaurada por API local.
- `/tmp/tracker-sales-bugfix-qa/83-activity-tail/result.json` y `83-activity-tail.log`: **10checksPASS,0fallos**. Ejecución/captura08:15AM/PM y nextTime originalmente vacío08:15AM/PM; POST201 persiste executedAt/programmedAt20:15Z y nextTime20:15 en payload y respuesta.
- Sin errores de consola/página ni HTTP en los segmentos finales. Capturas antes de envío, actividad guardada, celdaCrear y navegación en sus directorios respectivos.

Comandos finales reproducibles: `node progress/bugfix-qa/83-timepicker-calendar.cjs repeat all` (cobertura completa), `node progress/bugfix-qa/83-calendar-tail.cjs`, `node progress/bugfix-qa/83-activity-tail.cjs`. El principal incorpora selectores verificados por los segmentos (horaIntl real, Tabrole, fecha completa, opciónLlamada·pts, botones del popover, click físico de celda), `noWaitAfter` en acciones sin navegación y timeoutUI20s. No se repitieron matrices ya comprobadas después de integrar estos ajustes.

## Resultado QA84

Fuente estable confirmada por Implementer antes de recompilar API QA. Baseline HTTP con API anterior: `/tmp/tracker-sales-bugfix-qa/84-backend-baseline/result.json` y `84-backend-baseline.log`,22checks con14fallos esperados (inexistentes500, inactivos201 y contexto cruzado aceptado). Sólo datos QA en DB aislada.

- `progress/bugfix-qa/84-backend.cjs final`: `/tmp/tracker-sales-bugfix-qa/84-backend-final/result.json` y `84-backend-final.log`, **24/24PASS**. Admin/Director tareas/actividades con vendedor inexistente/inactivo y cliente cruzado rechazan400 antes de writes (counts tasks/activities/deals iguales). Selección válida201; Seller ignora sellerId falsificado y usa JWT; taskowner/client mismatch400 sin writes; actividad vinculada conserva owner/client/task y suma puntos sólo al dueño, nunca al id Admin.
- Coaching JWT captura únicamente mensajes del proveedor dentro de la precarga QA, archivo privado `/tmp/tracker-sales-bugfix-qa/llm-context.jsonl`; nunca salen a red y no se registran headers/claves. Calidad observada43%=promedio own y un summary ajeno identificable queda excluido; counts no cambian al solicitar sugerencia. La respuesta es201fallback.
- `progress/bugfix-qa/84-coaching-selected.cjs`: `84-coaching-selected/result.json` y `84-coaching-selected.log`, **2/2PASS**. Admin/Director seleccionan Other; prompt conserva promedio20% y los tres summaries recientes del owner elegido.
- `progress/bugfix-qa/84-ui.cjs after create admin|director`: `84-ui-after-{admin,director}-create/result.json`; logs `84-ui-{admin,director}-create.log`, **13/13PASS cada rol**. Required de objetivo/resumen están llenos para aislar el error de vendedor; sin owner muestra error propio, enfoca selector y envía0POST. Opciones excluyen inactive; POSTs201 mantienen selectedowner/client. Queries de ocupación, clients, pipeline, clientdeals y actividad diaria usan selectedowner; sugerencias usan el mismo payloadowner y fallbacklocal. Ownerchange limpia contexto vinculado, preservando inputs restantes.
- `progress/bugfix-qa/84-ui.cjs after completion`: `84-ui-after-admin-completion/result.json` **4/4PASS** y `84-ui-after-seller-completion/result.json` **3/3PASS**, log `84-ui-completion.log`. Admin Agenda completa tarea Other y selector queda disabled con dueño de tarea; Seller Mi día completa tarea propia. Ambas rutas y POSTactividad conservan sellerId/clientId/taskId y suman1punto al dueño. Nombre visible vacío pertenece al bug5/lote85, todavía no se declara comprobado.
- `progress/bugfix-qa/84-ui.cjs after manager-view`: `84-ui-after-director-manager-view/result.json` y `84-ui-manager-view.log`, **4/4PASS**. Mi día sin selección hace0queries de owner; seleccionar Other genera únicamente200 para sus tareas/dashboard, sin fallback al UUID del usuario. Admin/Director conservan modo lectura sin botónCompletar, conforme a permiso actual; no se amplió desde QA.
- Todos los segmentos UI finales tienen errors/http/blocked vacíos. Capturas privadas de formularios/contexto en los directorios de evidencia. Las tareas creadas por el runner se eliminan por sus IDs sólo QA al finalizar.

Primer backend-after incluyó cinco expectativas fuera del checkpoint (400 de coaching inexistente/inactivo o cliente ajeno): se conservó el resultado y se corrigió scope con el Líder/Reviewer. Coaching no escribe y puede retornar fallback genérico; el requisito comprobado es que JWT/selectedowner filtre datos. Primer backend-scoped coincidió con creación de fixtures UI y falló únicamente el count global concurrente; backend-final secuencial elimina esa carrera y registra counts antes/después. No fueron fallos de producto ni se escondieron resultados.

Para reproducir: ejecutar backend y UI **secuencialmente**, pues las assertions de ausencia de writes usan counts globales de la DB QA: `node progress/bugfix-qa/84-backend.cjs repeat`, `node progress/bugfix-qa/84-coaching-selected.cjs`, `node progress/bugfix-qa/84-ui.cjs repeat all`. Segmentos disponibles `create`, `completion`, `manager-view`; roles de create opcionales. Fuente de producción y `.env` permanecen intactos.
