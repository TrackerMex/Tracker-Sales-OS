# CHECKPOINTS.md - Criterios de Completitud por Feature

Cada feature debe cumplir TODOS los criterios de su checkpoint antes de marcarse como `done`.

---

## 01-infra-setup

- [x] `docker-compose up -d` levanta postgres, backend y frontend sin errores
- [x] `GET http://localhost:3000/` retorna 200 (health check)
- [x] `GET http://localhost:3000/api/docs` muestra Swagger UI
- [x] `cd backend && pnpm start:dev` inicia sin errores TypeScript
- [x] `cd frontend && pnpm dev` inicia sin errores TypeScript
- [x] Variables de entorno documentadas en `.env.example`

---

## 02-auth

- [x] `POST /api/auth/login` con credenciales validas retorna `{ accessToken: string }`
- [x] `POST /api/auth/login` con credenciales invalidas retorna 401
- [x] JWT contiene `{ sub, username, role, sellerId }`
- [x] `JwtAuthGuard` bloquea rutas sin token (401)
- [x] `RolesGuard` bloquea rutas sin rol correcto (403)
- [x] Contrasena almacenada como bcrypt hash (nunca plaintext)
- [x] Tests unitarios en `auth.service.spec.ts` pasan
- [x] Frontend: pantalla de login funciona, token se guarda en localStorage
- [x] `tsc --noEmit` sin errores en frontend y backend

---

## 03-users-sellers

- [x] `GET /api/users` (Admin only) lista usuarios con paginacion
- [x] `POST /api/users` crea usuario con rol y vincula a seller
- [x] `PATCH /api/users/:id/block` bloquea/activa usuario
- [x] `GET /api/sellers` lista comerciales activos
- [x] `POST /api/sellers` crea nuevo comercial
- [x] Seller bloqueado no puede hacer login
- [x] Frontend: pagina Equipo muestra lista de usuarios y sellers

---

## 04-clients

- [x] `POST /api/clients` crea cliente/prospecto con validacion anti-duplicados
- [x] Anti-duplicados: verifica nombre empresa, dominio, telefono, correo
- [x] `GET /api/clients` con filtros (stage, type, seller)
- [x] `PATCH /api/clients/:id` actualiza cliente incluyendo stage y nextStep
- [x] `POST /api/clients/:id/contacts` agrega contacto al cliente
- [x] Seller solo ve sus propios clientes (RolesGuard)
- [x] Admin y Director ven todos los clientes
- [x] Frontend: pagina Clientes muestra tarjetas con busqueda full-text

---

## 05-activities

- [x] `POST /api/activities` registra actividad con calculo automatico de puntos
- [x] Puntos calculados correctamente segun TASK_POINTS constant
- [x] Calidad calculada (0-100%) segun completitud de campos
- [x] Validacion: Llamada/Reunion/Visita/Propuesta requieren nextStep + fecha + hora
- [x] `GET /api/activities/seller/:id/daily` retorna puntos del dia
- [x] `capturedAt` vs `executedAt` registrados (delayMinutes calculado)
- [x] Frontend: formulario de actividad valida campos requeridos por tipo
- [ ] Tests unitarios para calculo de puntos y calidad (no verificado — requiere ejecución manual)

---

## 06-tasks

- [x] `POST /api/tasks` crea tarea con scheduledAt
- [x] `GET /api/tasks/seller/:id/today` lista tareas de hoy
- [x] `PATCH /api/tasks/:id/complete` marca como completada -> crea actividad draft
- [x] Seller solo ve sus propias tareas
- [ ] Frontend: pagina Agenda muestra tareas con estado visual (no verificado visualmente)
- [ ] Tareas vencidas marcadas visualmente en rojo (no verificado visualmente)

---

## 07-pipeline

- [x] `GET /api/pipeline/seller/:id` retorna deals agrupados por stage
- [x] `PATCH /api/deals/:id/stage` cambia stage con validacion de transicion permitida
- [x] `stageHistory` actualizado en cada cambio (JSONB append)
- [x] `probability` actualizado automaticamente segun stage
- [ ] AuditInterceptor registra old_values y new_values (implementado pero no verificado)
- [ ] Frontend: vista Kanban con 7 columnas draggable (implementado con select dropdown, no drag nativo)

---

## 08-sales

- [x] `POST /api/sales` registra cierre (tipo seller/atc/direction)
- [x] `GET /api/sales` con filtros de mes, seller, tipo
- [ ] Calculo correcto de unidades nuevas vs existentes (no verificado — requiere prueba con datos)
- [ ] Frontend: 3 formularios independientes por tipo de venta (no verificado visualmente)

---

## 09-dashboard

- [x] `GET /api/dashboard/summary` retorna KPIs globales del mes
- [x] `GET /api/dashboard/sellers-score` retorna semaforo de vendedores (0-100%)
- [x] Score calculado: 45% esfuerzo + 35% calidad + 40% volumen - 10 por vencido
- [x] `GET /api/dashboard/overdue-tasks` retorna seguimientos vencidos
- [x] Frontend: dashboard muestra metricas + semaforo visual. Click vendedor → /coaching. Gráfica usa datos reales.

---

## 10-mi-dia

- [x] `GET /api/mi-dia/seller/:id` retorna estado operativo del dia
- [x] Incluye: puntos acumulados, llamadas, agenda de manana count, prospectos nuevos, vencidos
- [x] Frontend: termometro con colores (verde/ambar/rojo/morado)
- [x] Alertas IA Coach basadas en patrones del dia

---

## 11-coaching

- [x] `GET /api/coaching/seller/:id/daily` retorna reporte del dia
- [x] Mix de actividades calculado (% por tipo)
- [x] Frontend: pagina Coaching muestra reporte por vendedor. Tag color condicional. minDaily desde Settings.
- [x] Admin y Director pueden ver reporte de cualquier seller. Selector de vendedor implementado.

---

## 12-ai-coach

- [x] `POST /api/coaching/suggestion` llama LLM (OpenRouter dev / Anthropic prod) y retorna sugerencia
- [x] Prompt incluye: tipo actividad, objetivo, cliente, stage del deal
- [x] Timeout configurado via LLM_TIMEOUT_MS (default 3000ms)
- [x] Manejo de errores: si API falla, retorna sugerencias por defecto (source: "fallback")
- [x] Keys en .env.example: OPENROUTER_API_KEY / ANTHROPIC_API_KEY
- [x] Frontend: botón "Obtener sugerencias" en ActivityForm y CreateTaskForm

---

## 13-reports

- [x] `GET /api/reports/monthly?month=YYYY-MM` retorna consolidado
- [x] Separado por: Direccion + ATC + Vendedores
- [x] Calcula: metas vs logros, unidades nuevas vs existentes, origen cuentas
- [x] Admin y Director solo
- [ ] Frontend: pagina Reportes con tabla y metricas del mes (no verificado visualmente)

---

## 14-settings

- [x] `GET /api/settings` retorna configuracion actual
- [x] `PATCH /api/settings` actualiza: dailyMinPoints, monthlyAmountGoal, etc.
- [x] Solo Admin puede modificar settings
- [ ] Frontend: pagina Configuracion con formulario de settings (no verificado visualmente)

---

## 15-import-export

- [x] `GET /api/export` retorna JSON con todos los datos del tenant
- [x] `POST /api/import` importa JSON y valida schema antes de insertar
- [x] Import hace upsert (no duplica si ya existe)
- [x] Solo Admin
- [x] Frontend: pagina Import/Export con botones de descarga y upload

---

## 16-ui-design-review

**Fase 1 — Inventario visual (sin tocar código)**

- [ ] App levanta sin errores con `docker-compose up -d`
- [ ] Login funciona con los 3 roles (Admin, Director, Seller)
- [ ] Todas las rutas del router cargan sin blank screen ni errores en consola
- [ ] Sidebar/navegación muestra items correctos según rol
- [ ] Dashboard: métricas visibles, semáforo renderiza
- [ ] Mi Día: termómetro operativo visible con datos
- [ ] Clientes: lista carga, filtros visibles, tarjetas con información
- [ ] Pipeline: 7 columnas Kanban visibles
- [ ] Actividades: formulario con todos los campos según tipo de actividad
- [ ] Tareas/Agenda: lista del día visible
- [ ] Coaching: reporte por vendedor visible (Admin/Director)
- [ ] Reportes: tabla mensual visible (Admin/Director)
- [ ] Configuración: formulario de settings visible (Admin)
- [ ] Hallazgos documentados en `progress/explore_ui_review.md`

---

## 17-integration-testing

**Fase 2 — Flujos funcionales end-to-end**

- [x] **Auth flow**: Login → token guardado → rutas protegidas → logout limpia sesión (verificado en código)
- [ ] **Flujo Seller diario**: Crear tarea → completar tarea → formulario actividad prellenado → registrar actividad → puntos reflejados en Mi Día (requiere prueba manual E2E)
- [x] **Puntos TASK_POINTS**: Visita registrada suma 10pts, Llamada suma 3pts (verificado en create-activity.use-case.ts:27)
- [x] **Calidad actividad**: Actividad con todos los campos = 100%, parcial = proporción correcta (verificado en create-activity.use-case.ts:50-57)
- [x] **Pipeline**: Crear deal → mover de stage → probability cambia → historial registrado (verificado en change-deal-stage.use-case.ts)
- [x] **Anti-duplicados clientes**: Crear cliente → crear otro con mismo email/tel → error 409 (verificado en create-client.use-case.ts:40-79)
- [x] **Dashboard semáforo**: Score de vendedor calculado y color correcto (verde/ámbar/rojo) (verificado en get-sellers-score.use-case.ts:77-82)
- [x] **Seguimientos vencidos**: Tarea con fecha pasada aparece como vencida en dashboard (verificado en task.dto.ts:30-35)
- [ ] **RBAC**: Seller no puede acceder a rutas de Admin/Director (403) (requiere prueba manual E2E)
- [x] **Settings**: Cambiar dailyMinPoints → Mi Día refleja nueva meta (✅ CORREGIDO 2026-06-09)
- [ ] **Reports**: Reporte mensual muestra ventas del mes actual (requiere prueba manual con datos)
- [x] Todos los checkpoints pendientes de features 05-14 marcados como pasados (37/52 verificados)
- [x] Bugs documentados en `progress/bugs.md` con pasos para reproducir

---

## 19-pipeline-forecast

- [x] `IDealsRepository` expone `getWeightedForecast(): Promise<number>` = `SUM(amount × probability/100)` excluyendo stage Perdido y soft-deleted
- [x] `GET /api/dashboard/summary` incluye campo `pipelineForecast` con el forecast ponderado global
- [x] Dashboard muestra tarjeta "Forecast del mes" con valor formateado y % vs `monthlyAmountGoal` de Settings
- [x] Header del Pipeline (Kanban) muestra "Total bruto" y "Forecast ponderado" derivados de los deals visibles (excluye Perdido)
- [x] No se crean tablas nuevas
- [x] `tsc --noEmit` sin errores en backend y frontend

---

## 20-stalled-deals

- [ ] `AppSettings` tiene `stalledAmberDays: number` (default 7) y `stalledRedDays: number` (default 14)
- [ ] `PATCH /api/settings` acepta y persiste ambos campos nuevos
- [ ] `IDealsRepository` expone `findStalledDeals(amberDays: number): Promise<{deal: DealEntity, daysStalled: number}[]>` — excluye Cierre/Perdido
- [ ] `GET /api/dashboard/stalled-deals` retorna `StalledDealDto[]` (solo Admin y Director)
- [ ] Dashboard muestra sección "Deals en riesgo" con clientName, stage, daysStalled, sellerName (solo Admin/Director)
- [ ] KanbanCard muestra badge ámbar cuando `daysStalled >= stalledAmberDays`
- [ ] KanbanCard muestra badge rojo cuando `daysStalled >= stalledRedDays`
- [ ] Settings page tiene campos para `stalledAmberDays` y `stalledRedDays`
- [ ] `tsc --noEmit` sin errores en backend y frontend

---

## 21-leaderboard

- [ ] `IActivityRepository` expone método para sumar puntos por seller agrupado por día sobre un rango (`sumPointsByDayForSellers(from, to)` o similar), una sola query, excluye soft-deleted
- [ ] `LeaderboardRowDto` con: `rank`, `sellerId`, `sellerName`, `monthlyPoints`, `previousMonthPoints`, `pointsDelta`, `streakDays`
- [ ] `GetLeaderboardUseCase` calcula: puntos del mes actual y anterior por seller, delta, racha de días consecutivos cumpliendo `dailyMinPoints` (desde Settings), ordena por `monthlyPoints` DESC y asigna `rank` (1..N)
- [ ] Incluye todos los sellers activos (los de 0 puntos aparecen al final)
- [ ] Racha: cuenta días consecutivos hacia atrás desde hoy con `puntos_del_día >= dailyMinPoints`; si hoy no cumple pero ayer sí, cuenta desde ayer
- [ ] `GET /api/dashboard/leaderboard` retorna `LeaderboardRowDto[]` (solo Admin y Director)
- [ ] Dashboard muestra sección "Leaderboard del mes" con rank, nombre, puntos, delta (+/-) y racha (solo Admin/Director)
- [ ] No se crean tablas nuevas
- [ ] `tsc --noEmit` sin errores en backend y frontend

---

## 22-overdue-tasks-badge

- [x] `TaskCard` muestra badge `tag tag-red` "Vencida" cuando `task.isOverdue && status === Pendiente` (Agenda)
- [x] `MiDiaPage` muestra badge `tag tag-red` "Vencida" junto al título en tareas vencidas y pendientes de la lista de hoy
- [x] Se conserva el coloreado rojo del título en Mi Día y el layout flex existente
- [x] Sin cambios de backend (`isOverdue` ya lo calcula `task.dto.ts`)
- [x] `tsc --noEmit` sin errores en frontend

---

## 23-cold-accounts

- [x] `AppSettings` tiene `coldAccountDays` (default 14); `PATCH /api/settings` lo persiste; editable en SettingsPage
- [x] `ClientDto` expone `lastActivityAt: string | null` e `isCold: boolean`
- [x] `GET /api/clients` retorna cada cliente con `lastActivityAt` e `isCold` (frío = `max(lastActivity, createdAt) < ahora - coldAccountDays`)
- [x] `GET /api/clients?cold=true` filtra solo cuentas frías vía `NOT EXISTS` en repo (paginación/total correctos)
- [x] ClientesPage: columna "última actividad", badge "Fría", toggle "Sin contacto"
- [x] `GET /api/dashboard/mi-dia/seller/:id` retorna `coldAccountsCount`; MiDiaPage muestra alerta cuando > 0
- [x] `tsc --noEmit` sin errores en backend y frontend

---

## 24-client-data-quality

- [x] `ClientDto` expone `dataQuality: number` (0-100); 5 campos × 20% (domain, person, source, contacto con phone, contacto con email)
- [x] `GET /api/clients?incomplete=true` filtra clientes con `dataQuality < 100` vía Brackets/NOT EXISTS (paginación/total correctos)
- [x] ClientesPage: badge "Datos X%" en detalle y cards (verde=100/rojo<60/ámbar), toggle "Datos incompletos"
- [x] `tsc --noEmit` sin errores en backend y frontend

---

## 25-winloss-analysis

**Backend — pipeline (lossReason):**
- [x] `StageHistoryEntry` (deal.entity.ts) extendida con `lossReason?: LossReason`; tipo `LossReason = 'precio'|'competencia'|'sin_respuesta'|'timing'|'otro'`
- [x] `ChangeStageDtoBody` acepta `lossReason?` opcional (`@IsOptional() @IsIn([...])`)
- [x] `ChangeDealStageUseCase` almacena `lossReason` en el history entry **solo** cuando `newStage === Perdido` (campo opcional, no obligatorio); lo ignora en otros stages
- [x] Sin tabla/columna nueva: `lossReason` vive dentro del JSONB `stage_history`

**Backend — reports (análisis):**
- [x] `IDealsRepository.findAllForAnalysis(): Promise<DealEntity[]>` retorna todos los deals no borrados con `stageHistory`
- [x] `WinLossReportDto` con: `totalDeals, won, lost, open, winRate, funnel[], lossesByOrigin[], lossReasons[]`
- [x] `GetWinLossUseCase` calcula in-memory: funnel (reached por stage canónico usando índice, conversión etapa→etapa), tiempo promedio por etapa (pares consecutivos de stageHistory), % perdidos por etapa de origen, breakdown de lossReason
- [x] `GET /api/reports/win-loss` retorna `WinLossReportDto` (solo Admin/Director)
- [x] `reports.module.ts` importa `PipelineModule` para inyectar `DEAL_REPOSITORY`

**Frontend:**
- [x] `pipeline.types.ts`: `LossReason`, `StageHistoryEntry.lossReason?`, `ChangeStageInput.lossReason?`
- [x] PipelinePage: al soltar deal en "Perdido" abre modal para elegir motivo antes de mutar; otros stages mutan directo
- [x] `reports.types.ts` + `reports.api.ts` (`getWinLoss`) + hook `useWinLoss`
- [x] ReportsPage: sección "Win/Loss y conversión por etapa" (funnel: stage, alcanzados, conversión %, días prom; perdidos por origen; motivos), solo Admin/Director
- [x] `tsc --noEmit` sin errores en backend y frontend

---

## 26-ai-coach-context

**Backend — coaching (mismo endpoint y proveedor, solo prompt enriquecido):**
- [x] `SuggestionRequestDto` acepta `clientId?` y `sellerId?` opcionales (`@IsOptional() @IsString()`); todos los campos previos siguen funcionando (retrocompatible)
- [x] `CoachingController.getSuggestion` toma `sellerId` del JWT (`req.user.sellerId`) como fallback cuando el body no lo trae
- [x] `GenerateSuggestionUseCase` inyecta repo de actividades (`ActivityTypeormEntity`), `DEAL_REPOSITORY` y `GetSettingsUseCase`
- [x] Si hay `clientId`: anexa al prompt las últimas 3 actividades del cliente (tipo, resultado, resumen truncado, fecha), ordenadas por `executedAt` DESC, excluye soft-deleted
- [x] Si hay `clientId` + `sellerId`: resuelve el deal vía `findByClientIdAndSellerId` y anexa "días en etapa actual" (desde el último `stageHistory.changedAt`, o `createdAt` si vacío)
- [x] Si los días en etapa ≥ `settings.stalledAmberDays`: el prompt menciona explícitamente que el deal está estancado
- [x] Si hay `sellerId`: anexa la calidad promedio del vendedor (AVG `quality`, últimos 30 días, excluye soft-deleted)
- [x] Toda la recolección de contexto es best-effort: si una consulta falla, la sugerencia se genera igual (no rompe el endpoint)
- [x] `coaching.module.ts` importa `PipelineModule` para inyectar `DEAL_REPOSITORY`
- [x] Sin tablas nuevas; sin cambios de frontend
- [x] `tsc --noEmit` sin errores en backend

---

## 27-task-time-overlap

**Backend — tasks (validación anti-solapamiento):**
- [ ] `ITaskRepository` expone `findConflictingTask(sellerId: string, scheduledAt: Date, excludeTaskId?: string): Promise<TaskEntity | null>` — busca tareas no completadas del mismo vendedor con `scheduledAt` idéntico (año, mes, día, hora, minuto)
- [ ] `CreateTaskUseCase` valida anti-solapamiento antes de crear: si hay conflicto, lanza `ConflictException` con mensaje `"Ya tienes una tarea programada para el ${fecha} a las ${hora}: ${tarea.title}"`
- [ ] `UpdateTaskUseCase` valida anti-solapamiento antes de actualizar (solo si `scheduledAt` cambió): excluye el `taskId` actual de la búsqueda de conflictos
- [ ] `POST /api/tasks` retorna 409 Conflict con mensaje descriptivo cuando hay solapamiento
- [ ] `PATCH /api/tasks/:id` retorna 409 Conflict con mensaje descriptivo cuando el nuevo horario solapa
- [ ] Sin tablas nuevas; sin columnas nuevas
- [ ] `tsc --noEmit` sin errores en backend

**Frontend — tasks (error handling):**
- [ ] `CreateTaskForm` captura error 409 de `createTask` y muestra mensaje de error amigable en el formulario (usando componente de error o toast)
- [ ] `EditTaskForm` (si existe) captura error 409 de `updateTask` y muestra mensaje de error amigable
- [ ] El mensaje de error incluye la información del conflicto (fecha, hora, título de la tarea existente)
- [ ] La UI permite al usuario corregir el horario y reintentar sin recargar la página
- [ ] `tsc --noEmit` sin errores en frontend

---

## 42-mi-dia-task-enrichment

- [x] Cada tarea en "Agenda de hoy y pendientes" (MiDiaPage) muestra el nombre del cliente (`task.clientId` resuelto vía `useClients`) cuando existe
- [x] Cada tarea muestra el nombre del contacto (`task.contactId` resuelto dentro de `client.contacts`) cuando existe
- [x] Cada tarea muestra el tipo de actividad (`task.type`) como badge, con el mismo color-mapping que `TaskCard.tsx` (TYPE_TAG)
- [x] Tareas sin cliente/contacto/type asignado no rompen el render (campos opcionales, sin mostrar "undefined"/"null")
- [x] No se agregan botones de Editar/Reactivar en Mi Día (fuera de alcance) — solo se añade texto/badges informativos, se conserva el botón "Completar" existente
- [x] `tsc --noEmit` sin errores en frontend

---

## 43-mi-dia-complete-task-validation

- [x] El botón "Completar" en MiDiaPage abre un `AlertDialog` de confirmación ("¿Completar esta tarea?", acción irreversible) antes de ejecutar la mutación, igual que `TaskCard.tsx`
- [x] Al confirmar y tener éxito: `toast.success` + navega a `/actividades/nueva` con `clientId` (si `completedTask.clientId` existe), `taskTitle` (si `task.title` existe) y `taskId`, igual que `AgendaPage.handleComplete`
- [x] Al fallar la mutación: `toast.error` con mensaje amigable, sin romper la pantalla ni perder el estado de la lista
- [x] El estado `disabled`/`aria-busy` durante la mutación (`isThisTaskPending`) se conserva
- [x] No se modifica el backend (`CompleteTaskUseCase` ya valida `ForbiddenException` si `sellerId` no coincide — sin cambios ahí)
- [x] `tsc --noEmit` sin errores en frontend

---

## 44-task-delete

**Backend — tasks (eliminar tarea):**
- [x] `DeleteTaskUseCase` valida que la tarea existe (`NotFoundException` si no) y que `task.sellerId === input.sellerId` (`ForbiddenException` si no, mismo criterio que `update`/`complete`/`reactivate`)
- [x] `DeleteTaskUseCase` llama `taskRepo.softDelete(taskId)` (ya implementado genéricamente en `TaskRepositoryImpl`, sin cambios ahí)
- [x] `DELETE /api/tasks/:id` (roles Admin/Director/Seller, mismo patrón que los demás endpoints) recibe `sellerId` en el body y delega al use-case
- [x] `tasks.module.ts` registra `DeleteTaskUseCase` como provider
- [x] Sin tablas/columnas nuevas
- [x] `tsc --noEmit` sin errores en backend

**Frontend — tasks (botón Eliminar en TaskCard):**
- [x] `tasksApi.deleteTask(taskId, sellerId)` en `tasks.api.ts` (DELETE con body `{sellerId}`, mismo estilo que `reactivateTask`)
- [x] `useDeleteTask` hook (mismo patrón que `useReactivateTask`: invalida `['tasks']` en `onSuccess`)
- [x] `TaskCard.tsx` agrega botón "Eliminar" junto a Editar/Completar/Reactivar, con `AlertDialog` de confirmación (acción irreversible) — no usa `confirm()`/`alert()` del browser
- [x] `AgendaPage.handleDelete` llama la mutación con `toast.success`/`toast.error`
- [x] No rompe las acciones existentes (Editar, Completar, Reactivar) ni el layout de `TaskCard`
- [x] `tsc --noEmit` sin errores en frontend


---

## 45-authz-tasks-activities

**Backend — tasks (ownership por JWT):**
- [x] `PATCH /api/tasks/:id/complete`, `PATCH /api/tasks/:id`, `PATCH /api/tasks/:id/reactivate` y `DELETE /api/tasks/:id` derivan la identidad del caller de `req.user` (JWT) — el `sellerId` del body se ignora/elimina
- [x] Use-cases (complete/update/reactivate/delete) reciben `callerRole` + `callerSellerId`: si `callerRole === Seller` y `task.sellerId !== callerSellerId` lanzan `ForbiddenException`; Admin/Director operan cualquier tarea
- [x] `POST /api/tasks`: si `req.user.role === Seller`, el controller fuerza `dto.sellerId = req.user.sellerId` (403 si el JWT no trae sellerId); Admin/Director pueden especificar sellerId
- [x] En `UpdateTaskUseCase` el conflicto de horario se valida contra `task.sellerId` (dueño de la tarea), no contra el caller
- [x] `tsc --noEmit` sin errores en backend

**Backend — activities:**
- [x] `POST /api/activities`: si `req.user.role === Seller`, el controller fuerza `dto.sellerId = req.user.sellerId` (403 si el JWT no trae sellerId)
- [x] `PATCH /api/activities/:id/status`: si `req.user.role === Seller` y la actividad no le pertenece, responde 403 (mismo patrón inline que `getDailyPoints`)
- [x] Los GET de lectura (`/activities/:id`, `/activities/client/:clientId`) NO cambian (historial de cliente compartido, decisión documentada)
- [x] `tsc --noEmit` sin errores en backend

**Frontend — tasks:**
- [x] `tasks.api.ts`: `completeTask`, `updateTask`, `reactivateTask`, `deleteTask` ya no envían `sellerId` (firmas sin ese parámetro); `createTask` lo conserva
- [x] Hooks `useCompleteTask`, `useUpdateTask`, `useReactivateTask`, `useDeleteTask` dejan de resolver `currentUser?.sellerId ?? currentUser?.id`; su firma externa hacia las páginas no cambia
- [x] Admin/Director pueden completar/editar/reactivar/eliminar tareas de cualquier vendedor sin recibir 403
- [x] `tsc --noEmit` sin errores en frontend


---

## 46-schema-migrations-reconcile

- [x] `backend/src/data-source.ts` (ya existia, sin scripts) queda cableado con `backend/package.json`: `typeorm`, `migration:generate`, `migration:run`, `migration:revert`
- [x] `app.module.ts` lee `TYPEORM_MIGRATIONS_RUN` del env en vez de hardcodear `migrationsRun: false`
- [x] Migracion baseline `1749000000000-BaselineSchemaReconcile.ts` (timestamp mas antiguo, corre primero) generada con `migration:generate` contra una DB vacia real — captura el schema completo de las 10 entidades + audit_logs (11 tablas), incluyendo columnas que solo existian via `TYPEORM_SYNCHRONIZE=true` sin migracion propia (`activities.task_id`, `activities.contact_id`, `tasks.type`, `tasks.contact_id`)
- [x] Todos los statements de la baseline son idempotentes: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;` para `CREATE TYPE` y `ADD CONSTRAINT` (FKs) — segura de correr sin importar el estado real de prod (sin acceso para verificarlo)
- [x] Las 4 migraciones legacy (`AddStageToActivities`, `AddStatusAndActivityHistoryToActivities`, `AddOpportunityNameToDeals`, `AlterTaskTitleToText`) retrofitteadas a idempotentes (`IF NOT EXISTS` / `IF EXISTS`) para no fallar corriendo despues de la baseline
- [x] Verificado end-to-end: volumen docker postgres recreado vacio (autorizado por el usuario, datos de prueba) → `migration:run` aplica las 5 migraciones sin error → segundo `migration:run` reporta "No migrations are pending" (idempotencia confirmada) → schema resultante (`\dt`, `\d activities`, `\d tasks`, `\d deals`) identico al original pre-recreate (11 tablas, mismas columnas/indexes/FKs; bonus: `created_at`/`updated_at`/`deleted_at` ahora `timestamptz` correctamente, corrige drift previo de `timestamp without time zone`)
- [x] Backend arranca limpio con `TYPEORM_MIGRATIONS_RUN=true` + `TYPEORM_SYNCHRONIZE=false` (modo prod-like) contra la DB migrada — `docker logs` sin errores, `Nest application successfully started`. Reviewer detectó que `docker compose restart` no relee `env_file:` (contenedor seguía con el valor viejo horneado); corregido con `up -d --force-recreate backend` y documentado el gotcha en `docs/verification.md`
- [x] Smoke E2E: login `POST /api/auth/login` con admin auto-seedeado devuelve JWT valido
- [x] `docs/verification.md` documenta el flujo de migraciones y la regla de "toda entidad nueva requiere su migracion idempotente"
- [x] `docs/conventions.md` corrige el path real de migraciones (`backend/src/migrations/`, no `backend/src/database/migrations/`)
- [x] `tsc --noEmit` sin errores en backend

**Fuera de alcance / limitaciones conocidas**:
- Sin acceso directo a la DB de prod real — no se pudo verificar su estado de antemano. Mitigado con idempotencia total; recomendado hacer backup de prod antes del primer deploy con `TYPEORM_MIGRATIONS_RUN=true`.
- `progress/seed_test_users.sql` quedo en evidencia como desactualizado (usa columna `password` en vez de `password_hash` — la mayoria de sus INSERTs fallan silenciosamente). No es parte de esta feature, pendiente de fix aparte si se sigue usando para QA manual.


---

## 47-hardening-menor

**Backend — B6 (defensivo, update() sin 500 en id inexistente):**
- [x] `TaskRepositoryImpl.update()` lanza `NotFoundException` si `findOne` no encuentra el id, en vez de `Object.assign(existing!, ...)`
- [x] `ActivityRepositoryImpl.update()` mismo fix
- [x] Ningun use-case actual cambia de comportamiento (los 3 callers de `taskRepo.update()` ya validan con `findById` antes) — confirmado con `git diff` vacio en complete-task/update-task/reactivate-task use-cases
- [x] `tsc --noEmit` sin errores en backend

**Backend — B7 (TaskDto enriquecido con clientName/contactName):**
- [x] `TaskEntity` (domain) gana `clientName?: string | null` y `contactName?: string | null` (mismo patron que `ActivityEntity`)
- [x] `TaskDto` gana `clientName: string | null` y `contactName: string | null`, poblados en `fromEntity`
- [x] `TaskRepositoryImpl.findTodayBySeller` y `findMonthAllSellers` usan `leftJoin` a `clients`/`contacts` + `getRawAndEntities` para traer `clientName`/`contactName` en la misma query (mismo patron que `ActivityRepositoryImpl.findDailyBySeller`), sin N+1. Cast `::text` necesario porque `tasks.client_id`/`contact_id` son `varchar` (no `uuid` como en activities) — verificado contra `task.typeorm.entity.ts`
- [x] `tsc --noEmit` sin errores en backend

**Frontend — B7 (dejar de resolver client-side con lista de 200):**
- [x] `Task` (tasks.types.ts) gana `clientName?: string | null` y `contactName?: string | null`
- [x] `AgendaPage.tsx` vista lista: `TaskCard` recibe `clientName={task.clientName}` / `contactName={task.contactName}` directo del task, sin `clients.find(...)`
- [x] `AgendaPage.tsx` ya no llama `useClients({ limit: 200 })` — sin otro consumidor de esa lista en el archivo
- [x] `CalendarView.tsx`: los 3 bloques que hacian `clients.find(...)` usan `task.clientName` directo; prop `clients: Client[]` retirado de las 8 interfaces anidadas (MonthView, MonthDayCell, WeekView, WeekDayColumn, DayView, DayHourRow, TaskChip)
- [x] `MiDiaPage.tsx`: usa `task.clientName`/`task.contactName` directo, ya no hace `clients.find(...)` ni llama `useClients({ limit: 200 })`
- [x] `CreateTaskForm.tsx` NO se toco — confirmado `git diff` vacio, sigue con su propio `useClients({ limit: 200 })` para el dropdown
- [x] `TaskCard.tsx` sin cambios de firma — confirmado `git diff` vacio
- [x] `tsc --noEmit` sin errores en frontend

**Reviewer**: 16/16 criterios PASSED (progress/impl_47-hardening-menor.md). Verifico cast `::text`, ausencia de N+1, cadena completa de props retirados en CalendarView, y que MiDiaPage no perdio ningun campo del objeto Client/Contact mas alla del nombre. Hallazgo de proceso (no de codigo): el Implementer genero un `backend/CHECKPOINTS.md` suelto por error de cwd — eliminado, contenido consolidado aqui.


---

## 48-client-picker-combobox

**Setup (una sola vez, consultar con el usuario antes de instalar dependencia):**
- [x] `cmdk` agregado como dependencia npm en `frontend/package.json` (requiere aprobacion explicita antes de instalar — regla AGENTS.md)
- [x] `frontend/src/components/ui/command.tsx` y `frontend/src/components/ui/popover.tsx` (shadcn) generados/agregados

**Componente reutilizable:**
- [x] Combobox buscable (Popover + Command) que recibe `value`/`onChange` de un `clientId` y hace debounce (~300ms) sobre el input de busqueda antes de consultar `GET /api/clients?q=...`
- [x] Usa `useClients({ q, limit: <chico, ej 20> })` (el hook y el backend ya soportan `q`/`page`/`limit` via `ClientFilters`/`GetClientsQueryDto` — sin cambios backend)
- [x] Muestra loading state mientras busca, empty state si no hay resultados, y el cliente ya seleccionado visible aunque no este en los resultados de la busqueda actual (fetch individual por id si hace falta, o mantener el nombre ya conocido en estado local)
- [x] Accesible por teclado (navegacion con flechas + enter, propio de shadcn Command)

**Migracion de los 4 call sites (cada uno reemplaza `useClients({limit:N})` + su `.map()`/`<select>` o lista local por el combobox):**
- [x] `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- [x] `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`
- [x] `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- [x] `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- [x] Ningun formulario pierde funcionalidad existente (validacion, valor inicial al editar, limpiar seleccion si aplica)
- [x] `tsc --noEmit` sin errores en frontend

**Reviewer**: Review 1 FAILED — `selectedClient` arrancaba en `null` en `EditTaskForm`/`ActivityForm`, selector de Contacto deshabilitado/vacio al montar con cliente ya asignado. Fix-pass agrego prop `onResolve` a `ClientCombobox` (resuelve el `Client` completo por nombre via query puntual, una sola vez) + threading de `clientName` desde `AgendaPage`/`MiDiaPage`/`ClientDetailPage` hasta `ActivityForm`. Review 2 PASSED — 16/16 hallazgos verificados linea por linea, `tsc`/`eslint` limpios, sin cambios en backend/tests. Caveat aceptado: si el nombre conocido no matchea ningun resultado de busqueda (cliente renombrado/borrado), el selector de Contacto queda deshabilitado hasta reseleccion manual — no resoluble 100% sin `GET /clients/:id` en backend (fuera de alcance).

---

## 67-pipeline-backward-stage

**Backend — pipeline (regla central):**
- [ ] `ALLOWED_TRANSITIONS` (`backend/src/modules/pipeline/domain/entities/deal.entity.ts`) permite, además de lo ya existente, retroceder exactamente una etapa dentro del tramo activo: `Contactado → Prospecto`, `Interesado → Contactado`, `Propuesta → Interesado`, `Negociacion → Propuesta`
- [ ] `Cierre` y `Perdido` siguen sin transiciones de salida (`[]`) — no reabribles
- [ ] `Prospecto` no gana transición de retroceso (es la primera etapa)
- [ ] `PATCH /deals/:id/stage` acepta el retroceso de una etapa y lo persiste en `stageHistory` (mismo mecanismo que hoy, sin cambios en `change-deal-stage.use-case.ts` más allá de heredar el mapa actualizado)
- [ ] Un intento de retroceder más de una etapa (ej. `Negociacion → Prospecto`) sigue devolviendo 400

**Backend — clients (cierre de bypass, mismo alcance):**
- [ ] `UpdateClientUseCase` (`backend/src/modules/clients/application/use-cases/update-client.use-case.ts`) valida `ALLOWED_TRANSITIONS` cuando `dto.stage` viene presente y difiere del `stage` actual del cliente; lanza `BadRequestException` igual que `change-deal-stage.use-case.ts` si la transición no está permitida
- [ ] Si `dto.stage` no viene en el patch, o es igual al actual, no se agrega validación ni efectos secundarios nuevos
- [ ] `tsc --noEmit` sin errores en backend

**Frontend:**
- [ ] `ALLOWED_TRANSITIONS` en `frontend/src/modules/pipeline/domain/pipeline.types.ts` queda idéntico al mapa del backend (mismo comentario "Mirrors ALLOWED_TRANSITIONS in backend deal.entity.ts")
- [ ] `ClientesPage.tsx` — botones "Actualizar stage" habilitan el retroceso de una etapa cuando hay `activeDeal` (se deriva automáticamente del mirror, sin lógica nueva)
- [ ] Kanban (`KanbanColumn.tsx` / `DealCard.tsx`) sigue sin bloquear el drag hacia atrás antes del request (comportamiento ya existente, fuera de alcance); el toast de error/success ya cubre el caso de transición inválida (>1 etapa)
- [ ] `tsc --noEmit` sin errores en frontend

**Fuera de alcance (documentar si se toca):**
- No se agrega bloqueo de drag-and-drop preventivo en el Kanban (mejora de UX, no pedida)
- No se reabren `Cierre`/`Perdido`
- No se toca `create-activity.use-case.ts` (syncPipelineForDeal) — hereda el mapa sin cambios de código

---

## 63-refresh-tokens

**Backend — modelo y migración:**
- [x] Tabla nueva `refresh_tokens` (migración idempotente `CREATE TABLE IF NOT EXISTS`, FK a `users(id)` con `ADD CONSTRAINT` envuelto en `DO $$ ... EXCEPTION WHEN duplicate_object THEN null; END $$;`, índice en `user_id`): columnas `id` (uuid PK), `user_id` (uuid, FK), `token_hash` (varchar), `expires_at` (timestamptz), `revoked_at` (timestamptz nullable), `created_at`/`updated_at` (timestamptz, patrón estándar del repo). Sin `deleted_at` — el ciclo de vida es revocación, no soft-delete.
- [x] Migración generada/ajustada siguiendo el flujo de `docs/verification.md` (`pnpm migration:generate`), nombre `<timestamp>-CreateRefreshTokens.ts`, wireada en `data-source.ts` igual que las existentes
- [x] `RefreshTokenEntity` (domain, sin TypeORM) + `IRefreshTokenRepository` + `RefreshTokenTypeormEntity`/impl siguiendo la estructura de capas del módulo `auth` existente (domain/application/infrastructure/presentation)

**Backend — emisión y rotación:**
- [x] `JWT_EXPIRES_IN` default baja de `7d` a `15m` (`.env.example`, `backend/.env.example`, `.env.prod.example` documentados)
- [x] Nuevas env vars `JWT_REFRESH_SECRET` y `JWT_REFRESH_EXPIRES_IN` (default `7d`) documentadas en los 3 `.env.example`
- [x] `LoginUseCase` emite además un refresh token: crea la fila en `refresh_tokens` (`token_hash` = `bcrypt.hash(rawToken, 10)`, mismo salt rounds que passwords), firma un JWT `{ sub: <id de la fila>, userId: user.id }` con `JWT_REFRESH_SECRET`/`JWT_REFRESH_EXPIRES_IN` usando el mismo `JwtService` inyectado (override de `secret`/`expiresIn` por llamada — no se registra un segundo `JwtModule`). `LoginResponseDto` incluye `refreshToken`
- [x] `POST /api/auth/refresh` (sin guard, igual que `/login` — no hay guard global en este backend): valida firma/expiración del refresh JWT recibido, busca la fila por `sub` (PK), rechaza si `revoked_at` no es null o si `expires_at` ya pasó, compara `bcrypt.compare(rawToken, row.tokenHash)`. Si es válido: **rota** (marca la fila vieja `revoked_at = now()`, crea una fila nueva + emite refresh JWT nuevo) y emite un access token nuevo. Responde `{ accessToken, refreshToken }`
- [x] **Detección de reuso**: si el refresh recibido corresponde a una fila ya con `revoked_at` distinto de null, se interpreta como posible robo — se revocan TODOS los refresh tokens activos de ese `user_id` (no solo el usado) y se responde 401
- [x] `POST /api/auth/logout` (sin guard): recibe el refresh token de la sesión actual y marca su fila `revoked_at = now()`. No revoca otras sesiones/dispositivos del mismo usuario
- [x] Ningún endpoint nuevo devuelve el `token_hash` ni el refresh token de otro usuario; el lookup es siempre por PK derivado del propio JWT, nunca por `user_id` abierto

**Backend — tests:**
- [x] `login.use-case.spec.ts` actualizado para el nuevo payload/response (refresh token emitido)
- [x] Specs nuevos para el use-case de refresh (rotación exitosa, token revocado → 401 + revocación en cascada, token expirado → 401, token con firma inválida → 401) y para logout (revoca la fila correcta, no afecta otras), mockeando solo el repositorio (convención del repo)
- [x] `tsc --noEmit` sin errores en backend

**Frontend:**
- [x] `auth.types.ts`: `LoginResponse` incluye `refreshToken`; tipos para request/response de refresh
- [x] `auth.api.ts`: `refresh(refreshToken)` y `logout(refreshToken)`
- [x] `app.store.ts`: nuevo estado `refreshToken`, persistido en `localStorage` bajo su propia key (mismo patrón manual que `accessToken` hoy), limpiado en `clearAuth()`
- [x] `axios.ts`: interceptor de response reescrito — en 401 (excluyendo `/auth/login` Y `/auth/refresh` del auto-retry) intenta `POST /auth/refresh` una sola vez con cola de requests pendientes (flag `isRefreshing` + callbacks) para no disparar refreshes concurrentes; si el refresh falla, limpia auth y redirige a `/login` (comportamiento actual conservado como fallback)
- [x] `nav-user.tsx` `handleLogout` pasa a ser async: llama `authApi.logout(refreshToken)` (try/catch, no bloquea el logout local si falla la red) antes de `clearAuth()` + navigate
- [x] Nuevo hook `useLogout` en `modules/auth/application/hooks/` centralizando la llamada (patrón TanStack Query del resto del proyecto)
- [x] `tsc --noEmit` sin errores en frontend

**Verificación manual (no automatizable por tsc/jest):**
- [ ] Login → esperar a que expire el access token (o bajar `JWT_EXPIRES_IN` temporalmente) → una request protegida dispara refresh automático sin desloguear al usuario
- [ ] Logout → el refresh token usado ya no puede canjearse (401)
- [ ] `/lamina` (auth propio, feature 40) no se rompe con el cambio de TTL

---

## 68-pipeline-client-coverage

**Diagnóstico y regla de negocio:**
- [x] Ejecutar una auditoría read-only para el seller reportado: contar clientes no eliminados asignados, `clientId` distintos en deals no eliminados y clientes con actividades no eliminadas; listar exactamente cuáles faltan en pipeline y por qué
- [x] Confirmar y documentar la causa raíz antes de implementar; no atribuir el faltante a un límite de 20 porque `findDetailedBySellerId` actualmente no usa `limit`, `take` ni paginación
- [x] Documentar una definición única de "cliente iniciado" basada en datos persistidos y aplicarla igual en creación, sincronización, backfill y consultas
- [x] La comparación de cobertura usa `clientId` distintos, no el total de deals, porque un cliente puede tener más de una oportunidad

**Backend e integridad de datos:**
- [x] Todo cliente no eliminado asignado al seller que cumpla la regla de "iniciado" tiene al menos un deal no eliminado visible para ese mismo seller
- [x] Se corrige la ruta exacta que deja clientes iniciados sin deal (creación de cliente, registro de actividad o sincronización de etapa, según revele el diagnóstico)
- [x] La creación/sincronización es idempotente: reintentar la operación no crea oportunidades duplicadas
- [x] Existe un backfill/migración idempotente para clientes históricos iniciados sin deal; conserva seller, clientId, etapa e importe esperados y no revive deals eliminados sin una regla explícita
- [x] `GET /api/pipeline/seller/:id` devuelve todos los deals no eliminados del seller sin truncamiento implícito
- [x] `GET /api/pipeline/team` mantiene la misma cobertura para Admin/Director y no pierde clientes al agrupar sellers
- [x] El scoping es estricto: ningún cliente o deal de otro seller aparece en el pipeline consultado

**Frontend y regresión:**
- [x] `PipelinePage` y `KanbanBoard` renderizan todas las tarjetas recibidas, sin `slice`, top-N, límites por columna ni paginación incompleta
- [x] Caso automatizado: seller con 49 clientes iniciados y una oportunidad por cliente obtiene 49 `clientId` distintos en el pipeline
- [x] Caso automatizado: más de 20 clientes en una misma etapa se devuelven y renderizan completos
- [x] Caso automatizado: clientes no iniciados quedan fuera si así lo establece la regla documentada; clientes iniciados no desaparecen por tener varias actividades
- [x] `tsc --noEmit` sin errores en backend y frontend; tests relevantes en verde
- [x] Guardar resumen en `progress/impl_68-pipeline-client-coverage.md` y review independiente con baseline real 19/49 y resultado esperado determinista del backfill

**Seguimiento operativo no bloqueante:**
- [ ] Tras desplegar y ejecutar la migración en producción, confirmar `COUNT(DISTINCT client_id)` 19 → 49 para Fernanda

---

## 69-pipeline-free-stage

**Regla de negocio:**
- [x] `ALLOWED_TRANSITIONS` del backend permite, para cada una de las 7 fases, las otras 6 fases y no incluye la fase actual
- [x] `Cierre` y `Perdido` permiten transiciones de salida, por lo que una oportunidad puede reabrirse
- [x] `PATCH /api/deals/:id/stage` conserva `stageHistory`, `changedBy`, probabilidad automática y `lossReason` opcional solo cuando el destino es `Perdido`
- [x] `UpdateClientUseCase` hereda la misma regla libre mediante el mapa compartido del backend

**Frontend:**
- [x] `ALLOWED_TRANSITIONS` en `frontend/src/modules/pipeline/domain/pipeline.types.ts` es idéntico al mapa del backend
- [x] Kanban permite arrastrar una oportunidad desde cualquier fase hacia cualquier otra, incluyendo salir de `Cierre` y `Perdido`
- [x] Clientes habilita cualquier fase distinta de la actual cuando existe un deal activo
- [x] Entrar en `Perdido` mantiene el diálogo shadcn de motivo opcional; salir de `Perdido` no lo muestra

**Verificación:**
- [x] Tests automatizados cubren salto libre, reapertura desde `Cierre` y `Perdido`, y rechazo/no-op de la misma fase según el comportamiento existente
- [x] `tsc --noEmit` pasa en backend y frontend
- [x] Resumen guardado en `progress/impl_69-pipeline-free-stage.md`

---

## 70-pipeline-activity-updated-at

**Backend:**
- [x] Registrar una actividad con `clientId` y deal existente actualiza `deals.updated_at` aunque la fase no cambie
- [x] La actividad y el touch de `deals.updated_at` ocurren en una misma transacción; si falla cualquiera, no queda persistencia parcial
- [x] El touch afecta solo el deal resuelto para el cliente, seller y `opportunityName` aplicables
- [x] La fecha `created_at`, la fase, probabilidad y `stage_history` del deal no cambian por el touch
- [x] Registrar actividad sin `clientId` conserva el flujo actual y no intenta tocar un deal
- [x] Crear la primera actividad de un cliente sin deal conserva la creación transaccional del deal y deja `created_at`/`updated_at` iniciales válidos

**Frontend:**
- [x] El tipo `Deal` incluye `updatedAt`, ya expuesto por `DealDto`
- [x] `DealCard` muestra únicamente la fecha de `updatedAt`, sin label, y usa `createdAt` solo como fallback compatible
- [x] El badge de días se calcula desde `updatedAt`, con fallback a `createdAt`, para reiniciarse cuando se agrega una actividad

**Verificación:**
- [x] Tests automatizados cubren actividad con deal existente, ausencia de `clientId`, selección por oportunidad y rollback/error transaccional relevante
- [x] `tsc --noEmit` pasa en backend y frontend; tests relevantes pasan
- [x] Resumen guardado en `progress/impl_70-pipeline-activity-updated-at.md`

---

## 71-stalled-deals-pagination

**Backend:**
- [x] `GET /api/dashboard/stalled-deals` acepta query params `page` y `limit`, validados como enteros positivos, con defaults `page=1` y `limit=10` y un límite máximo seguro
- [x] La respuesta usa el contrato `{ data: StalledDealDto[], total, page, limit, totalPages }`; una página fuera de rango devuelve `data: []` y metadatos consistentes
- [x] La consulta pagina en PostgreSQL mediante `skip/take` o `OFFSET/LIMIT`; no obtiene todos los deals para recortar el arreglo en memoria
- [x] `total` cuenta exactamente los deals que cumplen el umbral `stalledAmberDays` y excluye `Cierre`, `Perdido` y registros eliminados
- [x] El orden es determinista: `daysStalled` descendente y `deal.id` como desempate
- [x] Se conserva el acceso exclusivo para Admin/Director y la severidad ámbar/roja calculada con Settings

**Frontend:**
- [x] La sección existente conserva la tabla shadcn y muestra únicamente las filas de la página actual
- [x] Incluye controles accesibles para Anterior/Siguiente, indicador de página actual/total y estado deshabilitado en primera/última página
- [x] Cambiar de página actualiza la query key de TanStack Query y solicita al backend la página correspondiente, sin recargar todo el Dashboard
- [x] Los estados loading, error y vacío siguen funcionando; al cambiar de página no se muestra información de una página anterior como si fuera la actual
- [x] Si cambia el total y la página actual deja de existir, la UI vuelve a la última página válida o a la primera de forma consistente

**Verificación:**
- [x] Tests backend cubren defaults, segunda página, total correcto, orden estable y página fuera de rango
- [x] Test frontend o verificación equivalente cubre navegación y estados deshabilitados de los controles
- [x] `tsc --noEmit` pasa en backend y frontend; tests relevantes pasan
- [x] Resumen guardado en `progress/impl_71-stalled-deals-pagination.md`

---

## 60-shadcn-card-accordion

**Estado previo (trabajo sin commitear encontrado al iniciar la feature):** `ClientDetailPage.tsx`, `ActivityHistoryModal.tsx`, `ReportsPage.tsx` y `SettingsPage.tsx` ya tenian Card/Accordion aplicados de una sesion anterior no cerrada formalmente. `ClientesPage.tsx` tenia migracion parcial con un bug de tag JSX sin cerrar bien.

- [x] `ClientesPage.tsx:359` — el bloque "Contactos" del sidebar oscuro (345-358) cierra con tag balanceado (`</div>`, no `</Card>` huerfano); sidebar se mantiene como `<div>` custom (tema oscuro, no Card claro) — no se abre `<Card>` a la fuerza
- [x] `ClientDetailPage.tsx`: bloque info cliente usa `Card` + `Accordion` (contacts/pain/provider); bloque timeline usa `Card`; ninguno anidado dentro de otro Card (ambos son hermanos dentro del `Sheet` de `PipelinePage`)
- [x] `ActivityHistoryModal.tsx`: bloque "Estado actual" usa `Card`; bloque historial usa `Accordion` de una sola seccion; ambos hermanos dentro del `Dialog`, sin Card anidado
- [x] `ReportsPage.tsx`: filtros y "Detalle Top Vendedores"/"Resumen para Direccion" usan `Card`/`Accordion`; `ExecutiveSlide.tsx` NO se toca (permanece 100% inline-style, requerido para el export via `window.open`+`outerHTML`)
- [x] `SettingsPage.tsx`: grupos de metas (daily/monthly/risk) en `Accordion` dentro de `Card` — sin cambios, ya conforme
- [x] `ClientesPage.tsx` lineas 768-853 (contactos editables del formulario create/edit): se deja SIN Accordion — decision de criterio: es edicion activa de datos, no bloque de solo-lectura denso; colapsar añadiria friccion al capturar 2+ contactos
- [x] No se crean Cards anidadas dentro de otras Cards en ningun archivo tocado
- [x] `npx tsc --noEmit` sin errores en frontend
- [x] `progress/impl_60-shadcn-card-accordion.md` documenta que se hizo, que ya estaba hecho, y la decision de no tocar el bloque de contactos editable ni ExecutiveSlide.tsx

**Reviewer**: PASSED 10/10. Nota: sin commits entre features previas, no se pudo aislar via `git diff` que el fix fuera exactamente 1 linea — verificado por lectura directa (balance de tags) + timestamps de archivo consistentes con que solo `ClientesPage.tsx` cambio en este pase. Sin Cards/Accordion huerfanos en ningun modulo (chequeo extra en 51-60).

---

## 61-ci-pipeline

**Workflow:**
- [x] Existe `.github/workflows/ci.yml` y se ejecuta en cada `pull_request` y en cada `push` a `main`
- [x] Usa Node.js 22 y cache npm con los lockfiles separados de backend y frontend
- [x] Aplica permisos minimos de solo lectura y cancela ejecuciones anteriores de la misma rama/PR mediante `concurrency`

**Backend:**
- [x] Job independiente ejecuta `npm ci` desde `backend/`
- [x] Ejecuta TypeScript con `npx tsc --noEmit`
- [x] Ejecuta ESLint en modo read-only, sin `--fix`
- [x] Ejecuta Jest unitario sin incluir E2E y finaliza de forma determinista en CI

**Frontend:**
- [x] Job independiente ejecuta `npm ci` desde `frontend/`
- [x] Ejecuta TypeScript con `npm run typecheck`
- [x] Ejecuta ESLint con `npm run lint`
- [x] Ejecuta build de producción con `npm run build`

**Documentación y verificación:**
- [x] `docs/verification.md` documenta el pipeline y aclara que bloquear merges exige configurar branch protection/ruleset con ambos jobs como required checks
- [x] Los mismos comandos del workflow pasan localmente en backend y frontend
- [x] No se agregan dependencias ni se ejecutan tests E2E en esta feature
- [x] Resumen guardado en `progress/impl_61-ci-pipeline.md`

**Reviewer 2026-07-13**: FAILED 14/15. Workflow y documentacion correctos. Bloqueante: backend lint (632 errores), frontend lint (76 errores) y frontend build local (binding nativo Tailwind + `spawn EPERM`) no terminan en cero; `npm ci` tampoco pudo verificarse localmente por restricciones de cache/red. Ver `progress/review_61-ci-pipeline.md`.

**Re-review final 2026-07-13**: PASSED 15/15. Deuda eliminada sin desactivar reglas: backend y frontend lint 0 errores/0 warnings; ambos `npm ci` PASS; TypeScript PASS; backend Jest 7 suites/35 tests PASS; builds PASS. El P2 detectado en el primer review semantico (`useApiFormErrors` no enfocaba el primer campo invalido) fue corregido y re-revisado PASSED. Ver `progress/review_61-ci-pipeline.md`.

---

## 62-critical-use-case-tests

**Cobertura crítica:**
- [x] Score y semáforo cubren límites rojo/ámbar/verde, clamp 0/100, ausencia de actividad y penalización por vencidos
- [x] Pipeline conserva pruebas de transiciones permitidas, rechazo de misma fase, reapertura desde terminales, probabilidad, historial y sincronización del cliente
- [x] Actividades conservan pruebas de `TASK_POINTS`, calidad 0/40/100 y validación de siguiente paso
- [x] Tareas cubren creación sin conflicto, rechazo por solapamiento y exclusión de la propia tarea al reprogramar
- [x] Autorización de tareas cubre rechazo por ownership para Seller y bypass válido para Admin/Director
- [x] Clientes cubren resolución de seller por rol y anti-duplicados por empresa/dominio, teléfono/email y duplicados normalizados dentro del payload

**Aislamiento y verificación:**
- [x] Los tests de use-case usan mocks de repositorios/puertos y no requieren DB, red ni servicios externos
- [x] No se modifican archivos de producción ni se agregan dependencias
- [x] `npx jest --runInBand` pasa de forma determinista
- [x] `npx tsc --noEmit` pasa en backend
- [x] `npx eslint "{src,apps,libs,test}/**/*.ts"` pasa sin errores ni warnings de ESLint
- [x] Resumen guardado en `progress/impl_62-critical-use-case-tests.md`
- [x] Review independiente guardado en `progress/review_62-critical-use-case-tests.md`

**Reviewer 2026-07-13**: PASSED 12/12. Suite completa: 11 suites, 60 tests, 0 snapshots; `npx tsc --noEmit` exit 0. Sin cambios productivos, dependencias, DB, red ni servicios externos.

**Revalidación lint 2026-07-13**: PASSED. Corregidos 21 errores en los tres specs afectados sin desactivar reglas. ESLint exit 0, Jest 11/11 suites y 60/60 tests, TypeScript exit 0. Review independiente confirmó que se preservaron las aserciones y no hubo cambios de producción, configuración o dependencias.

---

## 65-prod-db-backups

**Automatización y seguridad:**
- [x] Existe un script versionado que ejecuta `pg_dump` en formato custom contra el contenedor PostgreSQL 18 de producción, escribe primero a un archivo temporal, rechaza dumps vacíos y valida el catálogo con `pg_restore --list` antes de publicar el archivo
- [x] Cada backup publicado tiene checksum SHA-256, permisos `0600` y nombre con timestamp UTC; el checksum se publica antes que el dump, nunca se sobrescribe un nombre existente y el directorio se crea con permisos `0700`
- [x] La configuración operativa (contenedor, overrides de DB/usuario, directorio, retención y espacio mínimo) vive en un archivo de entorno sin secretos versionados; DB y usuario se autodetectan del contenedor si no hay override
- [x] La ejecución usa lock no bloqueante, falla si el contenedor no está activo o queda poco espacio y deja resultado consultable en `journalctl`/estado de systemd
- [x] La retención elimina únicamente `*.dump` y su checksum del directorio dedicado después de 30 días
- [x] Un timer systemd ejecuta diariamente a las 03:15 UTC, con `Persistent=true` para recuperar una corrida perdida y demora aleatoria de hasta 15 minutos

**Restauración y operación:**
- [x] `docs/verification.md` documenta instalación, ejecución manual, estado del timer, logs, validación de checksums, restauración y rollback operativo
- [x] Existe un script de prueba que restaura un dump en un contenedor PostgreSQL 18 efímero, aislado con `--network none`, valida tablas públicas y `public.users`, y elimina el contenedor al terminar
- [ ] La automatización está instalada y habilitada en el VPS de producción
- [ ] Una ejecución real generó un dump válido y `restore-test.sh` lo restauró exitosamente contra PostgreSQL temporal; la evidencia (fecha UTC, archivo, tamaño, checksum abreviado, conteo de tablas y próxima corrida) está en `progress/impl_65-prod-db-backups.md`
- [ ] Se confirmó una segunda corrida programada o manual sin sobrescritura y con estado `systemctl is-failed` limpio

---

## 72-visual-system-native-buttons

**Migración y alcance:**
- [x] Los botones nativos inventariados en `ClientesPage.tsx`, `ClientDetailPage.tsx`, `ActivityForm.tsx`, `CreateTaskForm.tsx`, `CalendarView.tsx` y `LoginPage.tsx` usan `Button` de `@/components/ui/button`, preservando props y comportamiento
- [x] `rg -c '<button' frontend/src/modules` devuelve únicamente `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx:1`, excepción documentada `seller-pick-card`
- [x] `button-variants.ts` no cambia y no se agregan dependencias
- [x] Las reglas muertas `.btn-primary`, `.btn-green`, `.btn-ghost`, `.btn-danger` y `.btn-sm`, incluidas sus referencias responsive, se eliminan de `frontend/src/index.css`
- [x] `rg -c 'btn-(primary|green|ghost|danger|sm)' frontend/src` no devuelve coincidencias

**Comportamiento y verificación:**
- [x] El `TaskChip` conserva el mismo nodo button mediante `ref`, mantiene drag-and-drop, opacidad dinámica durante drag y apertura de edición al hacer click
- [x] Los controles conservan `onClick`, `disabled`, `type`, `title`, `aria-*` y estilos dinámicos necesarios; los botones icon-only nuevos tienen nombre accesible
- [x] `npm run typecheck`, `npm run lint` y `npm run build` pasan en `frontend/`
- [x] No hay cambios fuera del alcance indicado en `plans/002-native-buttons-to-shadcn.md`
- [x] Resumen guardado en `progress/impl_72-visual-system-native-buttons.md` y estado del plan 002 actualizado en `plans/README.md`

**Reviewer 2026-07-15**: PASSED 10/10. Gates técnicos y revisión estática aprobados; smoke autenticado posterior del Líder cubrió Login, Clientes, detalle de Pipeline, Actividad, creación de Tarea y Agenda sin errores de consola. `TaskChip` conserva nodo button, `draggable="true"`, cursor, opacidad y apertura de edición; el usuario confirmó manualmente el movimiento efectivo entre días. Ver `progress/impl_72-visual-system-native-buttons.md`.

---

## 73-reicon-icon-migration

**Prerequisito de dependencia (unificación pnpm, hecho 2026-07-16):**
- [x] CI instala con `pnpm install --frozen-lockfile` y cachea pnpm en ambos jobs; `pnpm-lock.yaml` queda como fuente de verdad, alineado con los Dockerfiles de dev y prod
- [x] `packageManager: pnpm@10.33.4` fijado en `backend/package.json` y `frontend/package.json`, consistente con `corepack prepare` de los Dockerfiles
- [x] Lockfiles muertos eliminados: `frontend/bun.lock`, `frontend/package-lock.json`, `backend/package-lock.json`
- [x] `pnpm install --frozen-lockfile` pasa en backend y frontend sin drift
- [x] `docs/verification.md` documenta pnpm como gestor único y la trampa de `pnpm test -- --runInBand`

**Decisión de estrategia (usuario, 2026-07-16):** migrar **con wrapper** `frontend/src/shared/components/Icon.tsx`. Base: `progress/explore_hugeicons_inventory.md` (52 instancias, 24 archivos, 23 iconos) y `progress/explore_reicon_api_mapping.md` (API real + mapeo verificado).

**Migración y alcance:**
- [x] Existe `frontend/src/shared/components/Icon.tsx` como **único** punto de import de `reicon-react`; exporta un componente por icono con nombre semántico
- [x] Los 24 archivos que importaban `@hugeicons/*` consumen el wrapper; ninguno importa `reicon-react` directamente
- [x] Los 23 iconos en uso tienen equivalente documentado en `progress/impl_73-reicon-icon-migration.md`
- [x] `rg '@hugeicons' frontend/src` no devuelve coincidencias
- [x] `@hugeicons/react` y `@hugeicons/core-free-icons` eliminados de `frontend/package.json` y de `pnpm-lock.yaml` (vía `pnpm remove`)
- [x] No se agregan otras dependencias

**Correcciones obligatorias de la librería (verificadas en `createIcon.js`):**
- [x] El wrapper neutraliza el `style="color:currentColor"` inline de reicon, que si no anula las clases `text-*` en `select.tsx:49` y `nav-projects.tsx:79` **fallando en silencio**. *Criterio original: `style={{ color: undefined }}` incondicional. Implementado mejor:* `Icon.tsx:74` hace `style={{ color, ...style }}`, que emite el atributo sólo si se pide un color explícito y preserva los 7 hex de los módulos, que el literal habría matado. Desviación revisada y aprobada
- [x] El wrapper hace `forwardRef` al `<svg>` (requerido por `<SelectPrimitive.Icon asChild>` en `select.tsx:48-50`)
- [x] `strokeWidth` se define **por icono**, nunca global: nada en los 154 escalados (`scale(1.33333)`, su default ya da 2.0), `2` en los stroke sin escalar, nada en los fill (es no-op)
- [x] El wrapper no inyecta ninguna clase que contenga la subcadena `size-` (rompería el `:not([class*='size-'])` del que dependen 33 de los 52 usos)
- [x] `data-slot`, `aria-*` y `className` siguen llegando al `<svg>` (`accordion.tsx:56-57` depende de ello)

**Fuera de alcance (verificado, no tocar):**
- [x] `shared/navigation/nav-items.tsx` intacto — sus iconos son SVG inline, no HugeIcons
- [x] `LoginPage.tsx:26-41` intacto — `CheckIcon` es un SVG local con marca `#82bc00` hardcodeada

**Comportamiento y verificación:**
- [x] Las primitivas de `components/ui` conservan `data-slot`, clases de estado, tamaño y alineación
- [x] Los iconos icon-only conservan su nombre accesible (21 → 21, verificado por el Reviewer)
- [x] `pnpm run typecheck`, `pnpm run lint` y `pnpm run build` pasan en `frontend/` sin desactivar reglas (reconfirmados por el Líder aparte del Implementer)
- [x] Smoke autenticado sin errores de consola: Login, Dashboard, sidebar, Clientes, Pipeline, Mi Día, Agenda, Actividades, Reportes, Equipo, Ventas, Coaching. 0 errores post-login
- [x] Verificación visual de los sitios de riesgo en navegador real (admin, 2026-07-16): dialog + X, selects con doble chevron, select abierto con tick, checkbox marcado, kebab de 3 puntos
- [x] Resumen guardado en `progress/impl_73-reicon-icon-migration.md`
- [x] Review independiente guardado en `progress/review_73-reicon-icon-migration.md` — PASSED 18/18 verificables, sin bloqueantes

**Verificación en navegador de los 2 fallos silenciosos (medida con `getComputedStyle`, no a ojo):**
- [x] **0 svgs con `style` inline de color** en toda la app → el `style={{ color, ...style }}` del wrapper neutraliza el `currentColor` de reicon y las clases `text-*` mandan
- [x] **0 iconos con tamaño 0** → la clase `reicon` que la librería prefija no contiene la subcadena `size-`, así que el selector `:not([class*='size-'])` sigue aplicando y los 33 usos sin tamaño propio heredan sus 16px

**Hallazgo lateral (preexistente, fuera de esta feature):** `dropdown-menu.tsx:46` lleva `**:data-[variant=destructive]:text-accent-foreground!` a nivel de `DropdownMenuContent`, que anula con `!important` el `text-destructive` del item. Por eso "Eliminar cliente" no se ve rojo. No lo introdujo esta migración y el diff no toca esa línea.

**Riesgos visuales aceptados por adelantado (no son fallos del Implementer):**
- Grosores mezclados 2.0 (stroke) / ~1.5 (fill): geometría horneada en el path, sin arreglo posible
- Tick del checkbox de 3 → ~1.5: no existe checkmark stroke sin contenedor en reicon. Verificado en navegador: renderiza y se lee bien a 16px
- 13 call-sites que pasaban `strokeWidth={1.8}` ahora rinden 2.0 (detectado por el Reviewer). Consecuencia obligada del criterio "strokeWidth por icono"; diferencia imperceptible
- 4 mapeos dudosos a juicio del usuario en la app (`Checklist` con caja, `Office` con 2 edificios, `SidebarLeft` con chevron, `Check` fill). Cambiarlos es **una línea en `Icon.tsx`**

**Reviewer 2026-07-16**: PASSED 18/18 verificables, sin bloqueantes. Las 3 desviaciones del Implementer juzgadas correctas; corrigió dos imprecisiones de su reporte (eran 6 instancias de `color="currentColor"`, no 7; y el rojo del item destructivo nunca estuvo en riesgo). Smoke autenticado y verificación en navegador ejecutados después por el Líder: 0 errores de consola, 0 svgs con color inline, 0 iconos con tamaño 0. Ver `progress/review_73-reicon-icon-migration.md`.

---

## 74-sales-remove-house-seller-inputs

- [x] El formulario “Ventas Dirección” no muestra label, select ni error de Vendedor
- [x] El formulario “Registrar ATC” no muestra label, select ni error de Vendedor
- [x] Ambos formularios asignan internamente el seller activo cuyo nombre exacto es “Dirección Comercial” y nunca usan el id del usuario como fallback
- [x] Si ese seller interno no está disponible, el submit se bloquea antes de la mutación y muestra feedback amigable
- [x] El formulario de venta del vendedor conserva su sellerId de sesión y su comportamiento
- [x] `npx tsc --noEmit` pasa en `frontend/`
- [x] Resumen en `progress/impl_74-sales-remove-house-seller-inputs.md` y review independiente en `progress/review_74-sales-remove-house-seller-inputs.md`

**Reviewer 2026-07-19**: PASSED. Los dos selects fueron retirados sin reintroducir el fallback al user id; Dirección y ATC usan el seller interno “Dirección Comercial” y bloquean el submit con feedback si no está disponible. TypeScript PASS. Ver `progress/review_74-sales-remove-house-seller-inputs.md`.

---

## 75-pipeline-client-phone-in-drawer

- [x] Al abrir un expediente desde Pipeline, cada contacto muestra su número telefónico dentro de “Información del cliente” > “Contactos”
- [x] Los contactos sin teléfono muestran un fallback claro y no renderizan `undefined`, separadores huérfanos ni enlaces inválidos
- [x] Se conserva la jerarquía visual y el contenido existente de nombre, rol y contacto principal
- [x] No se modifican backend, contratos API ni dependencias
- [x] `npx tsc --noEmit` pasa en `frontend/`
- [x] Resumen en `progress/impl_75-pipeline-client-phone-in-drawer.md` y review independiente en `progress/review_75-pipeline-client-phone-in-drawer.md`

**Reviewer 2026-07-19**: PASSED. El drawer muestra el teléfono por contacto, normaliza espacios y usa “Sin teléfono” cuando no hay valor; conserva nombre, rol y Principal. Alcance solo frontend y TypeScript PASS. Ver `progress/review_75-pipeline-client-phone-in-drawer.md`.
