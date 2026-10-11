# Review 85-client-pipeline-integrity

Fecha: 2026-10-11 UTC. Rama: `fix/bugs-pendientes`. Base: `694fbd883a44b3997112890c9743f5562851e15c`.

**What this change does:** El expediente consulta al cliente por ID con autorización JWT y muestra errores visibles. El pipeline excluye clientes borrados sin eliminar historia, el drop sobre la misma etapa no muta y completar tareas conserva el nombre del cliente. La actividad valida campos con mensajes propios y conserva los inputs.

**Veredicto: PASSED.** Los siete criterios del CHECKPOINT 85 están verificados desde source, pruebas y navegador real. No hay hallazgos bloqueantes.

## Source y contratos revisados

Leí `AGENTS.md`, `docs/conventions.md`, el CHECKPOINT 85 y `progress/impl_85-client-pipeline-integrity.md`. Revisé los 16 archivos de implementación/spec del lote y sus contratos/callers: GetClientUseCase y su spec, módulo/controller de Clients, DealRepository y su spec; tipos/API/hooks de Clients, hooks/páginas de Pipeline, Agenda, Mi Día y ActivityForm. Contrasté IRepository/IUseCase, ClientDto/RequestUserDto/ClientEntity, repositorio de clientes, guards JWT/roles, hooks de pipeline/client-deals y componentes de errores.

El detalle deriva de `Omit<ClientDto, métricas>` en backend y `Omit<Client, métricas>` en frontend; no agrega métricas ficticias, defaults o cálculos duplicados. El use-case utiliza findById del repositorio existente y verifica owner JWT. La key de detalle incluye usuario; el historial se habilita y muestra sólo tras detalle autorizado. Los componentes importan hooks y usan shadcn. El filtro de pipeline sólo afecta resultados de lectura; no borra deals ni stageHistory.

## CHECKPOINT

| Criterio | Resultado | Evidencia concreta |
|---|---|---|
| Drop en etapa propia hace cero mutaciones, toast de error o confirmación de pérdida. | PASSED | `/tmp/tracker-sales-bugfix-qa/85-ui-positive-pipeline/result.json`: Contactado→Contactado registra drag/drop nativos trusted y monitor Atlaskit con dealId, target Contactado y puntero dentro del rect; 0 PATCH/toast/dialog. Control positivo de la misma sesión: Contactado→Interesado alcanza target real y PATCH 200, fixture restaurada por API QA. `85-pipeline-delete/result.json`: Perdido→Perdido también acredita target/puntero y 0 PATCH/toast/dialog. Source de PipelinePage retorna antes de abrir pérdida o mutar. |
| Completar conserva clientId, clientName y taskId visibles; nombre tiene respaldo de tarea cargada. | PASSED | `85-handoff-admin/result.json` y `85-handoff-seller/result.json`: 4/4 cada uno. Runner omite clientName exclusivamente de la respuesta PATCH completion local. Admin Agenda y Seller Mi Día recuperan nombre desde tarea cargada; nombre de cliente y título de tarea son visibles en actividad. URL, POST 201 y respuesta persistida conservan clientId/taskId/sellerId; incluye cliente fuera de los primeros 100. Source usa respuesta no vacía o nombre cargado, con respaldo de clientId. |
| GET /api/clients/:id con JWT y owner; missing/deleted 404, ajeno 403. | PASSED | `85-backend-after/result.json`: 20/20. Seller propio 200/ajeno 403 en ambos sentidos, Admin/Director 200 para ambos owners, missing/deleted 404 `Cliente no encontrado`, sin JWT 401. Resultado 200 conserva id y contactos. GetClient spec comprueba también Seller sin identidad antes de consultar, owner ajeno, tres roles y missing/deleted. Module/controller registran use-case bajo los guards existentes. |
| Expediente fuera de 100 funciona, queries no retornan undefined y 404 visible. | PASSED | API demuestra total 122, lista de 100 sin cliente objetivo y GET de ese id 200. `85-ui-positive-pipeline/result.json` muestra su dato real de necesidad y GET ID 200, sin error de query undefined. `85-pipeline-notfound/result.json`: GET ID 404 local sobre deal cargado muestra `Cliente no encontrado` y Reintentar; no retorna undefined como dato exitoso. Source usa clientsApi.getClient y estado isLoading/isError; no first100.find. |
| Pipeline personal/equipo excluye borrados, conserva historia e invalida queries al borrar. | PASSED | API after confirma exclusión en ambos pipelines y conservación de deal histórico, también tras nuevo soft-delete. `85-pipeline-delete/result.json`: 7/7, DELETE de UI 200; pipelines personal/team previamente cacheados hacen nuevos GET 200 y excluyen el cliente. SQL conserva un deal, una tarea y una actividad, con deletedAt del cliente. Specs personal/team conservan stageHistory y no llaman softDelete. useDeleteClient invalida prefixes clients (incluye detalle), pipeline (personal/equipo) y client-deals, contrastados con keys reales. |
| Actividad vacía muestra errores propios, conserva inputs y no envía; cliente/resumen/siguiente paso validados. | PASSED | `85-ui-after-validation/result.json`: 2/2. Form noValidate muestra clientId-error y summary-error con mensajes propios y 0 POST; Llamada muestra nextStep-error, nextDate-error y nextTime-error, conserva resumen/cliente y sigue con 0 POST. Source recoge todos los errores antes de onSubmit, valida trim de resumen/siguiente paso y no resetea inputs; corregir campo elimina su error y tipo no obligatorio limpia errores ocultos. |
| Tests nuevos de acceso/soft-delete y gates de ambos proyectos PASS. | PASSED | Logs `/tmp/tracker-sales-bugfix-qa/85-backend-{tsc,lint,tests}.log` y `85-frontend-{tsc,typecheck,lint,build}.log`: todos exit 0. Backend ESLint es comprobación sin --fix; Jest completo 18/18 suites, 113/113 tests. Reejecuté independientemente `get-client.use-case.spec.ts` y `deal.repository.impl.spec.ts`: 2/2 suites y 11/11 tests. `git diff --check` exit 0. Los 16 archivos mantienen hashes desde la verificación independiente; sus mtimes preceden los gates. No repetí build. |

## Evidencia y límites

Leí resultados finales y la sección Resultado QA85 de `progress/qa_82-88-bugfixes.md`: 42 checks PASS (API 20, pipeline/control positivo 4, validación 2, 404 visible 1, borrado/Perdido 7 y handoffs 8). Runners leídos en `progress/bugfix-qa/85-backend.cjs`, `85-ui.cjs`, `85-pipeline-tail.cjs`, `85-handoff.cjs` y `pipeline-dnd.cjs`. El helper observa el adapter Atlaskit ya instalado y la misma URL cargada por Vite, sin editar aplicación ni agregar dependencia.

Chromium real a 1440 px, claro, UTC; UI 127.0.0.1:3001, API 127.0.0.1:3005 y Postgres QA aislado 5434. Los segmentos positivos finales no tienen errores de página/consola, HTTP de fallo o conexiones bloqueadas. El segmento negativo 404 conserva ese HTTP y su error de recurso esperado; no se los presenta como ausencia de errores ni como fallo del producto.

Los intentos iniciales DND no acreditaban destino a partir del DOM del evento nativo, y el primer tail utilizaba textbox para un input search. Esos runs se conservan; el dictamen usa monitor de target real, control positivo y segmentos finales completos. No se aprobaron checks false de aquellos intentos.

Dependencias, lockfiles, core, configuración y metadatos intactos en el diff de implementación. El build termina exit 0 con advertencias de Atlaskit y un chunk superior a 500 kB; no se debilitan checks. El Reviewer escribió únicamente este archivo, sin editar source/tests/configuración/metadatos ni hacer commit/push.

**Verdict: Ship.**
