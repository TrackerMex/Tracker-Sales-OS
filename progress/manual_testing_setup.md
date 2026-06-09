# Manual Testing Setup — Tracker Sales OS

**Fecha**: 2026-06-09
**Objetivo**: Verificar 11 checkpoints visuales pendientes mediante testing manual E2E

---

## Entorno de Testing

**URLs**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

**Docker Status**: ✅ UP
```
tracker-sales-db      (postgres:15-alpine) — UP 2 hours
tracker-sales-api     (NestJS backend)     — UP 1 hour
tracker-sales-ui      (Vite frontend)      — UP 2 hours
tracker-sales-nginx   (nginx reverse proxy) — UP 2 hours
```

---

## Usuarios de Prueba

### Existentes en DB
1. **admin** / password: (requiere reset) — Role: Admin

### A Crear (vía API o Swagger)

2. **director1** — Role: Director
   - Password: Director123!
   - Puede ver todos los vendedores
   - No puede modificar settings

3. **seller1** — Role: Seller
   - Password: Seller123!
   - Nombre: Juan Pérez
   - Solo ve sus propios datos

4. **seller2** — Role: Seller
   - Password: Seller123!
   - Nombre: María López
   - Solo ve sus propios datos

---

## Pasos de Setup

### 1. Login como Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Crear Sellers (vía POST /api/sellers)
```json
// Seller 1
{
  "name": "Juan Pérez",
  "email": "juan@trackersales.com",
  "phone": "+52 55 1234 5678",
  "active": true
}

// Seller 2
{
  "name": "María López",
  "email": "maria@trackersales.com",
  "phone": "+52 55 8765 4321",
  "active": true
}
```

### 3. Crear Users vinculados a Sellers (vía POST /api/users)
```json
// User Director
{
  "username": "director1",
  "password": "Director123!",
  "role": "Director",
  "active": true
}

// User Seller 1
{
  "username": "seller1",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<seller1_id>",
  "active": true
}

// User Seller 2
{
  "username": "seller2",
  "password": "Seller123!",
  "role": "Seller",
  "sellerId": "<seller2_id>",
  "active": true
}
```

### 4. Crear datos de prueba para testing

**Clientes/Prospectos** (seller1):
```json
{
  "name": "Empresa ABC S.A.",
  "type": "Moral",
  "stage": "Prospecto",
  "sellerId": "<seller1_id>",
  "contacts": [
    {
      "name": "Roberto García",
      "email": "roberto@abc.com",
      "phone": "+52 55 1111 2222",
      "position": "Director General"
    }
  ]
}
```

**Tareas** (seller1):
```json
// Tarea para hoy
{
  "title": "Llamar a Roberto García",
  "description": "Seguimiento propuesta",
  "type": "Llamada",
  "scheduledAt": "2026-06-09T10:00:00Z",
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>"
}

// Tarea vencida (ayer)
{
  "title": "Enviar cotización",
  "description": "Cotización servicios",
  "type": "Correo",
  "scheduledAt": "2026-06-08T14:00:00Z",
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>"
}

// Tareas para mañana
{
  "title": "Reunión presencial",
  "description": "Presentación propuesta final",
  "type": "Reunión presencial",
  "scheduledAt": "2026-06-10T11:00:00Z",
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>"
}
```

**Actividades** (seller1):
```json
// Actividad de hoy — Llamada (3 puntos)
{
  "type": "Llamada",
  "objective": "Dar seguimiento a propuesta enviada",
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>",
  "executedAt": "2026-06-09T09:30:00Z",
  "summary": "Cliente revisó propuesta y tiene dudas sobre implementación",
  "discovery": "Requiere capacitación para equipo",
  "agreement": "Enviar plan de capacitación en 48h",
  "nextStep": "Enviar documento de capacitación",
  "nextDate": "2026-06-11",
  "nextTime": "10:00"
}

// Actividad de hoy — Visita (10 puntos)
{
  "type": "Reunión presencial",
  "objective": "Presentación de propuesta comercial",
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>",
  "executedAt": "2026-06-09T14:00:00Z",
  "summary": "Reunión con Director General y equipo de compras",
  "discovery": "Presupuesto aprobado, decisión en 2 semanas",
  "agreement": "Enviar contrato preliminar",
  "nextStep": "Seguimiento telefónico en 1 semana",
  "nextDate": "2026-06-16",
  "nextTime": "11:00"
}
```

**Deals en Pipeline** (seller1):
```json
// Deal en Propuesta
{
  "clientId": "<client_abc_id>",
  "sellerId": "<seller1_id>",
  "stage": "Propuesta",
  "amount": 150000,
  "probability": 50,
  "title": "Implementación Tracker Sales OS",
  "description": "Sistema CRM para equipo de 5 vendedores"
}
```

**Ventas** (seller1):
```json
// Venta tipo Seller
{
  "type": "Seller",
  "clientType": "Nuevo",
  "product": "Tracker Sales OS - Plan Enterprise",
  "units": 5,
  "amount": 180000,
  "paymentMethod": "Pagado",
  "origin": "Prospección propia",
  "closedAt": "2026-06-05",
  "sellerId": "<seller1_id>"
}
```

---

## Checklist de Testing Manual

### Feature 06-tasks (2 checkpoints)
- [ ] Frontend: página Agenda muestra tareas con estado visual
  - Ruta: `/agenda`
  - Verificar: Lista de tareas del día, tarjetas con título/descripción/tipo
- [ ] Tareas vencidas marcadas visualmente en rojo
  - Verificar: Tarea con scheduledAt < hoy aparece en rojo o con indicador visual

### Feature 07-pipeline (2 checkpoints)
- [ ] AuditInterceptor registra old_values y new_values
  - Verificar: Cambiar stage de un deal y revisar si hay logs de auditoría
- [ ] Frontend: vista Kanban con 7 columnas
  - Ruta: `/pipeline`
  - Verificar: 7 columnas visibles, deals renderizados, cambio de stage funcional

### Feature 08-sales (2 checkpoints)
- [ ] Cálculo correcto de unidades nuevas vs existentes
  - Crear venta con clientType="Nuevo" y otra con "Existente"
  - Verificar en dashboard o reportes que se suman correctamente
- [ ] Frontend: 3 formularios independientes por tipo de venta
  - Ruta: `/ventas`
  - Verificar: 3 tabs (Seller, ATC, Dirección) con formularios diferenciados

### Feature 09-dashboard (1 checkpoint)
- [ ] Frontend: dashboard muestra métricas + semáforo visual
  - Ruta: `/dashboard`
  - Verificar: KPIs globales del mes, tabla de vendedores con score y color

### Feature 11-coaching (2 checkpoints)
- [ ] Frontend: página Coaching muestra reporte por vendedor
  - Ruta: `/coaching`
  - Verificar: Reporte diario con mix de actividades, puntos, calidad
- [ ] Admin y Director pueden ver reporte de cualquier seller
  - Login como director1 → ver selector de vendedor
  - Login como seller1 → ver solo reporte propio

### Feature 13-reports (1 checkpoint)
- [ ] Frontend: página Reportes con tabla y métricas del mes
  - Ruta: `/reportes`
  - Verificar: Selector de mes, tabla consolidada por tipo de venta

### Feature 14-settings (1 checkpoint)
- [ ] Frontend: página Configuración con formulario de settings
  - Ruta: `/configuracion`
  - Login como admin → formulario editable
  - Login como director1 → solo lectura o sin acceso

---

## Instrucciones de Testing

1. Abrir http://localhost:3001 en navegador
2. Login con cada rol (admin, director1, seller1)
3. Navegar a cada ruta listada arriba
4. Verificar checkpoints visuales
5. Documentar hallazgos en `progress/manual_testing_results.md`

---

## Próximos Pasos

1. Ejecutar setup de usuarios y datos de prueba (vía Swagger o cURL)
2. Ejecutar checklist de testing manual
3. Documentar resultados y screenshots (si aplica)
4. Actualizar CHECKPOINTS.md con resultados
5. Marcar features como fully verified

---

**Estado**: Setup documentado, requiere ejecución manual
