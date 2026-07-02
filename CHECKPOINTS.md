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
