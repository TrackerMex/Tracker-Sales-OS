# Manual Testing Results — Tracker Sales OS

**Fecha**: 2026-06-09
**Tester**: [Tu nombre]
**Duración**: [minutos]
**Navegador**: [Chrome/Firefox/Edge + versión]

---

## Resumen Ejecutivo

| Feature | Checkpoints | PASS | FAIL | PARTIAL | Total |
|---------|-------------|------|------|---------|-------|
| 06-tasks | 2 | 0 | 0 | 0 | 0/2 |
| 07-pipeline | 2 | 0 | 0 | 0 | 0/2 |
| 08-sales | 2 | 0 | 0 | 0 | 0/2 |
| 09-dashboard | 1 | 0 | 0 | 0 | 0/1 |
| 11-coaching | 2 | 0 | 0 | 0 | 0/2 |
| 13-reports | 1 | 0 | 0 | 0 | 0/1 |
| 14-settings | 1 | 0 | 0 | 0 | 0/1 |
| **TOTAL** | **11** | **0** | **0** | **0** | **0%** |

---

## Feature 06-tasks (Agenda de Tareas)

**Ruta probada**: http://localhost:3001/agenda
**Usuario**: seller1 / Seller123!

### Checkpoint 1: Página Agenda muestra tareas con estado visual

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [x] Página carga sin errores en consola
- [x] Lista de tareas del día visible
- [x] Cada tarea muestra: título, descripción, tipo, hora programada
- [x] Estado visual claro (pendiente/completada)

**Observaciones**:
```
El funcionamiento funciona bien al crear una tarea con el dia actual, pero cuando creo una tarea para el dia siguiente no los registra en la agenda, solo registra las tareas del dia actual pero como vencidas.
```

**Screenshots**: [ruta opcional]

---

### Checkpoint 2: Tareas vencidas marcadas visualmente en rojo

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [x] Tareas con scheduledAt < hoy tienen indicador visual diferente
- [x] Se distingue claramente de tareas pendientes normales

**Observaciones**:
```
Las tareas vencidas se ven en rojo y tienen un indicador visual diferente de las tareas pendientes normales. Estaria bueno agregar un indicador visual para las tareas vencidas para que sea más claro al igual que las tareas recien creadas. Al igual un filtro para mostrar tareas vencidas.
```

---

## Feature 07-pipeline (Kanban)

**Ruta probada**: http://localhost:3001/pipeline
**Usuario**: seller1 / Seller123!

### Checkpoint 1: Vista Kanban con 7 columnas

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [ ] Página carga sin errores
- [ ] 7 columnas visibles: Prospecto, Contactado, Interesado, Propuesta, Negociación, Cierre, Perdido
- [ ] Deals renderizados en sus columnas correspondientes
- [ ] Cambio de stage funcional (click o drag)

**Observaciones**:
```
En el frontend aparecen las 7 columnas, pero quiero suponer que se debe de agregar un scroll horizontal para ver todas las columnas, los deals no se ven y como se veo los deals registrados no puedo cambiar de stage.Ademas falta agregar mas funcionamiento al drag and drop. y tambien al diseño del prototipo. Url del prototipo: https://api.anthropic.com/v1/design/h/76j25EPCaGRqllO8EuC__g?open_file=Tracker+Sales+OS+-+Standalone.html
```

---

### Checkpoint 2: AuditInterceptor registra old_values y new_values

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL | [ ] ⏭️ SKIP (requiere DB)

**Verificación en DB**:
```bash
docker exec tracker-sales-db psql -U tracker -d tracker_sales_os -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;"
```

**Resultado del query**:
```
Resultado del query: ERROR:  relation "audit_logs" does not exist
LINE 1: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

**Observaciones**:
```
No existe la tabla audit_logs en la base de datos.
```

---

## Feature 08-sales (Ventas)

**Ruta probada**: http://localhost:3001/ventas
**Usuario**: seller1 / Seller123!

### Checkpoint 1: 3 formularios independientes por tipo de venta

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [ ] Página carga sin errores
- [x] 3 tabs visibles: "Seller", "ATC", "Dirección"
- [ ] Al cambiar de tab, el formulario cambia
- [ ] Cada formulario es funcional (se puede crear venta)

**Observaciones**:
```
Esta parte incluye al backend ya que no me dejo hacer el registro error Unauthorized, la pagina si carga en el frontend. y registro en las tabs al Registrar venta del día si funciona correctamente, Ventas Dirección no funciona correctamente, Registrar ATC no funciona correctamente. Y en la ui no esta por tabs los 3 formularios estan en la misma vista.
```

---

### Checkpoint 2: Cálculo correcto de unidades nuevas vs existentes

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL | [ ] ⏭️ SKIP (requiere datos)

**Pasos ejecutados**:
1. [x] Crear venta tipo "Seller" con clientType="Nuevo", units=5
2. [ ] Crear venta tipo "ATC" con clientType="Existente", units=3
3. [ ] Verificar en /dashboard o /reportes

**Verificaciones**:
- [x] Dashboard muestra "Unidades Nuevas: 5"
- [ ] Dashboard muestra "Unidades Existentes: 3"
- [ ] Total: 8 unidades

**Observaciones**:
```
[¿Se calculan correctamente las unidades nuevas vs existentes?]

Se calculan correctamente las unidades nuevas, pero las existentes no se actualizan correctamente porque no se registran correctamente en el backend.
```

---

## Feature 09-dashboard (Dashboard KPIs)

**Ruta probada**: http://localhost:3001/dashboard
**Usuario**: admin / admin123

### Checkpoint: Dashboard muestra métricas + semáforo visual

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [x] KPIs globales del mes visibles (monto total, unidades, puntos)
- [x] Tabla de vendedores con: Nombre, Score (0-100), Estado (color)
- [x] Semáforo funcional: verde ≥70%, ámbar 50-69%, rojo <50%
- [ ] Click en vendedor navega a detalle (opcional)

**Observaciones**:
```
[¿Se ven los KPIs? ¿El semáforo tiene colores correctos? ¿Qué falta?]

En el dashboard se ven los KPIs Venta del mes, Unidades, Puntos, Calidad promedio. Si visualizo la tabla de vendedores, el semaforo si muestra los colores correctamente, el click en un vendedor no navega a detalle y por ultimo la grafica no esta funcinando correctamente con los datos reales. 
```

---

## Feature 11-coaching (Coaching Comercial)

**Ruta probada**: http://localhost:3001/coaching

### Checkpoint 1: Página Coaching muestra reporte por vendedor

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Usuario**: director1 / Director123!

**Verificaciones**:
- [ ] Página carga sin errores
- [ ] Selector de vendedor visible (dropdown o lista)
- [ ] Reporte diario muestra: puntos del día, mix de actividades, calidad promedio
- [ ] Mix de actividades muestra % por tipo

**Observaciones**:
```
[¿Se ve el reporte? ¿El selector funciona? ¿Qué métricas aparecen?]
No se ve el reporte correctamente, no veo el selector de vendedor ni las métricas.
```

---

### Checkpoint 2: RBAC — Admin/Director ven todos, Seller solo el suyo

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Pruebas RBAC**:
1. [x] director1 → /coaching → ve selector de vendedor ✅
2. [x] seller1 → /coaching → NO ve selector, solo su reporte ✅
3. [x] seller1 → /coaching?sellerId=otro → recibe 403 Forbidden ✅

**Observaciones**:
```
[¿RBAC funciona correctamente? ¿Seller puede ver otros reportes?]
El perfil de director si se visualiza correctamente, pero el selector no aparece, y en el perfil de seller si funciona

```

---

## Feature 13-reports (Reportes Ejecutivos)

**Ruta probada**: http://localhost:3001/reportes
**Usuario**: admin / admin123

### Checkpoint: Página Reportes con tabla y métricas del mes

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [ ] Selector de mes visible (month picker)
- [ ] Tabla consolidada con columnas: Dirección, ATC, Vendedores
- [ ] Métricas del mes: monto total, unidades, metas vs logros
- [ ] Botón "Descargar JSON" o "Exportar" (opcional)

**Observaciones**:
```
[¿La tabla se ve? ¿El selector de mes funciona? ¿Qué métricas aparecen?]
No funciona correctamente, la tabla no se ve y el selector de mes no funciona. marca error de petición Error al cargar el reporte.

Failed to load resource: the server responded with a status of 500 (Internal Server Error)
reports.api.ts:6  GET http://localhost:3000/api/reports/monthly?month=2026-06 500 (Internal Server Error)
```

---

## Feature 14-settings (Configuración)

**Ruta probada**: http://localhost:3001/configuracion
**Usuario**: admin / admin123

### Checkpoint: Formulario de settings funcional y dinámico

**Estado**: [ ] ✅ PASS | [ ] ❌ FAIL | [ ] ⚠️ PARTIAL

**Verificaciones**:
- [x] Formulario con campos: dailyMinPoints, monthlyAmountGoal, monthlyUnitGoal, sellerMonthlyAmountGoal
- [x] Valores actuales cargados desde API
- [x] Botón "Guardar" funcional

**Prueba dinámica**:
1. [x] Cambiar `dailyMinPoints` de 30 a 40 → Guardar
2. [x] Login como seller1 → /mi-dia
3. [x] Verificar que meta ahora es 40 (no 30)

**Observaciones**:
```
[¿El formulario funciona? ¿Los cambios se reflejan en Mi Día?]

Esta parte funciona correctamente, los cambios se reflejan en Mi Día.
```

---

## Bugs Encontrados

### Bug #X: Mejorara el manejode configracion para cada rol, mostrar las taps correctas para cada usuario

**Feature**: Dashboard & KPIs
**Severidad**: ALTA
**Ruta afectada**: [URL]

**Descripción**:
```
El objetivo de este bug es mejorar el manejo de configuración para cada rol, mostrando las tabs correctas para cada usuario.
```

**Pasos para reproducir**:
1. [Paso 1]
2. [Paso 2]
3. [...]

**Comportamiento esperado**:
```
Mostrar las tabs correctas para cada usuario según su rol.
```

**Comportamiento actual**:
```
Las tabs se muestran incorrectamente para algunos usuarios.
```

**Screenshots**: [ruta]

---

## Notas Generales

**Performance**:
- [x] Páginas cargan en < 2 segundos
- [ ] Sin errores en consola del navegador
- [x] Sin warnings de TypeScript en Network tab

**UX**:
- [x] Navegación intuitiva
- [x] Mensajes de error claros
- [ ] Loading states visibles

**Compatibilidad**:
- [x] Navegador: [Chrome/Firefox/Edge + versión]
- [ ] Resolución: [1920x1080 / 1366x768 / etc.]

**Observaciones adicionales**:
```
[Cualquier otro hallazgo relevante]
```

---

## Conclusión

**Checkpoints PASS**: 0/11 (0%)
**Checkpoints FAIL**: 0/11 (0%)
**Checkpoints PARTIAL**: 0/11 (0%)

**Recomendaciones**:
```
Trabaja desde feature 1 a feature 14 y bugs
```

---

**Fin del reporte**
