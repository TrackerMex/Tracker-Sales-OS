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

- [ ] `POST /api/activities` registra actividad con calculo automatico de puntos
- [ ] Puntos calculados correctamente segun TASK_POINTS constant
- [ ] Calidad calculada (0-100%) segun completitud de campos
- [ ] Validacion: Llamada/Reunion/Visita/Propuesta requieren nextStep + fecha + hora
- [ ] `GET /api/activities/seller/:id/daily` retorna puntos del dia
- [ ] `capturedAt` vs `executedAt` registrados (delayMinutes calculado)
- [ ] Frontend: formulario de actividad valida campos requeridos por tipo
- [ ] Tests unitarios para calculo de puntos y calidad

---

## 06-tasks

- [ ] `POST /api/tasks` crea tarea con scheduledAt
- [ ] `GET /api/tasks/seller/:id/today` lista tareas de hoy
- [ ] `PATCH /api/tasks/:id/complete` marca como completada -> crea actividad draft
- [ ] Seller solo ve sus propias tareas
- [ ] Frontend: pagina Agenda muestra tareas con estado visual
- [ ] Tareas vencidas marcadas visualmente en rojo

---

## 07-pipeline

- [ ] `GET /api/pipeline/seller/:id` retorna deals agrupados por stage
- [ ] `PATCH /api/deals/:id/stage` cambia stage con validacion de transicion permitida
- [ ] `stageHistory` actualizado en cada cambio (JSONB append)
- [ ] `probability` actualizado automaticamente segun stage
- [ ] AuditInterceptor registra old_values y new_values
- [ ] Frontend: vista Kanban con 7 columnas draggable

---

## 08-sales

- [ ] `POST /api/sales` registra cierre (tipo seller/atc/direction)
- [ ] `GET /api/sales` con filtros de mes, seller, tipo
- [ ] Calculo correcto de unidades nuevas vs existentes
- [ ] Frontend: 3 formularios independientes por tipo de venta

---

## 09-dashboard

- [ ] `GET /api/dashboard/summary` retorna KPIs globales del mes
- [ ] `GET /api/dashboard/sellers-score` retorna semaforo de vendedores (0-100%)
- [ ] Score calculado: 45% esfuerzo + 35% calidad + 40% volumen - 10 por vencido
- [ ] `GET /api/dashboard/overdue-tasks` retorna seguimientos vencidos
- [ ] Frontend: dashboard muestra metricas + semaforo visual

---

## 10-mi-dia

- [ ] `GET /api/mi-dia/seller/:id` retorna estado operativo del dia
- [ ] Incluye: puntos acumulados, llamadas, agenda de manana count, prospectos nuevos, vencidos
- [ ] Frontend: termometro con colores (verde/ambar/rojo/morado)
- [ ] Alertas IA Coach basadas en patrones del dia

---

## 11-coaching

- [ ] `GET /api/coaching/seller/:id/daily` retorna reporte del dia
- [ ] Mix de actividades calculado (% por tipo)
- [ ] Frontend: pagina Coaching muestra reporte por vendedor
- [ ] Admin y Director pueden ver reporte de cualquier seller

---

## 12-ai-coach

- [ ] `POST /api/coaching/suggestion` llama Claude API y retorna sugerencia
- [ ] Prompt incluye: tipo actividad, objetivo, cliente, stage del deal
- [ ] Response en < 3 segundos (o streaming)
- [ ] Manejo de errores: si API falla, retorna sugerencia por defecto
- [ ] ANTHROPIC_API_KEY en .env
- [ ] Frontend: sugerencia se muestra en formulario de tarea/actividad

---

## 13-reports

- [ ] `GET /api/reports/monthly?month=YYYY-MM` retorna consolidado
- [ ] Separado por: Direccion + ATC + Vendedores
- [ ] Calcula: metas vs logros, unidades nuevas vs existentes, origen cuentas
- [ ] Admin y Director solo
- [ ] Frontend: pagina Reportes con tabla y metricas del mes

---

## 14-settings

- [ ] `GET /api/settings` retorna configuracion actual
- [ ] `PATCH /api/settings` actualiza: dailyMinPoints, monthlyAmountGoal, etc.
- [ ] Solo Admin puede modificar settings
- [ ] Frontend: pagina Configuracion con formulario de settings

---

## 15-import-export

- [ ] `GET /api/export` retorna JSON con todos los datos del tenant
- [ ] `POST /api/import` importa JSON y valida schema antes de insertar
- [ ] Import hace upsert (no duplica si ya existe)
- [ ] Solo Admin
- [ ] Frontend: pagina Import/Export con botones de descarga y upload
