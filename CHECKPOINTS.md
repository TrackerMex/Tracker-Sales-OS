# CHECKPOINTS.md — Criterios de Completitud por Feature

Cada feature debe cumplir TODOS los criterios de su checkpoint antes de marcarse como `done`.

---

## 01-infra-setup

- [ ] `docker-compose up -d` levanta postgres, backend y frontend sin errores
- [ ] `GET http://localhost:3000/` retorna 200 (health check)
- [ ] `GET http://localhost:3000/api/docs` muestra Swagger UI
- [ ] `cd backend && pnpm start:dev` inicia sin errores TypeScript
- [ ] `cd frontend && pnpm dev` inicia sin errores TypeScript
- [ ] Variables de entorno documentadas en `.env.example`

---

## 02-auth

- [ ] `POST /api/auth/login` con credenciales válidas retorna `{ accessToken: string }`
- [ ] `POST /api/auth/login` con credenciales inválidas retorna 401
- [ ] JWT contiene `{ sub, username, role, sellerId }`
- [ ] `JwtAuthGuard` bloquea rutas sin token (401)
- [ ] `RolesGuard` bloquea rutas sin rol correcto (403)
- [ ] Contraseña almacenada como bcrypt hash (nunca plaintext)
- [ ] Tests unitarios en `auth.service.spec.ts` pasan
- [ ] Frontend: pantalla de login funciona, token se guarda en localStorage
- [ ] `tsc --noEmit` sin errores en frontend y backend

---

## 03-users-sellers

- [ ] `GET /api/users` (Admin only) lista usuarios con paginación
- [ ] `POST /api/users` crea usuario con rol y vincula a seller
- [ ] `PATCH /api/users/:id/block` bloquea/activa usuario
- [ ] `GET /api/sellers` lista comerciales activos
- [ ] `POST /api/sellers` crea nuevo comercial
- [ ] Seller bloqueado no puede hacer login
- [ ] Frontend: página Equipo muestra lista de usuarios y sellers

---

## 04-clients

- [ ] `POST /api/clients` crea cliente/prospecto con validación anti-duplicados
- [ ] Anti-duplicados: verifica nombre empresa, dominio, teléfono, correo
- [ ] `GET /api/clients` con filtros (stage, type, seller)
- [ ] `PATCH /api/clients/:id` actualiza cliente incluyendo stage y nextStep
- [ ] `POST /api/clients/:id/contacts` agrega contacto al cliente
- [ ] Seller solo ve sus propios clientes (RolesGuard)
- [ ] Admin y Director ven todos los clientes
- [ ] Frontend: página Clientes muestra tarjetas con búsqueda full-text

---

## 05-activities

- [ ] `POST /api/activities` registra actividad con cálculo automático de puntos
- [ ] Puntos calculados correctamente según TASK_POINTS constant
- [ ] Calidad calculada (0-100%) según completitud de campos
- [ ] Validación: Llamada/Reunión/Visita/Propuesta requieren nextStep + fecha + hora
- [ ] `GET /api/activities/seller/:id/daily` retorna puntos del día
- [ ] `capturedAt` vs `executedAt` registrados (delayMinutes calculado)
- [ ] Frontend: formulario de actividad valida campos requeridos por tipo
- [ ] Tests unitarios para cálculo de puntos y calidad

---

## 06-tasks

- [ ] `POST /api/tasks` crea tarea con scheduledAt
- [ ] `GET /api/tasks/seller/:id/today` lista tareas de hoy
- [ ] `PATCH /api/tasks/:id/complete` marca como completada → crea actividad draft
- [ ] Seller solo ve sus propias tareas
- [ ] Frontend: página Agenda muestra tareas con estado visual
- [ ] Tareas vencidas marcadas visualmente en rojo

---

## 07-pipeline

- [ ] `GET /api/pipeline/seller/:id` retorna deals agrupados por stage
- [ ] `PATCH /api/deals/:id/stage` cambia stage con validación de transición permitida
- [ ] `stageHistory` actualizado en cada cambio (JSONB append)
- [ ] `probability` actualizado automáticamente según stage
- [ ] AuditInterceptor registra old_values y new_values
- [ ] Frontend: vista Kanban con 7 columnas draggable

---

## 08-sales

- [ ] `POST /api/sales` registra cierre (tipo seller/atc/direction)
- [ ] `GET /api/sales` con filtros de mes, seller, tipo
- [ ] Cálculo correcto de unidades nuevas vs existentes
- [ ] Frontend: 3 formularios independientes por tipo de venta

---

## 09-dashboard

- [ ] `GET /api/dashboard/summary` retorna KPIs globales del mes
- [ ] `GET /api/dashboard/sellers-score` retorna semáforo de vendedores (0-100%)
- [ ] Score calculado: 45% esfuerzo + 35% calidad + 40% volumen - 10 por vencido
- [ ] `GET /api/dashboard/overdue-tasks` retorna seguimientos vencidos
- [ ] Frontend: dashboard muestra métricas + semáforo visual

---

## 10-mi-dia

- [ ] `GET /api/mi-dia/seller/:id` retorna estado operativo del día
- [ ] Incluye: puntos acumulados, llamadas, agenda de mañana count, prospectos nuevos, vencidos
- [ ] Frontend: termómetro con colores (verde/ámbar/rojo/morado)
- [ ] Alertas IA Coach basadas en patrones del día

---

## 11-coaching

- [ ] `GET /api/coaching/seller/:id/daily` retorna reporte del día
- [ ] Mix de actividades calculado (% por tipo)
- [ ] Frontend: página Coaching muestra reporte por vendedor
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
- [ ] Separado por: Dirección + ATC + Vendedores
- [ ] Calcula: metas vs logros, unidades nuevas vs existentes, origen cuentas
- [ ] Admin y Director solo
- [ ] Frontend: página Reportes con tabla y métricas del mes

---

## 14-settings

- [ ] `GET /api/settings` retorna configuración actual
- [ ] `PATCH /api/settings` actualiza: dailyMinPoints, monthlyAmountGoal, etc.
- [ ] Solo Admin puede modificar settings
- [ ] Frontend: página Configuración con formulario de settings

---

## 15-import-export

- [ ] `GET /api/export` retorna JSON con todos los datos del tenant
- [ ] `POST /api/import` importa JSON y valida schema antes de insertar
- [ ] Import hace upsert (no duplica si ya existe)
- [ ] Solo Admin
- [ ] Frontend: página Import/Export con botones de descarga y upload
