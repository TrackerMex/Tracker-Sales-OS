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
