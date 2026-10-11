# QA 89 — Activity/task/client sync

**QA funcional PASSED: 158/158 comprobaciones after, cero fallos inesperados.** El baseline anterior reproduce el bug con 16/16 comprobaciones. Base dev `47595dc`; ejecución el 11 de octubre de 2026. El dictamen independiente del Reviewer se registra por separado.

Sólo se usó el entorno aislado existente: UI `127.0.0.1:3001`, API `127.0.0.1:3005` y Postgres `127.0.0.1:5434`. La API final de QA 86 permaneció fija; no se recompiló ni reinició backend. QA escribió únicamente scripts/reportes autorizados y evidencia privada. No modificó source, tests, dependencias, Git, `.env` ni producción.

## Baseline anterior a la implementación

`89-fixture.cjs` preparó clientes A/B, contactos A/B, oportunidades A/B y tareas con cliente A/B, sin cliente, de otro vendedor y borrada, mediante APIs locales. Todos llevan prefijo `QA89`. Veintiún clientes de relleno dejan A fuera de los primeros 20 resultados del combobox. Las oportunidades nombradas se prepararon mediante actividades API: en esta base, POST `/pipeline/deals` no persiste `opportunityName`. No se fabricaron relaciones por SQL. Credenciales e IDs de fixtures quedan en `/tmp/tracker-sales-bugfix-qa/fixtures89.json`, sin credenciales versionadas.

`89-before.cjs before-fixed` terminó con exit 0: 4/4 comprobaciones por contexto, **16/16** en Seller 1440 claro, Seller 390 oscuro, Admin 1440 claro y Director 390 oscuro. Admin/Director eligieron explícitamente al vendedor propietario.

En los cuatro contextos, seleccionar cliente B, contacto B y oportunidad B, y después tarea A, conservó el nombre B y sus vínculos en UI. POST `/activities` envió tarea A con cliente/contacto/oportunidad B. Respondió 400 «La actividad debe conservar el cliente de la tarea.» y mostró el error. Snapshots SQL de lectura antes/después confirmaron cero actividades nuevas y pipeline/clientes sin cambios, incluidas etapas y `updated_at`. Se permitió únicamente el 400/error de recurso esperado; no hubo otros errores ni tráfico externo.

La reproducción válida está en `89-before-fixed-{seller-1440-light,seller-390-dark,admin-1440-light,director-390-dark}/`: `result.json`, `invalid-post.json`, `mismatch-before-submit.png` y `server-error.png`. Log: `89-before-fixed.log`. `89-source-before.json` conserva los hashes de fuente anteriores al cambio. El Implementer recibió el aviso de baseline completo antes de editar.

El primer intento `89-before.log`/`89-before-*` se conserva como corte de fixture/selector: buscaba Opportunity B después de crearla por POST `/pipeline/deals`, que devolvía `opportunityName: null`. Se terminó únicamente ese runner de QA. La fase `before-fixed` usó oportunidades nombradas correctamente y aún la fuente antigua. Ese corte no se cuenta como reproducción ni fallo de producto.

## Evidencia after válida

Cada carpeta de esta tabla contiene `result.json`, requests/status API sin tokens, consola/errores y capturas. Los guardados incluyen JSON de payload/respuesta; los casos de la matriz principal y los handoffs también comprueban filas reales por SQL de lectura.

| Segmento | Actores/perfiles | Checks válidos | Evidencia privada bajo `/tmp/tracker-sales-bugfix-qa/` |
|---|---|---:|---|
| Matriz de selección/cambio/registro | Seller 1440 claro y 390 oscuro; Admin 1440 claro; Director 390 oscuro | 24 × 4 = 96 | `89-after-{seller-1440-light,seller-390-dark,admin-1440-light,director-390-dark}/`, `89-ui-after.log` |
| Guard backend inválido | Seller, Admin, Director | 22 | `89-backend-after/result.json`, `89-backend-after.log` |
| Respuesta tardía y oportunidad nueva | Seller 1440 claro y 390 oscuro | 5 × 2 = 10 | `89-rapid-after-{1440-light,390-dark}/`, `89-rapid-after.log` |
| Agenda: tarea completada con cliente | Admin 1440 claro | 7 | `89-handoff-after-admin-1440-light/` |
| Mi Día: tarea completada con cliente | Seller 390 oscuro | 7 | `89-handoff-after-seller-390-dark/` |
| Mi Día: tarea completada sin cliente | Seller 1440 claro | 8 | `89-handoff-after-seller-1440-light-no-client/`, log común `89-handoff-after.log` |
| Combobox compartido en EditTaskForm | Seller 1440 claro y 390 oscuro | 4 × 2 = 8 | `89-edit-task-after-fixed-{1440-light,390-dark}/`, `89-edit-task-after-fixed.log` |

La matriz principal realizó siete POST201 por perfil, **28 actividades**. Cliente B/contacto B/oportunidad B → tarea A sincroniza el nombre exacto A, conserva el resumen y limpia los vínculos B. La carga GET por ID hidrata el contacto real A fuera de los primeros 20. Seleccionar ese contacto y oportunidad A guarda dueño, cliente A, tarea A y contacto A exactos. Cambiar A → B actualiza nombre/ID y limpia contacto/oportunidad A. Cambiar manualmente el cliente a B desvincula la tarea A y muestra «Se quitó la tarea vinculada al cambiar de cliente.». A → B → Sin tarea conserva B. Elegir una tarea sin cliente limpia el cliente anterior; elegir B manualmente después conserva esa tarea sin cliente. Una actividad no comercial con esa tarea admite cliente vacío, y una actividad comercial sin tarea guarda B. Submit vacío conserva la validación propia de cliente/resumen y hace cero POST.

El tail de respuesta tardía retuvo el GET exacto del cliente A, cambió a tarea B y después liberó A. En ambos perfiles permanecieron el nombre B, sólo contactos B y la etapa B. Para distinguirlas, se preparó por APIs QA la etapa A Contactado y B Prospecto después del baseline. El contacto quedó deshabilitado durante la carga A, sin reutilizar contacto B antiguo. Antes del cambio se había elegido «Nueva oportunidad» con un nombre propio; el campo desapareció y el POST201 final no incluyó ese `opportunityName` antiguo. El tail realizó dos guardados válidos.

Los handoffs completaron tres tareas nuevas reales por PATCH200 y acreditaron estado `Completado`, fuera de las opciones Pendiente, mediante GET `/tasks/seller/{owner}/today?date=...`. Agenda Admin y Mi Día Seller mantuvieron los IDs de dueño/cliente/tarea, el nombre A exacto y el cliente deshabilitado. Aunque ese picker estaba deshabilitado, GET por ID hidrató contacto A, que se guardó con POST201 y contexto SQL correcto. La tarea prelinked sin cliente mantuvo su título/vínculo fijo, permitió elegir cliente B y contacto B y guardó correctamente. Los tres guardados suman **33 POST201 after** junto con matriz/rapid. Las tareas temporales de handoff se borraron por API; `89-handoff-after-cleanup.json` verifica por lectura sus tres IDs/prefijos, estado Completado y `deleted_at`.

Los 22 negativos backend corrieron solos, después de la matriz y antes de cualquier tail con guardado, para que el contador global de actividades no tuviera carreras. Los tres roles recibieron 400 ante cliente incompatible, tarea ajena/borrada/inexistente y cliente ajeno/inexistente. Admin/Director también rechazaron vendedor inactivo/inexistente. Cada caso comparó snapshots idénticos de actividades, filas de pipeline y clientes QA antes/después. El guard sigue evitando escrituras antes del rechazo.

La regresión compartida abrió EditTaskForm sobre tarea A: nombre original e hidratación de contacto A, selección B/contacto B, vuelta a A con contacto B limpio y cancelación con cero mutations. El primer intento `89-edit-task-after-*` y su log se conserva con dos cortes: el runner buscaba menú «Editar»; el texto real es «Editar tarea». Se corrigió únicamente el selector y se repitió como `after-fixed`, exit 0 y 8/8. Los IDs `edit-task-client`/`edit-task-contact`, el estado Completado y el endpoint de tareas se ajustaron al contrato en disco antes de sus respectivos runs. No se atribuyen esos cortes a producto ni se incluyen en los 158 checks válidos.

Todas las sesiones browser after válidas registran cero HTTP inesperado, errores de consola/página y requests externos bloqueados. Los 400 del segmento negativo son deliberados. Se guardan resultados completos en `89-results-summary.json`; ese resumen cuenta `actual.pass` de browser y `pass` directo del runner API.

## Fuente estable, gates y límites

`89-hashes-after.json` verifica los dos archivos autorizados frente al snapshot final del Implementer y **389 archivos de source protegidos sin cambio** respecto a la evidencia final de QA 88. No cambió source después de la señal estable ni durante los runs. Backend, core, permisos, scoring, Crear/Editar tarea y Ventas permanecen protegidos; sólo cambiaron ActivityForm y ClientCombobox respecto al snapshot anterior.

El Implementer ejecutó cinco gates con exit 0 entre 07:21:59 y 07:22:33 UTC: `pnpm exec tsc --noEmit -p tsconfig.app.json`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` y `git diff --check`. Logs `89-frontend-{tsc,typecheck,lint,build,diff-check}.log` y snapshot `89-implementer-stable.json`. Build conserva la advertencia preexistente del tamaño de chunk. QA no repitió la suite 82–88; cubrió los callers y guards relacionados con este cambio de dos archivos. El dictamen independiente no se sustituye por estos resultados.

Playwright/Chromium ya estaban instalados; no se añadieron dependencias. `lib.cjs` usa por defecto el módulo existente bajo `/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright`; permite override `QA_PLAYWRIGHT_MODULE`. Los guards restringen el browser a UI3001/API3005. Las pruebas no llamaron IA ni producción. La evidencia privada conserva datos QA y respuestas sin credenciales; no se versionan PNG masivos.

## Comandos reproducibles y estado

Ejecutados desde la raíz del repo. Todos los comandos finales terminaron con exit 0; el primer intento EditTask terminó con exit 1 por selector en sus dos contextos y se conserva por separado. El primer baseline se terminó manualmente y no se le adjudica un código único no acreditado.

```bash
node progress/bugfix-qa/89-fixture.cjs
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

Los logs correspondientes están bajo `/tmp/tracker-sales-bugfix-qa/` con los nombres de la tabla y `89-{fixture,before-fixed,cleanup-check,hashes-after,summary}.log`. El backend negativo debe ejecutarse sin otros procesos escribiendo. Para una nueva fase se debe usar un prefijo distinto y conservar la evidencia anterior. El entorno QA sigue usable y las fuentes permanecen congeladas para revisión.
