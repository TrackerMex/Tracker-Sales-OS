# QA bugs 1–14 / features 82–88

Estado 2026-10-11: entorno local aislado **USABLE**. Baseline conservado; implementación/validación secuencial en curso. Este informe no declara PASSED de un lote sin su review independiente.

## Entorno y operaciones

- Postgres `postgres:17-alpine`, contenedor exclusivo `tracker-sales-bugfix-db`, bind `127.0.0.1:5434`, DB `tracker_sales_bugfix_qa`, usuario de prueba `tracker_bugfix_qa`. No comparte datos ni volúmenes con producción.
- API compilada desde fuente a `/tmp/tracker-sales-bugfix-qa/backend-dist`; bind `127.0.0.1:3005`. Inicialmente sesión `34642`/PID `3115231`; recompilada84 estable en `42351`/PID `3135487` y después85 estable en `14707`/PID `3143142`, y86 inicial en `25949`/PID `3155012`;86 final corregida en sesión activa `11446`/PID `3162441`, log privado `/tmp/tracker-sales-bugfix-qa/api-86-final.log`. Se detuvo únicamente cada proceso QA anterior. Salud GET `/`200 después de cada reinicio.
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

Lotes83 y84 cerrados por review independiente y commits `8e48aa4` y `694fbd8` comunicados por el Líder.

## Resultado QA85

**Cobertura funcional completa,42checksPASS**; dictamen independiente corresponde al Reviewer. Baseline recogido antes de editar frontend y con API compilada84: `85-backend-baseline/result.json` y `85-backend-baseline.log` (19checks,17fallos esperados); `85-ui-baseline-{pipeline,validation}/result.json` y `85-ui-baseline.log` (4fallos esperados). GETid carecía de ruta (`Cannot GET`), deleted seguía en ambos pipelines, drop propio emitióPATCH400, query de expediente retornóundefined y required nativo interceptó validación vacía.

- `progress/bugfix-qa/85-backend.cjs after`: `/tmp/tracker-sales-bugfix-qa/85-backend-after/result.json` y `85-backend-after.log`, **20/20PASS**. Cliente000 fuera de los primeros100 se resuelve porID200; Seller own/ajeno200/403, Seller ajeno en sentido inverso403, Admin/Director ambosowners200; missing/deleted404 semántico y sinJWT401. Personal/equipo excluyen deleted; deal histórico permanece. Borrar cliente nuevo da404 y lo excluye de ambos pipelines conservando deal.
- `progress/bugfix-qa/85-ui.cjs positive pipeline`: `85-ui-positive-pipeline/result.json` y `85-ui-positive.log`, **4/4PASS**. Control positivo Contactado→Interesado envióPATCH200 y monitor del adapter registró targetInteresado; se restauró fixture por API y la misma sesión probó Contactado→Contactado con0PATCH/toast/dialog. Native drag/droptrusted y monitor registeredtargetContactado: rect x536/y145/w252/h339, pointer747/236 dentro. Expediente fuera100 usa GETid200 con datos reales, sin undefinedquery; deleted ausente del DOM.
- `progress/bugfix-qa/85-ui.cjs after validation`: `85-ui-after-validation/result.json` y `85-ui-after.log`, **2/2PASS**. Form noValidate muestra clientId/summary propios y0POST; Llamada muestra nextStep/nextDate/nextTime propios, preserva resumen/cliente y envía0POST. Capturas `empty-errors.png` y `next-errors.png`.
- `progress/bugfix-qa/85-pipeline-tail.cjs notfound`: `85-pipeline-notfound/result.json` y primer segmento de `85-pipeline-tail.log`, **1/1PASS**. GETid404 interceptado exclusivamente en API local sobre deal ya cargado muestra `Cliente no encontrado` + Reintentar; sin undefinedquery. Ese404 y el error de recurso correspondiente están registrados como respuesta esperada, no fallo del producto.
- `progress/bugfix-qa/85-pipeline-tail.cjs delete`: `85-pipeline-delete/result.json` y `85-pipeline-delete-final.log`, **7/7PASS**. Perdido→Perdido registra targetPerdido real (rect1164/145/252/339, pointer1375/236 dentro) con0PATCH/toast/lossdialog. Borrado por UI200 invalida y vuelve a consultar pipeline personal y team anteriormente cacheados; cliente desaparece de ambos. SQL en DB aislada confirma deletedAt del cliente y un deal, una tarea y una actividad históricos conservados. Esos registros QA quedan identificados por prefijo; no se borró historia.
- `progress/bugfix-qa/85-handoff.cjs`: `85-handoff-{admin,seller}/result.json` y `85-handoff.log`, **4/4PASS por rol**. Intercepta sólo PATCHcompletion local para omitir clientName; Admin Agenda con ownerOther y Seller Mi día con cliente000 recuperan nombre desde tarea cargada. Nombre de cliente y tarea son visibles; URL, POSTactividad201 y respuesta persistida mantienen clientId/taskId/sellerId. Capturas `visible-context.png`.

Primeros intentos DND after/retry registraron0PATCH pero no acreditaron destino con el DOM del evento nativo; no se aprobaron por eso. Se conservan logs/resultados de esos intentos (`85-ui-after-pipeline`, `85-ui-retry-pipeline`). El helper `progress/bugfix-qa/pipeline-dnd.cjs` importa la URL exacta del adapter Atlaskit ya cargado por Vite y observa su monitor, sin editar aplicación ni añadir dependencia. Control positivo y geometría cierran la evidencia. Primer tail se cortó por selector textbox en inputsearch; log/HTML/captura en `85-pipeline-delete-first-run` y `85-pipeline-tail.log`. Se corrigió sólo runner; resultado final independiente se guarda aparte.

Comandos finales secuenciales: `node progress/bugfix-qa/85-backend.cjs repeat`, `node progress/bugfix-qa/85-ui.cjs repeat all`, `node progress/bugfix-qa/85-pipeline-tail.cjs all`, `node progress/bugfix-qa/85-handoff.cjs`. Los segmentos sin404 esperado tienen errors/http vacíos; no hay tráfico fuera de UI3001/API3005. Backend/frontend estable confirmados antes de after; producción y `.env` intactos.


## Resultado QA86 inicial

**67checksPASS en los escenarios iniciales; el criterio7 reveló un fallo real adicional y requirió el retest final documentado debajo**. Fuente estable ampliada confirmada por Implementer antes de compilar/reiniciar únicamente API QA. El dictamen independiente corresponde al Reviewer. Baseline original de consultas prohibidas Seller conserva403 en `baseline/seller-1440-light/result.json`. La reactivación engañosa fue detectada por lectura del usecase previo (siempre active=false) y ampliada expresamente por el Líder; no se presenta esa lectura como ejecución baseline HTTP del toggle nuevo.

- `progress/bugfix-qa/86-fixture.cjs`: usuario dedicado `QA-BUGFIX-86-action` y vendedor `QA-BUGFIX Team Action` de fixtures, ambos activos al finalizar. Identidades privadas en `/tmp/tracker-sales-bugfix-qa/fixtures86.json`, sin password. La asociación inversa seller.user_id se preparó explícitamente por SQL sólo en la DB aislada, con assertions de host/puerto/DB e ID+prefijo; CreateUser previo sólo asignaba user.seller_id.
- `progress/bugfix-qa/86-backend.cjs`: `/tmp/tracker-sales-bugfix-qa/86-backend/result.json` y `86-backend.log`, **13/13PASS**. GET/sellers/all Admin200 incluye inactivos, Director/Seller403 y sinJWT401; GET/sellers original200 sólo activos para los tres roles. PATCH Director/Seller403 conserva estados. Admin baja/reactiva200 modifica seller y linkeduser false→true; lectura activa excluye/incluye y gestión conserva ambos estados.
- `progress/bugfix-qa/86-roles.cjs after`: `86-roles-after-{admin,director,seller}/result.json`, **9/9Admin,10/10Director,10/10SellerPASS**; log `86-roles.log`. Admin consulta users y sellers/all; Director conserva GETsellers y alta comercialPOST201, sin users ni acciones de baja. Seller rutas directas Reportes/Lámina muestran Acceso no disponible con0consultas prohibidas y0lámina; managers reportesmonthly/win-loss200, Settings200 tres roles y coaching propio Seller200.
- Mismo runner, `86-cache-after/result.json`, **5/5PASS**. Admin calienta users/reportes y logout/login SPA Director→Seller conserva performance.timeOrigin (sin recargar documento). Director no expone usuarios Admin cacheados; Seller no expone reporte/lámina cacheados ni envía consultas prohibidas. Captura `cached-access-denied.png`.
- `progress/bugfix-qa/86-team-feedback.cjs`: `86-team-{user,seller}/result.json`, **10/10PASS por acción**, log `86-team-feedback.log`. Cancelar/Escape idle hacen0PATCH y devuelven foco al botón de fila. Un PATCH retenido deja diálogo visible y ambos botones disabled; doble clic, Cancelar y Escape producen0envíos extra. Respuesta500 interceptada sólo en API local muestra error, conserva diálogo y permite retry; retry200 real cierra con toast y foco en user-actions/seller-actions. Bloqueado/De baja aparecen en UI refetch; activar/reactivar200 conserva fila, devuelve foco y muestra Activo, con estados SQL correctos seller+user. Capturas `pending.png`, `failure-retry.png`, `active-final.png`.

Permisos/caché tienen errors/http/blocked vacíos. En feedback cada contexto registra únicamente el500 forzado y su mensaje de recurso, como respuesta esperada; no hay otros errores ni tráfico externo. Las cuentas/ventas/clientes habituales no se alteran; fixture de acción termina activo. El comercial creado por Director queda identificado QA-BUGFIX y desactivado al limpiar por ID.

Comandos reproducibles secuenciales: `node progress/bugfix-qa/86-fixture.cjs`, `node progress/bugfix-qa/86-backend.cjs`, `node progress/bugfix-qa/86-roles.cjs repeat`, `node progress/bugfix-qa/86-team-feedback.cjs`. El parámetro repeat conserva otra carpeta de roles/caché; backend/feedback guardan rutas fijas y conviene archivarlas si se necesita comparar. API QA86 inicial usó sesión25949/PID3155012; fue reemplazada por la final11446/PID3162441, Vite3001. No cambios de source, dependencias, .env ni producción desde QA.


Hallazgo adicional86 del Reviewer confirmado por QA: `progress/bugfix-qa/86-normal-link.cjs before-fix`, `/tmp/tracker-sales-bugfix-qa/86-normal-link-before-fix/result.json` y `86-normal-link-before-fix.log`, **2PASS/1FAIL**. POSTseller201 + POSTuser201 con sellerId, sin asociación SQL manual, guarda user.seller_id pero seller.user_id=null. PATCHbaja200 deja seller.active=false y user.active=true. El escenario inicial enlazado por inverso sí pasó; no acredita el flujo normal de Equipo. Líder/Implementer/Reviewer notificados; en ese momento el lote86 quedó abierto hasta corregir el flujo normal. Reactivación de las nuevas fixtures devuelve ambos activos. Ninguna cuenta ajena modificada.


### Baseline foco87 ampliado

`progress/bugfix-qa/87-focus-baseline.cjs` abre/cierra sin submit. Resultados en `/tmp/tracker-sales-bugfix-qa/87-focus-baseline-{seller-1440-light,admin-390-dark}{,-tail}/result.json`; logs `87-focus-baseline.log` y `87-focus-baseline-tail.log`. TareaCrear/Delete, ClienteCrear/Edit/Delete, expediente Pipeline, ventaEdit/Cancelar/Delete y paleta click/Escape, CtrlK/Escape, CtrlK/CtrlK muestran BODY al cerrar en los escenarios registrados. NativeCompletar de TaskCard devuelve foco al opener. TaskEdit Admin390 y ActivityHistory Seller1440 devolvieron el opener en esta ejecución, aunque TaskEdit Seller1440 perdió foco; no se asume fallo uniforme de todos los callers.

Client/Sale menus desmontan/remontan sus botones al renderizar (opener connected=false); QA after comparará ID/label del control estable actualizado. El primer runner cortó por seleccionar textbox en inputsearch, corregido a searchbox en tail. Tail Admin capturó ventas390 pero paleta quedó incompleta por buscar botón Buscar oculto bajo640; runner se corrigió para usar teclado desde CrearTarea en móvil. Paleta escritorio sí conserva baseline completo de los tres caminos. No se atribuyen estos dos errores de selector al producto; no se repitieron escenarios ya capturados.


## Resultado QA86 final

**Cobertura funcional completa,81checksPASS** con API final corregida, compilada tras aviso estable del Implementer. Líder y Reviewer cerraron86 PASSED, commit8f72394. La evidencia inicial67PASS y el tail2PASS/1FAIL permanecen; la nueva fuente cubre asociación normal users.seller_id y legacy seller.user_id sin cambiar CreateUser ni esquema.

- `/tmp/tracker-sales-bugfix-qa/86-normal-link-final/result.json` y `86-normal-link-final.log`, **5/5PASS**, runner `86-normal-link.cjs final`. POSTseller201 y cuatroPOSTusers201 crean dos cuentas del vendedor, una ajena y una destinada a soft-delete. seller.user_id permanece null: no se fuerza vínculo inverso. Baja/reactiva200 alterna ambas cuentas del owner; la ajena activa y borrada inactiva conservan su estado y asociación. Sólo SQLfixturedeleted usa ID+username+sellerId exactos y guards de DB QA. IDs privados en fixtures86-normal.json.
- `86-legacy-link-final/result.json` y `86-legacy-link-final.log`, **9/9PASS**, runner `86-legacy-link.cjs`. Legacy null se crea por POSTuser sin sellerId + POSTseller con userId, sin SQL inverso. Legacy null y propio alternan con vendedor; seller con referencia legacy a cuenta ajena o borrada cambia200 y preserva la cuenta protegida, en ambos sentidos.
- `86-backend-final/result.json` y `86-backend-final.log`, **13/13PASS**. Permisos de GET/sellers/all, GETactivo original y PATCHbaja se revalidan con API final. El runner ahora admite argumento para carpeta separada; JSON inicial se restauró exactamente desde las13líneas estructuradas de86-backend.log tras colisión de nombre de salida. Log inicial y final se conservan separados.
- `86-team-normal-{user,seller}/result.json` y `86-team-normal-feedback.log`, **10/10PASS por acción**, runner `86-team-feedback.cjs normal`. Repite Cancel/Escape, pendingdisabled/dobleenvío,500/errorpersistente/retry200,toast/cierre/foco y reactivación real con cuenta del flujo normal, seller.user_id=null. UI users+sellers refetch y SQL muestran estados correctos; el objetivo y sus dos cuentas owner finalizan activos.
- `86-roles-final-{admin,director,seller}/result.json` y `86-cache-final/result.json`, **9+10+10+5PASS**, log `86-roles-final.log`. Repite tres roles/rutas y cambioSPA con caché Admin caliente después del backend definitivo; Directoralta201 permitida, SellerReportes/Lámina denegados sin queries, Settings/Coaching propio200 y sin datos prohibidos cacheados.

Sin HTTP/page/console/blocked inesperados: feedback conserva sólo su500 forzado y error de recurso correspondiente. Hay fixtures QA legacy/normal adicionales, incluida una cuenta borrada; ninguna identidad habitual ni datos de producción cambiaron. API final activa11446/PID3162441, salud200; no source/deps/.env editados desde QA.

Reproducción secuencial: `node progress/bugfix-qa/86-normal-link.cjs repeat`, `node progress/bugfix-qa/86-legacy-link.cjs`, `node progress/bugfix-qa/86-backend.cjs repeat`, `node progress/bugfix-qa/86-team-feedback.cjs normal`, `node progress/bugfix-qa/86-roles.cjs repeat`. La evidencia inicial y final indicada arriba debe archivarse antes de repetir rutas fijas.

## QA87: primera fuente estable y pausa de corrección

Implementer confirmó frontend estable y cuatro gates el11/oct antes del after; API final86 permanece fija (sesión11446/PID3162441), sin recompilar backend. QA tomó hashes SHA256 de los16paths autorizados en `/tmp/tracker-sales-bugfix-qa/87-source-before-fix.json`. No source/tests/deps/.env/producción modificados desde QA. Perfiles funcionales: Seller1440 claro y390 oscuro; Ventas/layout Admin, cuatro combinaciones1440/390 claro/oscuro. Datos nuevos usan QA-BUGFIX87 y se limpian por IDs del runner en DB aislada; DELETE de cliente conserva historia según85.

**Dos fallos reales impiden cerrar87**: `87-focus-tasks-{1440-light,390-dark}/result.json` y `87-focus-tasks.log` conservan37PASS/1FAIL por perfil: TaskDELETE200, fila retirada tras refetch y focoBODY, aun cuando el Tab posterior llega a un botón. `87-empty-task-before-{1440-light,390-dark}/result.json` y `87-empty-task-before.log` conservan3PASS/1FAIL por perfil: Create desde `agenda-create-empty` guarda201, refetch real demorado800ms retira opener y dejaBODY. Para el estado vacío se intercepta exclusivamente lectura APIQA con lista[] inicial; no se borran tareas existentes. Ambos fallos comunicados a Líder/Implementer/Reviewer. Pausa explícita de QA comunicada cuando terminaron todos procesos; sólo Agenda/TaskCard se corregirán y luego se repetirán segmentos afectados.

Segmentos válidos con fuente congelada, que se conservarán si sus hashes no cambian:

- `87-focus-clients-{1440-light,390-dark}/result.json`, log `87-focus-clients.log`: **37+37PASS**. Create/Edit de lista y Edit desde ficha `client-detail-edit`, Escape/Close y guardados reales201/200; Delete Escape/Cancelar0writes y DELETE200 devuelve foco aNuevoCliente trasfila desaparecida. Cada cierre verifica control exacto y Tab visible.
- `87-focus-sales-{1440-light,390-dark}/result.json`, log `87-focus-sales.log`: **20+20PASS y un mismatchrunner porperfil**, que esperaba200/201 al DELETE. Endpoint legítimo responde204; foco `sales-create`, fila oculta y Tab eranPASS. Predicado reproducible ahora acepta204 sóloDELETE. Evidencia específica `87-tail-sales-delete-{1440-light,390-dark}/result.json`, log `87-tail-sales-delete.log`: **3+3PASS**, status204 real, fila retirada, focoestable y Tab. Se conserva mismatch inicial sin atribuirlo al producto. Edit Esc/Cancelar/guardar200 y Delete Esc/Cancelar0writes acreditados; RegistrarVenta mantiene foco inline existente.
- `87-focus-pipeline-{1440-light,390-dark}/result.json`, log `87-focus-pipeline.log`: **11+11PASS**. Sheet desde VistaRápida→AbrirExpediente y desde card; Escape/Cerrar devuelven foco al origen conectado o al card de la misma oportunidad exacta cuando popup se desmonta, Tab al `deal-peek` del mismoID; sinmutaciones.
- `87-pipeline-loss-{1440-light,390-dark}/result.json`, log `87-pipeline-loss.log`: **13+13PASS**. Monitor adapter real y geometría acreditan destinoPerdido parafixture exacta. Escape/Cancelar0PATCH, foco cardoriginal y Tab. ConfirmaciónPATCH200/persistedPerdido+GETrefetch vuelve al card actualizado del mismoID y Tabpeek correcto. Capturas `loss-completed.png`.
- `87-focus-history-{1440-light,390-dark}/result.json`, log `87-focus-history-fixed.log`: **10+10PASS**. Caller Activities Escape/Close y caller Sheet Escape devuelven foco aaction exacto; cerrar historial dejaSheet1 y Tab dentrodelSheet. `87-tail-history-close-{1440-light,390-dark}/result.json`, log `87-tail-history-close.log`: **3+3PASS**, mismo comportamiento conClose. Primer corte selector `/Historial/` coincidía h2modal/h3acordeón; preservado en `87-runner-history-selector-{perfil}` y `87-focus-history.log`. Runner acota level2, sin cambio producto.
- `87-focus-palette-{1440-light,390-dark}/result.json`, log `87-focus-palette.log`: **7+4PASS** de click/escritorioEscape, CtrlK/Escape yCtrlK/CtrlKclose, focoopener yTab. Corte posterior sóloselector buscabaAgenda exacto frente a etiqueta realAgenda y tareas. Runner principal corregido. `87-tail-palette-nav-{1440-light,390-dark}/result.json`, log `87-tail-palette-nav.log`: **3+3PASS** de selección que navega Clientes→Agenda desdeNuevoCliente, opener desaparecido, focoSidebarTrigger visible en destino yTabvisible; sinfoco trasoverlay viejo.
- `87-layout-{1440,390}-{light,dark}/result.json`, logs `87-layout-hit-{width}-{theme}.log`: **8/8PASS por contexto**. Medición y `elementFromPoint` acreditan clic físico de acciones con scrollLeft0 tras desplazar página sóloverticalmente. A390 accionesx321..349 frente abaselinex389..417; doc390/overflow0, wrapper340/scrollWidth408 mantiene68px dentro tabla, menúvisible/clicablesin scrollhorizontalprevio. A1440 acciones1371..1399/doc1440, wrapper1142/scrollWidth1142. ROLE_LABELS muestraVendedor/Administrador con valoresSeller/Admin y opciones dominio intactos; Settingsoportunidades estancadas, GETsettings200 yusers200. Capturas `sales-actions.png`, `settings-copy.png`. Primer corte por botón debajo delviewport se conserva en `87-runner-layout-vertical-{perfil}` y logs `87-layout-{width}-{theme}.log`; no fallo producto.
- `86-roles-87-{admin,director,seller}/result.json`, `86-cache-87/result.json`, log `87-role-regression.log`: **9+10+10+5PASS**. Tresroles, consultas autorizadasSettings/Coaching200, usersAdmin ysellerallAdmin200, Director alta/lista ySeller denial Reportes/Lámina sinqueries; cachéSPA Admincaliente no sefiltra. Directorfixture de alta esQA y cleanup porID.

`87-focus-native-{1440-light,390-dark}/result.json`, log `87-focus-native.log`:13+13PASS de Completar nativoAgenda/MiDía Escape/Cancelar/opener/Tab0writes en primera fuente. Se repetirá después del arregloAgenda por estar relacionada. Calendario primer run `87-focus-calendar-{perfil}`/`87-focus-calendar.log` queda **sin aprobar**:1440 primerEscape3PASS y timeout de visibilidad con DOMdialogopen/sinHTTPerrors;39019PASS y dosfalse porque selector genérico pretendía celda16 pero retorno indicó15. Createfecha16/POST201/chipEnter/PATCH sí se registraron, pero no bastan para cierre. Runner endurecido usa IDs exactos chipfixture/celdaY-M-D, registra título y `elementFromPoint`/ancestro, pulsa número/espacio sinchip y repetirá después de source estable.

Comandos ejecutados: `node progress/bugfix-qa/87-focus.cjs tasks|clients|sales|pipeline|history|palette|native|calendar` (cada segmento independiente), `node progress/bugfix-qa/87-empty-task.cjs before`, `node progress/bugfix-qa/87-pipeline-loss.cjs`, `node progress/bugfix-qa/87-tail.cjs history-close|palette-nav|sales-delete`, `node progress/bugfix-qa/87-layout-copy.cjs WIDTH THEME`, `node progress/bugfix-qa/86-roles.cjs 87`. Sin HTTP/consola/pageerrors/tráficoexterno inesperados en segmentos válidos. RetestTask usa `QA87_PHASE=final` para conservar salida inicial; EmptyTaskadmitefaseargumento. Regresión83permitecarpetaargumento yFeedback86prefijodeout; evidencia histórica no se sobrescribe.

## Resultado QA87 final

**QA funcional completo, sin fallos pendientes en la matriz acordada.** El Reviewer conserva el dictamen independiente del CHECKPOINT. Después de la pausa, Implementer confirmó cinco gates finales y fuente congelada. Los hashes de `87-source-final.json` muestran que sólo AgendaPage y TaskCard cambiaron; los otros14paths coinciden exactamente con `87-source-before-fix.json`, por lo que su evidencia anterior se conserva. El consolidado reproducible `progress/bugfix-qa/87-summary.cjs` registra rutas, casos válidos, cortes de runner y fallos históricos separados en `/tmp/tracker-sales-bugfix-qa/87-final-summary.json`; no presenta la suma como escenarios únicos.

| Segmento | 1440 claro | 390 oscuro | Evidencia válida |
| --- | ---: | ---: | --- |
| Tareas crear/editar/reactivar/eliminar, Escape/Close/Cancelar/guardar y Tab | 38/38 | 38/38 | `87-final-focus-tasks-{perfil}` |
| Create desde agenda vacía, refetch real demorado y fallback | 4/4 | 4/4 | `87-empty-task-final-{perfil}` |
| Completar nativo Agenda y Mi Día | 13/13 | 13/13 | `87-final-focus-native-{perfil}` |
| Calendario chip/celda exactos, diálogo único, guardar y foco | 21/21 | 21/21 | `87-final-focus-calendar-{perfil}` |
| Clientes lista y ficha, incluidos guardar/eliminar | 37/37 | 37/37 | `87-focus-clients-{perfil}` |
| Ventas cierres/guardar + tail DELETE204 | 20 + 3 | 20 + 3 | `87-focus-sales-{perfil}`, `87-tail-sales-delete-{perfil}` |
| Sheet de pipeline desde card y peek | 11/11 | 11/11 | `87-focus-pipeline-{perfil}` |
| Pérdida: cancelaciones y confirmación tras drag/refetch | 13/13 | 13/13 | `87-pipeline-loss-{perfil}` |
| Historial Activities y Sheet + Close anidado | 10 + 3 | 10 + 3 | `87-focus-history-{perfil}`, `87-tail-history-close-{perfil}` |
| Paleta cierres + navegación con opener desaparecido | 7 + 3 | 4 + 3 | `87-focus-palette-{perfil}`, `87-tail-palette-nav-{perfil}` |
| Navegación Mes/Semana/Día por teclado y rangos | 4/4 | 4/4 | `87-calendar-navigation-{perfil}` |

En la tabla, `{perfil}` es `1440-light` o `390-dark`, bajo `/tmp/tracker-sales-bugfix-qa/`; cada carpeta contiene `result.json` y capturas. Los perfiles de layout/copy cubren además1440 oscuro y390 claro: **8/8PASS en cada una de las cuatro combinaciones**, con clic físico acreditado, scroll horizontal inicial0, overflow del documento0 y valores de rol intactos. Regresión de roles/caché: **9Admin +10Director +10Seller +5SPA**, sin consultas prohibidas ni403 inesperados.

Los dos fallos reales iniciales de Agenda se corrigieron: DELETE200 ya deja foco en `agenda-create-task` después de desaparecer la fila; Create201 desde `agenda-create-empty` deja el mismo foco estable después del GET demorado que desmonta el opener. Cada caso termina con Tab visible. Los JSON/logs before permanecen y los retests finales usan rutas distintas. Calendario final usa el ID de la tarea fixture y `calendar-day-Y-M-16`; `elementFromPoint` confirma número/espacio de esa celda sin chip, el título acredita Crear o Editar, y la fecha completa16/10/2026 se conserva. Los primeros intentos genéricos ambiguos no se usan para dar PASS.

Regresión83 adicional: `87-calendar-regression/result.json` y `87-calendar-regression.log` guardan **3PASS** (celda sóloCrear, fecha exacta, drag PATCH200 hacia15oct10:15 manteniendo hora). Se restauró la fecha original por ID al limpiar. El clic posterior en Mes se cortó esperando estabilidad; DOM mostraba los controles y no había HTTP/errors. El corte se conserva. `progress/bugfix-qa/87-calendar-nav.cjs` completa sólo navegación, con teclado real focus+Enter, aria-selected y rango que cambia/restaura en Mes/Semana/Día; **4+4PASS**, sin mutaciones ni errores. El tail83 reproducible ahora usa teclado para esos controles; no se repitió el drag mutante.

Regresión86 de Equipo: `87-team-normal-{user,seller}/result.json`, log `87-team-regression.log`, **10+10PASS**, fuente87 final y API86 fija. Cancelar/Escape idle sinPATCH; petición retenida bloquea confirmación/cierre/doble envío;500 local forzado conserva diálogo y error; retry200 cierra con toast y foco al botón estable; activación/reactivación200 refleja estado persistido y listas actualizadas. Fixture normal y sus cuentas owner terminan activos, sin tocar cuentas ajenas/borradas. El único500 y su error de recurso se registran como esperados; no hay otros errores ni tráfico externo.

Comandos finales: `QA87_PHASE=final node progress/bugfix-qa/87-focus.cjs tasks`, mismo comando con `native` y `calendar`; `node progress/bugfix-qa/87-empty-task.cjs final`; `node progress/bugfix-qa/83-calendar-tail.cjs 87-calendar-regression`; `node progress/bugfix-qa/87-calendar-nav.cjs`; `node progress/bugfix-qa/86-team-feedback.cjs normal 87-team`; `node progress/bugfix-qa/87-summary.cjs`. Logs finales `87-final-focus-{tasks,native,calendar}.log`, `87-empty-task-final.log`, `87-calendar-navigation.log`, `87-team-regression.log`, `87-final-summary.log`. Todos esos procesos terminaron; API/Vite aislados siguen disponibles, backend86 sin recompilar y producción intacta.

QA88 está preparado en `progress/bugfix-qa/88-visual.cjs`, con CLI opcional de width/theme para cuatro perfiles independientes de lectura, pero **after88 aún no ejecutado**. Conserva las ocho capturas baseline, mide documento y slide/texto interno, AA con composición alpha sobre fondo real, font local Montserrat cargada, tablas y teclado cuando hay overflow, y datos/labels/KPIs/funnel/orígenes/motivos/salud contra API actual e inputs iguales ruta/popup. No exige igualdad con números históricos antes de las escrituras QA.
