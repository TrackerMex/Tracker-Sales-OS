# Bugs Tracker — Tracker Sales OS

**Última actualización**: 2026-06-09
**Reportados por**: Agente Implementer/Tester (Feature 17 - Integration Testing)

---

## Bug #1: Mi Día no usa configuración dinámica de dailyMinPoints

**Severidad**: MEDIA
**Estado**: ABIERTO
**Fecha detectado**: 2026-06-09

### Descripción
El endpoint `GET /api/dashboard/mi-dia/seller/:id` retorna un valor hardcoded de `dailyPointsGoal: 30` en lugar de obtener el valor dinámicamente desde Settings.

### Feature afectada
- **10-mi-dia**: Mi Día (Termómetro Operativo)
- **14-settings**: Settings

### Ruta afectada
`GET /api/dashboard/mi-dia/seller/:id`

### Archivo
`/c/Users/Programador/Documents/sites/tracker-sales-os/backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts:109`

### Código problemático
```typescript
return {
  sellerId,
  sellerName: seller.name,
  pointsToday,
  dailyPointsGoal: 30,  // ← HARDCODED (debería venir de Settings)
  callsToday,
  dailyCallsGoal: 10,   // ← También hardcoded
  // ...
};
```

### Pasos para reproducir
1. Autenticarse como Admin
2. Ejecutar `PATCH /api/settings` con body:
   ```json
   {
     "dailyMinPoints": 40
   }
   ```
3. Autenticarse como Seller
4. Ejecutar `GET /api/dashboard/mi-dia/seller/{sellerId}`
5. Observar response:
   ```json
   {
     "dailyPointsGoal": 30,  // ← Debería ser 40
     ...
   }
   ```

### Comportamiento esperado
- Mi Día debe obtener `dailyMinPoints` desde Settings dinámicamente
- Cuando Admin cambia la meta diaria a 40, Mi Día debe reflejar ese valor

### Comportamiento actual
- Mi Día retorna valor hardcoded `dailyPointsGoal: 30`
- No respeta cambios en configuración

### Impacto
- **Usuarios**: Sellers ven meta incorrecta en su termómetro operativo
- **Business**: El semáforo calcula correctamente (usa % relativo), pero la UI muestra meta incorrecta
- **UX**: Confusión cuando Admin cambia metas y no se reflejan

### Fix sugerido
1. Inyectar `SettingsService` o `GetSettingsUseCase` en `GetMiDiaUseCase`
2. Obtener settings antes de calcular el DTO
3. Usar `settings.dailyMinPoints` en lugar de hardcoded 30
4. Usar `settings.dailyCallsGoal` (si existe) o mantener 10 como default

**Código sugerido**:
```typescript
// En GetMiDiaUseCase constructor
constructor(
  @InjectRepository(ActivityTypeormEntity)
  private readonly activityRepo: Repository<ActivityTypeormEntity>,
  // ... otros repos
  @Inject(GET_SETTINGS_USE_CASE)  // ← Nuevo
  private readonly getSettings: GetSettingsUseCase,
) {}

// En execute()
async execute(sellerId: string): Promise<MiDiaDto> {
  // Obtener settings dinámicamente
  const settings = await this.getSettings.execute();

  // ... resto del código

  return {
    sellerId,
    sellerName: seller.name,
    pointsToday,
    dailyPointsGoal: settings.dailyMinPoints ?? 30,  // ← Dinámico con fallback
    callsToday,
    dailyCallsGoal: settings.dailyCallsGoal ?? 10,   // ← Dinámico con fallback
    // ...
  };
}
```

### Archivos a modificar
1. `backend/src/modules/dashboard/application/use-cases/get-mi-dia.use-case.ts`
2. `backend/src/modules/dashboard/dashboard.module.ts` (providers para inyectar GetSettingsUseCase)

### Checkpoint afectado
CHECKPOINTS.md línea 203:
- [ ] **Settings**: Cambiar dailyMinPoints → Mi Día refleja nueva meta

---

## Bug #2: Feature 12 (AI Coach) no implementada

**Severidad**: ALTA (si es feature crítica) / BAJA (si es opcional)
**Estado**: ABIERTO / PENDIENTE DE DECISIÓN
**Fecha detectado**: 2026-06-09

### Descripción
El endpoint `POST /api/coaching/suggestion` lanza un error "Not implemented — feature 12" en lugar de llamar a Claude API.

### Feature afectada
- **12-ai-coach**: IA Coach (Claude API)

### Ruta afectada
`POST /api/coaching/suggestion`

### Archivo
`/c/Users/Programador/Documents/sites/tracker-sales-os/backend/src/modules/coaching/presentation/coaching.controller.ts:17-20`

### Código problemático
```typescript
@Post('suggestion')
getSuggestion(@Body() _dto: unknown) {
  throw new Error('Not implemented — feature 12');
}
```

### Pasos para reproducir
1. Ejecutar `POST /api/coaching/suggestion` con cualquier body
2. Recibir error 500: "Not implemented — feature 12"

### Comportamiento esperado
- Endpoint debe llamar a Claude API (Anthropic)
- Prompt debe incluir: tipo actividad, objetivo, cliente, stage del deal
- Response en < 3 segundos con sugerencia contextual
- Si API falla, retornar sugerencia por defecto según tipo de actividad

### Comportamiento actual
- Endpoint lanza error "Not implemented"

### Impacto
- **Usuarios**: Sellers no reciben sugerencias de IA al crear tareas/actividades
- **Business**: Feature de valor agregado no disponible
- **UX**: Funcionalidad prometida no funcional

### Fix sugerido
Implementar use-case `GenerateCoachingSuggestionUseCase` que:
1. Reciba `{ type, objective, client, dealStage }`
2. Construya prompt con contexto
3. Llame a Anthropic API con `claude-sonnet-4-6`
4. Parse response y retorne sugerencia
5. Maneje errores con fallback a sugerencias por defecto

### Checkpoints afectados (CHECKPOINTS.md líneas 129-137)
- [ ] `POST /api/coaching/suggestion` llama Claude API y retorna sugerencia
- [ ] Prompt incluye: tipo actividad, objetivo, cliente, stage del deal
- [ ] Response en < 3 segundos (o streaming)
- [ ] Manejo de errores: si API falla, retorna sugerencia por defecto
- [ ] ANTHROPIC_API_KEY en .env
- [ ] Frontend: sugerencia se muestra en formulario de tarea/actividad

### Nota
Feature marcada como `"status": "pending"` en `feature_list.json`. Requiere decisión de negocio si es crítica o puede posponerse.

---

## Posible Bug #3: AuditInterceptor no encontrado

**Severidad**: BAJA (depende de requerimientos)
**Estado**: REQUIERE VERIFICACIÓN
**Fecha detectado**: 2026-06-09

### Descripción
El checkpoint "AuditInterceptor registra old_values y new_values" (CHECKPOINTS.md línea 87) no pudo ser verificado. No se encontró evidencia de un AuditInterceptor global en el código.

### Feature afectada
- **07-pipeline**: Pipeline (Kanban)

### Checkpoint
CHECKPOINTS.md línea 87:
- [ ] AuditInterceptor registra old_values y new_values

### Pasos para verificar
1. Buscar en `backend/src/core/` o `backend/src/common/` un AuditInterceptor
2. Verificar si está registrado globalmente en `main.ts` o `app.module.ts`
3. Verificar si cambios de stage en deals se auditan en tabla `audit_logs`

### Comportamiento esperado
- Un interceptor global debe capturar cambios en entidades críticas
- Al cambiar stage de un deal, debe crear registro en `audit_logs` con:
  ```json
  {
    "entity": "deal",
    "entity_id": "uuid",
    "old_values": { "stage": "Prospecto" },
    "new_values": { "stage": "Contactado" },
    "user_id": "uuid",
    "action": "update",
    "created_at": "timestamp"
  }
  ```

### Comportamiento actual
- No se encontró AuditInterceptor en revisión de código
- No se verificó si existe tabla `audit_logs` poblada

### Impacto
- **Usuarios**: No afecta funcionalidad core
- **Business**: Falta de auditoría puede dificultar troubleshooting
- **Compliance**: Algunos negocios requieren audit trail completo

### Fix sugerido (si se confirma que falta)
1. Crear `AuditInterceptor` en `backend/src/core/infrastructure/interceptors/`
2. Interceptar todos los updates/deletes de TypeORM
3. Comparar `old_values` vs `new_values`
4. Insertar en tabla `audit_logs`
5. Registrar globalmente en `app.module.ts`

### Archivos a revisar
- `backend/src/core/infrastructure/interceptors/` (¿existe?)
- `backend/src/app.module.ts` (providers globales)
- `backend/src/main.ts` (useGlobalInterceptors)
- DB schema: verificar si tabla `audit_logs` existe

### Estado
**REQUIERE DECISIÓN**: ¿Es requerimiento obligatorio o nice-to-have?

---

## Resumen de Bugs

| Bug | Severidad | Estado | Feature | Prioridad Fix |
|-----|-----------|--------|---------|---------------|
| #1: Mi Día settings hardcoded | MEDIA | ABIERTO | 10, 14 | ALTA |
| #2: AI Coach no implementado | ALTA/BAJA | PENDIENTE | 12 | DEPENDE |
| #3: AuditInterceptor no verificado | BAJA | VERIFICAR | 07 | MEDIA |

---

## Notas de Testing
- Bugs detectados durante Feature 17 (Integration Testing)
- Backend compilación: PASS (sin errores TypeScript)
- Frontend compilación: PASS (sin errores TypeScript)
- Docker: Todos los servicios UP y funcionales
- **Testing pendiente**: Pruebas manuales E2E en UI con diferentes roles

---

**Reportado por**: Agente Implementer/Tester
**Fecha**: 2026-06-09
