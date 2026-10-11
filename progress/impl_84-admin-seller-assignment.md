# Implementación 84-admin-seller-assignment

Fecha: 2026-10-11. Rama: `fix/bugs-pendientes`.

## Resultado

Admin y Director seleccionan un vendedor activo antes de crear tareas o actividades. Sin selección aparece `FieldError` y no se envía POST. Seller usa su `sellerId` de sesión; los controllers de creación mantienen la imposición del JWT y rechazan Seller sin identidad.

El vendedor seleccionado gobierna creación, ocupación, tareas del día, pipeline, oportunidades del cliente, actividades del día y sugerencias. Las consultas del formulario se deshabilitan sin dueño. Al cambiar vendedor se limpian cliente/contacto, tarea/oportunidad y sugerencias dependientes, conservando los demás inputs. Los selectores usan shadcn `Select`, con IDs `task-seller` y `activity-seller`.

Completar una tarea desde Agenda o Mi Día conserva `Task.sellerId` en el search de la ruta de actividad. El formulario toma ese owner y fija el selector cuando está enlazado a una tarea. Backend comprueba tarea existente/no borrada y coherencia de dueño/cliente antes de escribir o sincronizar pipeline.

Task y Activity validan vendedor existente/activo mediante `ISellerRepository`; también validan cliente existente/no borrado y del dueño seleccionado mediante `IClientRepository`. Activity reutiliza el cliente validado al crear el deal, evitando otra consulta. Las identidades inválidas producen 400 con mensaje claro, antes de conflictos, pipeline o escrituras. Coaching impone JWT para Seller y filtra historial reciente por `sellerId` cuando está presente, además de excluir soft deletes; la consulta genérica de Admin sin owner conserva su comportamiento.

## Archivos exactos

Backend:

- `backend/src/modules/tasks/tasks.module.ts`: DI de SellersModule y ClientsModule.
- `backend/src/modules/tasks/application/use-cases/create-task.use-case.ts`: validación de vendedor/cliente antes de conflictos y persistencia.
- `backend/src/modules/tasks/application/use-cases/create-task.use-case.spec.ts`: casos anteriores conservados; inexistente/inactivo/borrado, cliente ajeno, identidad de los tres roles y Seller sin JWT. El controller usa use-cases reales; se mockean repositorios.
- `backend/src/modules/activities/activities.module.ts`: DI de SellersModule y TasksModule.
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.ts`: vendedor, tarea, owner/cliente coherentes y cliente validado reutilizado.
- `backend/src/modules/activities/application/use-cases/create-activity.use-case.spec.ts`: mantiene puntos/calidad/pipeline; añade rechazo antes de escrituras e identidad por controller real. Las expectativas previas que permitían cliente ajeno/inexistente ahora esperan BadRequest y cero persistencia.
- `backend/src/modules/coaching/presentation/coaching.controller.ts`: sugerencias Seller usan JWT y rechazan ausencia de sellerId.
- `backend/src/modules/coaching/presentation/coaching.controller.spec.ts` (nuevo): tres roles y ausencia de identidad, ejecutando el use-case real con repositorios mock y proveedor local determinista sin red.
- `backend/src/modules/coaching/application/use-cases/generate-suggestion.use-case.ts`: filtro por owner en actividades recientes.
- `backend/src/modules/coaching/application/use-cases/generate-suggestion.use-case.spec.ts` (nuevo): filtro exacto con owner/deletedAt y variante genérica sin owner.

Frontend:

- `frontend/src/modules/tasks/domain/tasks.types.ts` y `frontend/src/modules/activities/domain/activities.types.ts`: sellerId opcional en inputs existentes; no DTO duplicado.
- `frontend/src/modules/tasks/application/hooks/useCreateTask.ts` y `frontend/src/modules/activities/application/hooks/useCreateActivity.ts`: owner seleccionado para gestión, sesión para Seller; sin fallback a user.id.
- `frontend/src/modules/tasks/application/hooks/useTodayTasks.ts`, `frontend/src/modules/tasks/application/hooks/useMonthTasks.ts`, `frontend/src/modules/activities/application/hooks/useDailyActivities.ts`: sin fallback a user.id; override null deshabilita consultas en los hooks que aceptan override.
- `frontend/src/modules/coaching/application/hooks/useCoachingSuggestion.ts` (nuevo): mutación con input/output inferidos de la API existente.
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx` y `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`: selector activo, error propio, owner común y limpieza de contexto. Las forms llaman hooks; desaparecen imports directos de infraestructura.
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`: filtro de vendedor en lista/calendario, lista global derivada del equipo del mes actual, selecciona owner de tarea recién creada y conserva owner al completar.
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`: owner de ruta/formulario para consulta diaria y props del formulario.
- `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx` y `frontend/src/routes/_app/actividades.nueva.tsx`: handoff de sellerId de tarea.
- `frontend/src/shared/components/forms/ClientCombobox.tsx`: prop opcional sellerId, `ClientFilters.seller` en búsqueda e hidratación; no consulta cuando disabled.

No se cambiaron dependencias, lockfiles, core, estructura de carpetas, APIs de infraestructura ni cálculos de puntos/calidad.

## Gates y regresión unitaria

Logs con comando, directorio, timestamps UTC y exit:

| Directorio | Comando | Resultado | Log |
|---|---|---|---|
| backend | `pnpm exec tsc --noEmit` | exit 0 | [`84-backend-tsc.log`](/tmp/tracker-sales-bugfix-qa/84-backend-tsc.log) |
| backend | `pnpm exec eslint "{src,apps,libs,test}/**/*.ts"` | exit 0 final, sin --fix | [`84-backend-lint.log`](/tmp/tracker-sales-bugfix-qa/84-backend-lint.log) |
| backend | `pnpm test --runInBand` | exit 0; 17 suites / 104 tests | [`84-backend-tests.log`](/tmp/tracker-sales-bugfix-qa/84-backend-tests.log) |
| frontend | `pnpm exec tsc --noEmit -p tsconfig.app.json` | exit 0 | [`84-frontend-tsc.log`](/tmp/tracker-sales-bugfix-qa/84-frontend-tsc.log) |
| frontend | `pnpm run typecheck` | exit 0 | [`84-frontend-typecheck.log`](/tmp/tracker-sales-bugfix-qa/84-frontend-typecheck.log) |
| frontend | `pnpm run lint` | exit 0 | [`84-frontend-lint.log`](/tmp/tracker-sales-bugfix-qa/84-frontend-lint.log) |
| frontend | `pnpm run build` | exit 0 | [`84-frontend-build.log`](/tmp/tracker-sales-bugfix-qa/84-frontend-build.log) |

Backend lint inicialmente encontró formato/unbound-method sólo en specs nuevos; se corrigieron sin modificar runtime durante QA. El log conserva el fallo inicial y el exit 0 del retry; los 104 tests se repitieron después del ajuste y pasaron. `git diff --check` pasa. Build mantiene la advertencia preexistente del adaptador Atlaskit.

## QA real

Coordinación con `qa_bugfix_stack`: sólo API 127.0.0.1:3005, Vite 127.0.0.1:3001 y Postgres aislado 5434. Runtime se notificó estable antes de recompilar la API QA; no se alteró durante las pruebas.

- [`84-backend-final/result.json`](/tmp/tracker-sales-bugfix-qa/84-backend-final/result.json) y [`84-backend-final.log`](/tmp/tracker-sales-bugfix-qa/84-backend-final.log): **24/24 PASS**, cero fallos. Admin/Director reciben 400 al usar vendedor inexistente/inactivo y cliente ajeno; los conteos de tareas/actividades/deals no aumentan en rechazos. Creaciones válidas dan 201 para owner seleccionado. Seller enviando otro owner usa JWT. Tarea con dueño/cliente incompatibles da 400; caso válido conserva dueño/cliente/taskId/puntos. Los puntos aumentan para el vendedor de la tarea, sin registros para UUID admin. Coaching utiliza la calidad del JWT y excluye historial de otro dueño.
- [`84-coaching-selected/result.json`](/tmp/tracker-sales-bugfix-qa/84-coaching-selected/result.json) y [`84-coaching-selected.log`](/tmp/tracker-sales-bugfix-qa/84-coaching-selected.log): **2/2 PASS**, Admin/Director usan calidad e historial del vendedor seleccionado. El proveedor es local de QA, sin llamadas externas.
- [`84-ui-after-admin-create/result.json`](/tmp/tracker-sales-bugfix-qa/84-ui-after-admin-create/result.json) y [`84-ui-admin-create.log`](/tmp/tracker-sales-bugfix-qa/84-ui-admin-create.log): **13/13 PASS**. [`84-ui-after-director-create/result.json`](/tmp/tracker-sales-bugfix-qa/84-ui-after-director-create/result.json) y [`84-ui-director-create.log`](/tmp/tracker-sales-bugfix-qa/84-ui-director-create.log): **13/13 PASS**. Ambos roles comprueban error propio sin POST y foco en selector, opciones activas, consultas/AI con mismo dueño, limpieza de dependientes y POST 201 con owner correcto en ambos formularios.
- [`84-ui-after-admin-completion/result.json`](/tmp/tracker-sales-bugfix-qa/84-ui-after-admin-completion/result.json): **4/4 PASS**; [`84-ui-after-seller-completion/result.json`](/tmp/tracker-sales-bugfix-qa/84-ui-after-seller-completion/result.json): **3/3 PASS**; log común [`84-ui-completion.log`](/tmp/tracker-sales-bugfix-qa/84-ui-completion.log). Admin desde Agenda y Seller desde Mi Día conservan sellerId/clientId/taskId en ruta y POST; el selector enlazado queda fijo y el punto se atribuye al dueño. El nombre visible vacío es el bug 5 del lote 85 y no se declara corregido por este lote.
- [`84-ui-after-director-manager-view/result.json`](/tmp/tracker-sales-bugfix-qa/84-ui-after-director-manager-view/result.json) y [`84-ui-manager-view.log`](/tmp/tracker-sales-bugfix-qa/84-ui-manager-view.log): **4/4 PASS**. Mi Día sin selección hace cero queries de owner; seleccionar vendedor consulta sus tareas/dashboard con 200, sin fallback al UUID del usuario. Se conservan los permisos actuales de lectura de Admin/Director.

Todos los resultados UI finales tienen errors/http/blocked vacíos. QA restauró o eliminó sólo fixtures identificadas de la DB aislada. El primer backend-after incluyó expectativas fuera del checkpoint para coaching; el primer backend-scoped coincidió con fixtures UI y tuvo una carrera de conteos globales. Ambos resultados se conservan en el reporte de QA; el backend-final se ejecutó secuencialmente y pasó. Las evidencias finales anteriores son las utilizadas para comprobar los criterios.

Comandos de reproducción, secuenciales para evitar carreras en los conteos de ausencia de writes:

```sh
node progress/bugfix-qa/84-backend.cjs repeat
node progress/bugfix-qa/84-coaching-selected.cjs
node progress/bugfix-qa/84-ui.cjs repeat all
```

El runner UI permite segmentos `create`, `completion` y `manager-view`; el reporte con comandos exactos de cada segmento es [`progress/qa_82-88-bugfixes.md`](qa_82-88-bugfixes.md). La cobertura ejecutada es creación Admin/Director, handoff Admin/Seller y lectura Director; Seller también tiene regresiones de JWT en backend y tests unitarios. No se atribuyen casos no ejecutados.

Sin commits, push ni acciones en producción. No se avanzó al lote 85. La revisión independiente se registra por el Reviewer.
