# UI Review: CSS + Activities + Tasks + Routing

## CSS Base (`frontend/src/index.css`)

### Clases PRESENTES del spec ✅
- `.card` — border, rounded-xl, white background
- `.input` — form inputs con tracker-border styling
- `.btn-primary` — dark navy (#002B49)
- `.btn-green` — brand green (#82bc00)
- `.btn-ghost` — light gray secondary
- `.btn-danger` — red danger
- `.tag`, `.tag-navy`, `.tag-green`, `.tag-amber`, `.tag-red`, `.tag-gray`, `.tag-purple`
- `.kpi-strip`, `.kpi-cell`, `.kpi-cell.ac`
- `.prog`, `.prog-fill`
- `.seller-row`
- `.log-card`
- `.slabel`
- `.ai-box` — purple AI coach box
- `.empty-state` — dashed border centered
- `.modal-blur` — backdrop-filter blur
- Custom scrollbar styling ✅

### Clases FALTANTES en CSS ❌
- `.navbtn` — no definida (sidebar navigation button)
- `.pipe-col` — no definida (pipeline column container)
- `.pipe-col-h` — no definida (pipeline column header)
- `.alert-item.navy/green/red/amber` — solo `.alert-item` base, sin modificadores directos

### Observaciones
- CSS usa Tailwind + CSS custom properties (tracker-* variables, OKLch color system)
- Sin conflictos Tailwind vs clases custom
- Sistema de colores consistente con brand palette

---

## Activities Module

### ActivitiesPage.tsx
- Muestra actividades del día con badge de puntos (#EEFAD4 bg, #4a7c00 color) ✅
- Progress bar con escala de color (verde ≥100%, amber ≥50%, rojo <50%) ✅
- Usa `.log-card` para filas ✅
- Calidad % con progress bar ✅
- **Cambio reciente**: captura `taskTitle` de search params → pasa a ActivityForm como `programmedTask`

### ActivityForm.tsx — 5 campos del spec PRESENTES ✅
1. **Resumen** — textarea, requerido, >20 chars = 20pts calidad
2. **Descubrimiento** — opcional, >15 chars = 20pts
3. **Acuerdo** — opcional, >15 chars = 20pts
4. **Siguiente paso** — condicional requerido (needsNextStep = true para Llamada/Reunión/Visita/Propuesta)
5. **Tipo de actividad** — con display de puntos por tipo

**Campos adicionales:** Cliente, Contacto, Resultado (8 opciones), Etapa pipeline, Fecha/hora ejecución, Próxima fecha/hora

**Cambios recientes:**
- Nuevo prop `programmedTask` — muestra campo readonly "Tarea programada" con título de tarea completada
- Nuevo campo `nextObjective` (opcional) — en grid 2 cols junto a nextStep
- "Hora de captura" readonly con timestamp actual
- Mensajes coach contextuales por tipo de actividad

### activities.types.ts — cambios recientes
- Añadido `nextObjective: string | null` en Activity interface
- Añadido `nextObjective?: string` en CreateActivityInput

---

## Tasks/Agenda Module

### AgendaPage.tsx
- Título: "Compromisos comerciales"
- Cards con: ClientName · Type · ContactName, título, AI comment, fecha/hora, estado
- Tarea vencida: borde rojo si `task.isOverdue && status === 'Pendiente'` ✅
- Empty state con dashed border ✅

**Flujo de completar tarea:**
1. Click "Completar" en tarea
2. Llama `completeTask` mutation
3. On success → navega a `/actividades/nueva?clientId=X&taskTitle=Y`
4. ActivitiesPage recibe params → pre-llena ActivityForm con título de tarea

**Cambios recientes:**
- Captura título de tarea antes de mutation para pasarlo a navegación
- Manejo de errores con estado `createError` + display en red box

### CreateTaskForm.tsx
**Campos:** Cliente, Tipo (11 tipos), Contacto, Objetivo (requerido, max 200 chars), Fecha, Hora
- AI coaching contextual por tipo + objetivo
- **Cambio reciente**: prop `error` para mostrar errores de API, maxLength 500→200

### useCreateTask.ts — cambios recientes
- Validación: `if (!sellerId) throw new Error('Sin sesión de vendedor activa')`
- Error propagado al form

### useTodayTasks.ts — cambios recientes
- Helper `localDateISO()` para formateo consistente de fecha local
- Usa `localDate` en lugar de `date` raw — corrige bugs de timezone

---

## Routing

| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/` | redirect | → /dashboard si auth, → /login si no |
| `/login` | LoginPage | Auth |
| `/dashboard` | DashboardPage | Overview |
| `/agenda` | AgendaPage | Tareas del día |
| `/actividades/nueva` | ActivitiesPage | Registrar actividad (acepta `?clientId&taskTitle`) |
| `/clientes` | ClientesPage | Gestión clientes |
| `/pipeline` | PipelinePage | Kanban pipeline |
| `/mi-dia` | MiDiaPage | Vista operativa personal |
| `/equipo` | EquipoPage | Equipo y usuarios |
| `/ventas` | SalesPage | Ventas |
| `/coaching` | CoachingPage | Coaching |
| `/reportes` | ReportsPage | Reportes ejecutivos |
| `/configuracion` | SettingsPage | Configuración |
| `/import-export` | ImportExportPage | Respaldo datos |

**Estado de routing:** ✅ Sin rutas huérfanas, sin componentes sin ruta, flujo agenda→actividades correcto.

---

## Resumen

**CSS:** 3 clases críticas faltantes en la hoja de estilos: `.navbtn`, `.pipe-col`, `.pipe-col-h`. El resto del design system está definido.

**Activities + Tasks:** Código en buen estado. Flujo tarea→actividad funciona. Cambios recientes añaden: nextObjective, programmedTask prop, error handling, timezone fix.

**Routing:** Completo y correcto.
