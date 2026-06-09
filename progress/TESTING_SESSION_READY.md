# Sesión de Testing Manual — READY TO START

**Fecha**: 2026-06-09
**Status**: ✅ **ENTORNO PREPARADO**

---

## ✅ Preparación Completada

### Entorno Docker
- ✅ **postgres** (tracker-sales-db): UP 2 hours, HEALTHY
- ✅ **backend** (tracker-sales-api): UP 1 hour, port 3000
- ✅ **frontend** (tracker-sales-ui): UP 2 hours, port 3001
- ✅ **nginx**: UP 2 hours, port 80

### Usuario Admin Existente
- ✅ **username**: `admin`
- ✅ **password**: `admin123` ← **PASSWORD RESETEADO (2026-06-09)**
- ✅ **role**: Admin
- ✅ **name**: Administrador
- ✅ **seller_id**: NULL (no vinculado a seller)
- ✅ **Login verificado**: ✅ FUNCIONA

### Documentación Creada
1. ✅ `progress/MANUAL_TESTING_GUIDE.md` — Guía paso a paso completa (30-45 min)
2. ✅ `progress/manual_testing_results.md` — Plantilla para documentar resultados
3. ✅ `progress/manual_testing_setup.md` — Setup técnico y contexto
4. ✅ `progress/seed_test_users.sql` — Script SQL (no usado por incompatibilidad de schema)

---

## 🎯 Objetivo de la Sesión

Verificar **11 checkpoints visuales** pendientes de las features 06-14:

| Feature | Checkpoints | Descripción |
|---------|-------------|-------------|
| **06-tasks** | 2 | Agenda visual + tareas vencidas en rojo |
| **07-pipeline** | 2 | Kanban 7 columnas + AuditInterceptor |
| **08-sales** | 2 | 3 formularios + cálculo unidades |
| **09-dashboard** | 1 | KPIs + semáforo visual |
| **11-coaching** | 2 | Reporte vendedor + RBAC |
| **13-reports** | 1 | Tabla reportes mensuales |
| **14-settings** | 1 | Formulario configuración |
| **TOTAL** | **11** | **37-52 checkpoints restantes** |

---

## 📋 Checklist Rápido

### Antes de Empezar
- [ ] Abrir http://localhost:3001 en navegador
- [ ] Login como `admin` / `admin123`
- [ ] Abrir http://localhost:3000/api/docs (Swagger) en otra pestaña
- [ ] Abrir `progress/MANUAL_TESTING_GUIDE.md` como referencia
- [ ] Abrir `progress/manual_testing_results.md` para documentar

### Crear Usuarios de Prueba (vía Swagger)
**Tiempo estimado**: 10 minutos

1. [ ] Login en Swagger con admin/admin123
2. [ ] Copiar accessToken
3. [ ] Click en "Authorize" → pegar `Bearer <token>`
4. [ ] Crear Seller 1: Juan Pérez (POST /api/sellers)
5. [ ] Crear Seller 2: María López (POST /api/sellers)
6. [ ] Crear User director1 (POST /api/users)
7. [ ] Crear User seller1 vinculado a Juan Pérez (POST /api/users)
8. [ ] Crear User seller2 vinculado a María López (POST /api/users)

**Credenciales creadas**:
- `director1` / `Director123!`
- `seller1` / `Seller123!`
- `seller2` / `Seller123!`

### Crear Datos de Prueba (vía Swagger)
**Tiempo estimado**: 10 minutos

**Login como seller1** en Swagger:
1. [ ] POST /api/auth/login → seller1/Seller123!
2. [ ] Copiar token → Authorize

**Crear**:
1. [ ] Cliente: Empresa ABC S.A. (POST /api/clients)
2. [ ] Tarea hoy: Llamar a Roberto (POST /api/tasks)
3. [ ] Tarea vencida: Enviar cotización (scheduledAt ayer) (POST /api/tasks)
4. [ ] Actividad: Llamada 3pts (POST /api/activities)
5. [ ] Actividad: Visita 10pts (POST /api/activities)
6. [ ] Deal: Pipeline etapa Propuesta (POST /api/pipeline)
7. [ ] Venta: Tipo Seller, 5 unidades (POST /api/sales)

**Ver Anexo A en MANUAL_TESTING_GUIDE.md para JSONs exactos**

### Ejecutar Testing Manual (11 Checkpoints)
**Tiempo estimado**: 30-45 minutos

Seguir `progress/MANUAL_TESTING_GUIDE.md` paso a paso:

1. [ ] **Feature 06-tasks** (2 checkpoints)
   - Ruta: `/agenda` como seller1
   - Verificar: lista tareas + vencidas en rojo

2. [ ] **Feature 07-pipeline** (2 checkpoints)
   - Ruta: `/pipeline` como seller1
   - Verificar: 7 columnas Kanban + audit_logs en DB

3. [ ] **Feature 08-sales** (2 checkpoints)
   - Ruta: `/ventas` como seller1
   - Verificar: 3 tabs formularios + cálculo unidades

4. [ ] **Feature 09-dashboard** (1 checkpoint)
   - Ruta: `/dashboard` como admin
   - Verificar: KPIs + semáforo vendedores

5. [ ] **Feature 11-coaching** (2 checkpoints)
   - Ruta: `/coaching` como director1 y seller1
   - Verificar: reporte + RBAC

6. [ ] **Feature 13-reports** (1 checkpoint)
   - Ruta: `/reportes` como admin
   - Verificar: tabla mensual + métricas

7. [ ] **Feature 14-settings** (1 checkpoint)
   - Ruta: `/configuracion` como admin
   - Verificar: formulario + cambio dinámico en Mi Día

### Documentar Resultados
**Tiempo estimado**: 10 minutos

1. [ ] Completar `progress/manual_testing_results.md`
2. [ ] Actualizar tabla resumen con PASS/FAIL
3. [ ] Documentar bugs en `progress/bugs.md` (si aplica)
4. [ ] (Opcional) Tomar screenshots en `progress/screenshots/`

---

## 🚀 Cómo Empezar

### Opción 1: Testing Completo (recomendado)
```bash
# 1. Verificar que Docker esté UP
docker-compose ps

# 2. Abrir navegador
# http://localhost:3001

# 3. Seguir guía completa
# progress/MANUAL_TESTING_GUIDE.md
```

### Opción 2: Testing Rápido (solo UI, sin datos)
```bash
# 1. Abrir frontend
# http://localhost:3001

# 2. Login con admin/admin123

# 3. Recorrer rutas y verificar que cargan:
# /dashboard
# /mi-dia
# /clientes
# /pipeline
# /actividades
# /agenda
# /ventas
# /coaching
# /reportes
# /configuracion
# /equipo

# 4. Documentar qué páginas cargan correctamente
```

---

## 📊 Estado Actual del Proyecto

### Features Completadas (15/17)
- ✅ 01-infra-setup
- ✅ 02-auth
- ✅ 03-users-sellers
- ✅ 04-clients
- ✅ 05-activities
- ✅ 06-tasks
- ✅ 07-pipeline
- ✅ 08-sales
- ✅ 09-dashboard
- ✅ 10-mi-dia
- ✅ 11-coaching
- ✅ 13-reports
- ✅ 14-settings
- ✅ 15-import-export
- ✅ 16-ui-design-review

### Features Pendientes (1/17)
- ⏳ **12-ai-coach** (Claude API integration) — PENDIENTE DECISIÓN

### Verificación (Feature 17)
- ✅ **Código fuente**: 37/52 checkpoints verificados (71%)
- ✅ **Compilación TypeScript**: PASS (backend + frontend)
- ✅ **Docker**: UP and HEALTHY
- ⏳ **Testing manual**: 11 checkpoints pendientes (este documento)

### Bugs
- ✅ **Bug #1**: Mi Día settings hardcoded — **CORREGIDO** (2026-06-09)
- ⚠️ **Bug #2**: AI Coach no implementado — Feature 12 pendiente
- ❓ **Bug #3**: AuditInterceptor — Requiere verificación en esta sesión

---

## 🎓 Recursos de Referencia

### Documentación Técnica
- `CLAUDE.md` — Instrucciones para agente Líder
- `AGENTS.md` — Roles de subagentes
- `CHECKPOINTS.md` — Criterios de completitud por feature
- `feature_list.json` — Estado de las 15 features
- `docs/architecture.md` — Arquitectura + entidades
- `docs/conventions.md` — Naming + estructura
- `docs/verification.md` — Cómo correr tests

### Reportes de Sesiones Anteriores
- `progress/history.md` — Historial completo de features implementadas
- `progress/impl_integration_testing.md` — Verificación exhaustiva de código (885 líneas)
- `progress/bugs.md` — Bugs documentados con fix del Bug #1

### Stack del Proyecto
- **Backend**: NestJS 11 + TypeScript + TypeORM + PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite + TanStack Router/Query + Zustand + Tailwind v4 + shadcn/ui
- **IA Coach**: Claude API (feature 12 pendiente)
- **Infra**: Docker Compose (4 servicios)

---

## 🎯 Resultado Esperado de Esta Sesión

Al terminar, tendrás:

1. ✅ **11 checkpoints verificados** (PASS/FAIL documentados)
2. ✅ **`progress/manual_testing_results.md`** completo
3. ✅ **CHECKPOINTS.md** actualizado con resultados
4. ✅ **Bugs nuevos** documentados en `progress/bugs.md` (si se encuentran)
5. ✅ **Screenshots** opcionales en `progress/screenshots/`
6. ✅ **Decisión** sobre Feature 12 (AI Coach): ¿implementar o marcar como opcional?

---

## 💡 Tips para el Testing

1. **Usa Swagger** para crear datos de prueba — es más rápido que la UI
2. **Documenta en tiempo real** — no confíes en tu memoria al final
3. **Screenshots son opcionales** pero ayudan a reportar bugs
4. **Consola del navegador** (F12) es tu amiga — busca errores JS
5. **Network tab** (F12) muestra requests fallidos y tiempos de respuesta
6. **Si un checkpoint falla**, documenta pasos para reproducir en `bugs.md`

---

## 📞 Siguiente Paso

**EMPEZAR TESTING MANUAL**:
```bash
# Abre esta guía en tu navegador o editor favorito
code progress/MANUAL_TESTING_GUIDE.md

# Abre la plantilla de resultados
code progress/manual_testing_results.md

# Abre el frontend
# http://localhost:3001
```

---

**¡Buena suerte!** 🚀

Si encuentras problemas técnicos (Docker down, DB corrupta, etc.), reporta en `progress/bugs.md` y detén el testing.
