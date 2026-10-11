# Implementación 85-client-pipeline-integrity

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`.

## Resultado

`GET /api/clients/:id` busca directamente por ID mediante `IClientRepository` y devuelve el cliente y sus contactos. Reutiliza `RequestUserDto` de `clients/application/dtos/client.dto.ts`. Admin y Director pueden consultar cualquier cliente activo; Seller consulta sólo su propietario JWT. Seller sin identidad y cliente ajeno producen 403; cliente inexistente o borrado produce 404. La ruta mantiene los guards JWT y de roles existentes.

El contrato de detalle deriva de los tipos existentes: backend `Omit<ClientDto, 'lastActivityAt' | 'isCold' | 'dataQuality'>` y frontend `ClientDetail = Omit<Client, mismas métricas>`. No declara métricas inexistentes, no agrega defaults y no duplica sus cálculos. `useClient` consulta por ID con una key que incluye la sesión; `useClientDetail` reúne detalle e historial en application. El componente ya no importa APIs de infraestructura ni busca entre los primeros 100. Muestra carga y error visible con reintento; una respuesta 404 rechaza la query, sin retornar undefined como dato exitoso.

El pipeline personal y del equipo carga únicamente clientes no borrados y excluye deals sin cliente vigente. Los deals y stageHistory históricos se conservan. Borrar cliente invalida `clients` (incluye detalle), `pipeline` (personal/equipo) y `client-deals`. Soltar un deal en su etapa actual retorna antes de mutar, emitir toast o abrir confirmación de pérdida.

Completar una tarea desde Agenda o Mi Día toma clientId de la respuesta o de la tarea cargada y clientName de la respuesta no vacía o del respaldo cargado. Conserva taskId y sellerId de la implementación 84.

ActivityForm usa `noValidate` y errores propios para vendedor, cliente comercial, resumen no vacío, siguiente paso y fecha/hora próxima cuando corresponde. Muestra todos los errores con FieldError/FormErrorSummary, enfoca el primer control inválido y retorna sin POST. Corregir un campo limpia sólo su error local/API, y cambiar a un tipo que no requiere siguiente paso limpia errores ocultos. No resetea inputs al validar ni ante errores API; no modifica puntos/calidad.

## Archivos exactos

Backend:

- `backend/src/modules/clients/application/use-cases/get-client.use-case.ts` (nuevo): búsqueda por ID, autorización y contrato derivado.
- `backend/src/modules/clients/application/use-cases/get-client.use-case.spec.ts` (nuevo): 7 casos de acceso para tres roles, owner ajeno, ausencia de identidad y missing/deleted. Verifica acceso directo por ID, contactos y ausencia de métricas ficticias. Sólo repository mock.
- `backend/src/modules/clients/clients.module.ts`: registra el use-case.
- `backend/src/modules/clients/presentation/clients.controller.ts`: delega GET :id al use-case con req.user.
- `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.ts`: filtros de clientes activos y exclusión en ambos métodos detailed; historia intacta.
- `backend/src/modules/pipeline/infrastructure/repositories/deal.repository.impl.spec.ts`: 2 regresiones personal/equipo con cliente activo, borrado y ausente, filtro exacto y conservación de stageHistory. Mantiene los tests previos de estancamiento.

Frontend:

- `frontend/src/modules/clients/domain/clients.types.ts`: ClientDetail derivado.
- `frontend/src/modules/clients/infrastructure/clients.api.ts`: getClient(id).
- `frontend/src/modules/clients/application/hooks/useClient.ts` (nuevo): query por ID con estado de error/reintento manual y key por sesión.
- `frontend/src/modules/clients/application/hooks/useDeleteClient.ts`: invalidaciones de clientes/pipeline/oportunidades.
- `frontend/src/modules/pipeline/application/hooks/useClientDetail.ts` (nuevo): consultas de detalle/historial y filtro de owner existente; historial sólo se muestra si detalle autorizado.
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`: usa hook y muestra carga/error; desaparece first100.find.
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`: no-op same-stage antes de pérdida/mutación.
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx` y `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`: respaldo de clientId/clientName desde tarea cargada al completar.
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`: validación propia, noValidate, foco y limpieza por campo sin perder inputs.

No cambios en core, dependencias, lockfiles, estructura, metadata, cálculo de métricas o historia comercial. Se conservaron los fixes 83/84.

## Gates

Todos los logs incluyen comando, directorio, timestamps UTC y exit:

| Directorio | Comando | Resultado | Evidencia |
|---|---|---|---|
| backend | `pnpm exec tsc --noEmit` | exit 0 | [`85-backend-tsc.log`](/tmp/tracker-sales-bugfix-qa/85-backend-tsc.log) |
| backend | `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` | exit 0, sin --fix | [`85-backend-lint.log`](/tmp/tracker-sales-bugfix-qa/85-backend-lint.log) |
| backend | `pnpm test --runInBand` | exit 0; 18 suites / 113 tests | [`85-backend-tests.log`](/tmp/tracker-sales-bugfix-qa/85-backend-tests.log) |
| frontend | `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit 0 | [`85-frontend-tsc.log`](/tmp/tracker-sales-bugfix-qa/85-frontend-tsc.log) |
| frontend | `pnpm run typecheck` | exit 0 | [`85-frontend-typecheck.log`](/tmp/tracker-sales-bugfix-qa/85-frontend-typecheck.log) |
| frontend | `pnpm run lint` | exit 0 | [`85-frontend-lint.log`](/tmp/tracker-sales-bugfix-qa/85-frontend-lint.log) |
| frontend | `pnpm run build` | exit 0 | [`85-frontend-build.log`](/tmp/tracker-sales-bugfix-qa/85-frontend-build.log) |

`git diff --check` exit 0. Build conserva la advertencia preexistente del adaptador Atlaskit.

## QA real

Runtime backend se declaró estable tras los tres gates backend y antes de recompilar API QA. Frontend estable se notificó a QA para pruebas con HMR. Sólo API 127.0.0.1:3005, Vite 127.0.0.1:3001 y DB aislada 5434; no acciones de producción.

Evidencia final leída desde disco:

- [`85-backend-after/result.json`](/tmp/tracker-sales-bugfix-qa/85-backend-after/result.json) y [`85-backend-after.log`](/tmp/tracker-sales-bugfix-qa/85-backend-after.log): **20/20 PASS**. Cliente fuera de los primeros 100, acceso Seller propio/ajeno, Admin/Director, 404 missing/deleted de los tres roles, 401 sin JWT, pipelines sin cliente borrado y nuevo soft delete que conserva el deal. Seller sin identidad se cubre en el spec del use-case (403 antes de consulta).
- [`85-ui-positive-pipeline/result.json`](/tmp/tracker-sales-bugfix-qa/85-ui-positive-pipeline/result.json) y [`85-ui-positive.log`](/tmp/tracker-sales-bugfix-qa/85-ui-positive.log): **4/4 PASS**. Control positivo de arrastre a otra etapa hace PATCH 200, se restaura fixture y el arrastre real a Contactado actual hace cero PATCH/toast/dialog. El monitor del adapter registra target Contactado y coordenadas dentro de su rectángulo. Cliente borrado ausente del DOM y expediente fuera100 con GET :id 200/datos reales, sin query undefined.
- [`85-ui-after-validation/result.json`](/tmp/tracker-sales-bugfix-qa/85-ui-after-validation/result.json) y segmento validation de [`85-ui-after.log`](/tmp/tracker-sales-bugfix-qa/85-ui-after.log): **2/2 PASS**. Submit vacío muestra errores propios cliente/resumen con noValidate y cero POST. Siguiente paso/fecha/hora muestran errores propios; resumen y cliente introducidos se conservan, sin POST.
- [`85-pipeline-notfound/result.json`](/tmp/tracker-sales-bugfix-qa/85-pipeline-notfound/result.json) y segmento notfound de [`85-pipeline-tail.log`](/tmp/tracker-sales-bugfix-qa/85-pipeline-tail.log): **1/1 PASS**. GET :id 404 local interceptado para un deal previamente cargado muestra Cliente no encontrado y Reintentar; no query undefined. El 404 y su error de recurso están registrados como respuesta esperada de este caso.
- [`85-pipeline-delete/result.json`](/tmp/tracker-sales-bugfix-qa/85-pipeline-delete/result.json) y [`85-pipeline-delete-final.log`](/tmp/tracker-sales-bugfix-qa/85-pipeline-delete-final.log): **7/7 PASS**. Perdido actual tiene target real/coords internas, cero PATCH/toast/confirmación. DELETE por UI 200 invalida y refetch de pipeline personal y team previamente cacheados; cliente desaparece de ambos. SQL confirma cliente soft deleted y deal/tarea/actividad históricos conservados.
- [`85-handoff-admin/result.json`](/tmp/tracker-sales-bugfix-qa/85-handoff-admin/result.json), [`85-handoff-seller/result.json`](/tmp/tracker-sales-bugfix-qa/85-handoff-seller/result.json) y [`85-handoff.log`](/tmp/tracker-sales-bugfix-qa/85-handoff.log): **4/4 PASS por rol**. Se omite clientName de respuesta completion mediante intercept local; Admin Agenda y Seller Mi Día recuperan nombre desde la tarea cargada. Cliente y tarea visibles en actividad; URL/POST 201/respuesta persistida conservan clientId/taskId/sellerId.

Los segmentos finales sin el 404 intencional tienen errors/http/blocked vacíos. Primeros DnD after/retry hicieron cero PATCH pero no probaron destino; el monitor del adapter existente y el control positivo cerraron esa evidencia sin editar fuente ni agregar dependencia. El primer tail se cortó por selector de inputsearch; se conserva en `85-pipeline-delete-first-run` y el log original. El resultado final de borrado está separado. No se ocultaron intentos fallidos del runner.

Runners preparados por QA y comandos reproducibles, secuenciales:

```sh
node progress/bugfix-qa/85-backend.cjs repeat
node progress/bugfix-qa/85-ui.cjs repeat all
node progress/bugfix-qa/85-pipeline-tail.cjs all
node progress/bugfix-qa/85-handoff.cjs
```

El reporte [`progress/qa_82-88-bugfixes.md`](qa_82-88-bugfixes.md), sección Resultado QA85, documenta los segmentos exactos ejecutados y las capturas privadas. Fixtures QA quedan identificadas por prefijo/IDs; no se borró historia comercial. Fuente backend/frontend permaneció estable durante after.

Sin commits/push. No se avanzó al lote 86. La revisión independiente corresponde al Reviewer.
