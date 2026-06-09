# Guía de Testing Manual E2E — Tracker Sales OS

**Fecha**: 2026-06-09
**Objetivo**: Verificar 11 checkpoints visuales pendientes
**Duración estimada**: 30-45 minutos

---

## Resumen Ejecutivo

Esta guía te llevará paso a paso por el testing manual de los **11 checkpoints visuales** que no pudieron ser verificados automáticamente en la Feature 17 (Integration Testing).

**Entorno**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

**Docker Status**: ✅ Todos los contenedores UP

---

## Preparación: Crear Usuarios de Prueba

### Opción A: Vía Swagger UI (Recomendado)

1. Abrir http://localhost:3000/api/docs en navegador
2. Hacer clic en **POST /api/auth/login** → "Try it out"
3. Login como admin:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
4. Copiar el `accessToken` del response
5. Hacer clic en el botón **"Authorize"** (candado verde arriba)
6. Pegar token en formato: `Bearer <token>`
7. Crear sellers y users siguiendo **Anexo A: Setup Datos de Prueba**

### Opción B: Vía Frontend (Si está funcional)

1. Abrir http://localhost:3001
2. Login como admin/admin123
3. Navegar a /equipo
4. Crear sellers y users manualmente

---

## Testing Checklist (11 Checkpoints)

### ✅ Feature 06-tasks (2 checkpoints)

**Ruta**: http://localhost:3001/agenda

**Checkpoint 1**: Frontend: página Agenda muestra tareas con estado visual

**Pasos**:
1. Login como `seller1` / `Seller123!`
2. Navegar a `/agenda`
3. **Verificar**:
   - [ ] Página carga sin errores en consola del navegador
   - [ ] Lista de tareas del día visible
   - [ ] Cada tarea muestra: título, descripción, tipo, hora programada
   - [ ] Estado visual claro (pendiente/completada)

**Checkpoint 2**: Tareas vencidas marcadas visualmente en rojo

**Pasos**:
1. En la misma página `/agenda`
2. Verificar si hay tareas con `scheduledAt < hoy`
3. **Verificar**:
   - [ ] Tareas vencidas tienen indicador visual diferente (rojo, borde rojo, icon warning, etc.)
   - [ ] Se distingue claramente de tareas pendientes normales

**Resultado esperado**: ✅ PASS si ambos checkpoints funcionan visualmente

---

### ✅ Feature 07-pipeline (2 checkpoints)

**Ruta**: http://localhost:3001/pipeline

**Checkpoint 1**: Frontend: vista Kanban con 7 columnas

**Pasos**:
1. Login como `seller1` / `Seller123!`
2. Navegar a `/pipeline`
3. **Verificar**:
   - [ ] Página carga sin errores
   - [ ] 7 columnas visibles: Prospecto, Contactado, Interesado, Propuesta, Negociación, Cierre, Perdido
   - [ ] Deals renderizados en sus columnas correspondientes
   - [ ] Cambio de stage funcional (click o drag)

**Checkpoint 2**: AuditInterceptor registra old_values y new_values

**Pasos**:
1. En `/pipeline`, cambiar el stage de un deal (ej: Prospecto → Contactado)
2. Abrir consola del navegador → pestaña Network
3. Verificar response del PATCH /api/deals/:id/stage
4. **Verificar** (en DB o logs):
   - [ ] ¿Existe tabla `audit_logs` en la DB?
   - [ ] ¿Se registró el cambio con old_values y new_values?

**Cómo verificar en DB**:
```bash
docker exec tracker-sales-db psql -U tracker -d tracker_sales_os -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

Si la tabla no existe o está vacía → **FAIL** (feature no implementada completamente)

**Resultado esperado**: Checkpoint 1 ✅ PASS, Checkpoint 2 ❓ (requiere verificación DB)

---

### ✅ Feature 08-sales (2 checkpoints)

**Ruta**: http://localhost:3001/ventas

**Checkpoint 1**: Frontend: 3 formularios independientes por tipo de venta

**Pasos**:
1. Login como `seller1` / `Seller123!`
2. Navegar a `/ventas`
3. **Verificar**:
   - [ ] Página carga sin errores
   - [ ] 3 tabs visibles: "Seller", "ATC", "Dirección"
   - [ ] Al cambiar de tab, el formulario cambia (campos diferentes o mismos campos con contexto diferente)
   - [ ] Cada formulario es funcional (se puede crear venta)

**Checkpoint 2**: Cálculo correcto de unidades nuevas vs existentes

**Pasos**:
1. Crear venta tipo "Seller" con `clientType: "Nuevo"`, `units: 5`
2. Crear venta tipo "ATC" con `clientType: "Existente"`, `units: 3`
3. Navegar a `/dashboard` o `/reportes`
4. **Verificar**:
   - [ ] Dashboard o reporte muestra "Unidades Nuevas: 5"
   - [ ] Dashboard o reporte muestra "Unidades Existentes: 3"
   - [ ] Total: 8 unidades

**Resultado esperado**: ✅ PASS si ambos checkpoints funcionan

---

### ✅ Feature 09-dashboard (1 checkpoint)

**Ruta**: http://localhost:3001/dashboard

**Checkpoint**: Frontend: dashboard muestra métricas + semáforo visual

**Pasos**:
1. Login como `admin` / `admin123`
2. Navegar a `/dashboard`
3. **Verificar**:
   - [ ] KPIs globales del mes visibles (monto total, unidades, puntos)
   - [ ] Tabla de vendedores con columnas: Nombre, Score (0-100), Estado (color/emoji)
   - [ ] Semáforo funcional: verde ≥70%, ámbar 50-69%, rojo <50%
   - [ ] Click en vendedor navega a detalle (opcional)

**Resultado esperado**: ✅ PASS si métricas y semáforo renderean correctamente

---

### ✅ Feature 11-coaching (2 checkpoints)

**Ruta**: http://localhost:3001/coaching

**Checkpoint 1**: Frontend: página Coaching muestra reporte por vendedor

**Pasos**:
1. Login como `director1` / `Director123!`
2. Navegar a `/coaching`
3. **Verificar**:
   - [ ] Página carga sin errores
   - [ ] Selector de vendedor visible (dropdown o lista)
   - [ ] Reporte diario muestra: puntos del día, mix de actividades, calidad promedio
   - [ ] Mix de actividades muestra % por tipo (Llamadas, Reuniones, etc.)

**Checkpoint 2**: Admin y Director pueden ver reporte de cualquier seller

**Pasos**:
1. Login como `director1` → ver `/coaching` → selector muestra todos los sellers ✅
2. Login como `seller1` → ver `/coaching` → solo ve su reporte (sin selector) ✅
3. **Verificar**:
   - [ ] Director ve selector de vendedor y puede cambiar
   - [ ] Seller NO ve selector, solo su reporte
   - [ ] RBAC funciona correctamente

**Resultado esperado**: ✅ PASS si RBAC funciona

---

### ✅ Feature 13-reports (1 checkpoint)

**Ruta**: http://localhost:3001/reportes

**Checkpoint**: Frontend: página Reportes con tabla y métricas del mes

**Pasos**:
1. Login como `admin` / `admin123`
2. Navegar a `/reportes`
3. **Verificar**:
   - [ ] Selector de mes visible (month picker)
   - [ ] Tabla consolidada con columnas: Dirección, ATC, Vendedores
   - [ ] Métricas del mes: monto total, unidades, metas vs logros
   - [ ] Botón "Descargar JSON" o "Exportar" (opcional)

**Resultado esperado**: ✅ PASS si tabla y métricas visibles

---

### ✅ Feature 14-settings (1 checkpoint)

**Ruta**: http://localhost:3001/configuracion

**Checkpoint**: Frontend: página Configuración con formulario de settings

**Pasos**:
1. Login como `admin` / `admin123`
2. Navegar a `/configuracion`
3. **Verificar**:
   - [ ] Formulario con campos: `dailyMinPoints`, `monthlyAmountGoal`, `monthlyUnitGoal`, `sellerMonthlyAmountGoal`
   - [ ] Valores actuales cargados desde API
   - [ ] Botón "Guardar" funcional
4. Cambiar `dailyMinPoints` de 30 a 40 → Guardar
5. Login como `seller1` → navegar a `/mi-dia`
6. **Verificar**:
   - [ ] Mi Día ahora muestra meta de 40 puntos (no 30)

**Resultado esperado**: ✅ PASS si settings son dinámicos

---

## Documentar Resultados

Al terminar cada checkpoint, documenta en `progress/manual_testing_results.md`:

```markdown
### Feature 06-tasks

**Checkpoint 1**: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL
- Observaciones: [descripción de lo que viste]
- Screenshots: [opcional]

**Checkpoint 2**: ✅ PASS | ❌ FAIL
- Observaciones: [...]
```

---

## Anexo A: Setup Datos de Prueba

### Crear Sellers (vía Swagger POST /api/sellers)

**Seller 1**:
```json
{
  "name": "Juan Pérez",
  "profile": "Vendedor senior"
}
```

Copiar `id` del response (ej: `723e3ed2-9bee-4dd9-b43a-333c7dbeb3d2`, `64bd3eee-44a0-4304-8f27-af5d144070f3`)

**Seller 2**:
```json
{
  "name": "María López",
  "profile": "Vendedora junior"
}
```

**NOTA**: El campo `active` NO se incluye en CreateSellerDto — por defecto todos los sellers se crean activos.

### Crear Users (vía Swagger POST /api/users)

**User Director**:
```json
{
  "username": "director1",
  "name": "Carlos Director",
  "password": "Director123!",
  "role": "Director"
}
```

**User Seller1** (vinculado a Juan Pérez):
```json
{
  "username": "seller1",
  "name": "Juan Pérez",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<id_de_juan_perez>"
}
```

**User Seller2** (vinculado a María López):
```json
{
  "username": "seller2",
  "name": "María López",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<id_de_maria_lopez>"
}
```

**NOTA**: El campo `active` NO se incluye en CreateUserDto — por defecto todos los usuarios se crean activos. El campo `name` es **requerido**.

### Crear Cliente (vía Swagger POST /api/clients)

Login como `seller1` primero, luego:

```json
{
  "name": "Empresa ABC S.A.",
  "type": "Prospecto",
  "person": "Moral",
  "source": "Prospección propia",
  "stage": "Prospecto",
  "expectedAmount": 150000,
  "units": 5,
  "sellerId": "<id_de_seller1>",
  "contacts": [
    {
      "name": "Roberto García",
      "email": "roberto@abc.com",
      "phone": "+52 55 1111 2222"
    }
  ]
}
```

### Crear Tareas (vía Swagger POST /api/tasks)

**Tarea para hoy**:
```json
{
  "title": "Llamar a Roberto García",
  "description": "Seguimiento propuesta",
  "type": "Llamada",
  "scheduledAt": "2026-06-09T10:00:00Z",
  "clientId": "<id_cliente_abc>",
  "sellerId": "<id_seller1>"
}
```

**Tarea vencida** (cambiar fecha a ayer):
```json
{
  "title": "Enviar cotización urgente",
  "description": "Cotización servicios",
  "type": "Correo",
  "scheduledAt": "2026-06-08T14:00:00Z",
  "clientId": "<id_cliente_abc>",
  "sellerId": "<id_seller1>"
}
```

### Crear Actividades (vía Swagger POST /api/activities)

**Actividad hoy — Llamada (3 puntos)**:
```json
{
  "type": "Llamada",
  "clientId": "<id_cliente_abc>",
  "sellerId": "<id_seller1>",
  "executedAt": "2026-06-09T09:30:00Z",
  "summary": "Cliente revisó propuesta y tiene dudas sobre implementación y tiempos de entrega",
  "discovery": "Requiere capacitación para equipo de ventas existente de 5 personas",
  "agreement": "Enviar plan de capacitación detallado en 48 horas máximo con costos",
  "nextStep": "Enviar documento de capacitación",
  "nextDate": "2026-06-11",
  "nextTime": "10:00"
}
```

**Actividad hoy — Visita (10 puntos)**:
```json
{
  "type": "Reunión presencial",
  "clientId": "<id_cliente_abc>",
  "sellerId": "<id_seller1>",
  "executedAt": "2026-06-09T14:00:00Z",
  "summary": "Reunión con Director General y equipo de compras de 3 personas, propuesta bien recibida",
  "discovery": "Presupuesto aprobado internamente, decisión final en 2 semanas por comité directivo",
  "agreement": "Enviar contrato preliminar con términos y condiciones actualizados esta semana",
  "nextStep": "Seguimiento telefónico en 1 semana",
  "nextDate": "2026-06-16",
  "nextTime": "11:00"
}
```

### Crear Deal en Pipeline (vía Swagger POST /api/pipeline)

```json
{
  "clientId": "<id_cliente_abc>",
  "sellerId": "<id_seller1>",
  "stage": "Propuesta",
  "amount": 150000,
  "description": "Implementación Tracker Sales OS para equipo de 5 vendedores con capacitación"
}
```

### Crear Venta (vía Swagger POST /api/sales)

```json
{
  "type": "Seller",
  "clientType": "Nuevo",
  "product": "Tracker Sales OS - Plan Enterprise",
  "units": 5,
  "amount": 180000,
  "paymentMethod": "Pagado",
  "origin": "Prospección propia",
  "closedAt": "2026-06-05",
  "sellerId": "<id_seller1>"
}
```

---

## Troubleshooting

**Problema**: No puedo crear users/sellers vía Swagger (401 Unauthorized)
**Solución**: Verificar que el token esté en formato `Bearer <token>` en el botón "Authorize"

**Problema**: Frontend muestra pantalla blanca o error 404
**Solución**: Verificar que docker-compose esté UP: `docker-compose ps`

**Problema**: Cambios en settings no se reflejan
**Solución**: Limpiar cache del navegador (Ctrl+Shift+R) o verificar que el backend tenga el fix del Bug #1

---

## Resultado Final

Al terminar, tendrás:
- ✅ 11 checkpoints verificados (PASS/FAIL documentados)
- ✅ Screenshots opcionales en `progress/screenshots/`
- ✅ Archivo `progress/manual_testing_results.md` completo
- ✅ CHECKPOINTS.md actualizado con resultados

**Próximo paso**: Si hay FAILs, crear tickets en `progress/bugs.md` con pasos para reproducir.

---

**¡Buena suerte con el testing!** 🚀
