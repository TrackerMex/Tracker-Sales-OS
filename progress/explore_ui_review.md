# UI Review Consolidado — Feature 16

**Fecha:** 2026-06-08  
**Fuentes:** 3 subagentes Explore (Layout/Auth/Dashboard, Páginas Principales, CSS/Activities/Tasks)

---

## Estado General: ~65% alineado con el UI-ALIGNMENT-PLAN

---

## Inventario de gaps por severidad

### CRÍTICOS — afectan design system o secciones ausentes

| # | Módulo | Gap | Impacto |
|---|--------|-----|---------|
| C1 | **Sidebar** | 100% estilos inline. Cero clases del spec (`.navbtn`, `.sb-logo`, `.sb-section`, `.sb-footer`, `.ni`). Active indicator usa `<span>` no `::before`. Hover en JS no CSS. | Design system completamente roto en nav principal |
| C2 | **CSS base** | `.navbtn`, `.pipe-col`, `.pipe-col-h` no existen en `index.css` — ningún componente puede usarlas | Sin definir = sin poder migrar Sidebar ni Pipeline |
| C3 | **Dashboard** | Chart.js no instalado. SVG custom en lugar de `chart.js + react-chartjs-2`. Sin tooltips de marca (#001524 bg, #82bc00 title) | Spec indica Chart.js explícitamente |
| C4 | **Reports** | "4 paneles IA" (Fortalezas/Oportunidades/Red Flags/Recomendaciones) completamente ausentes del código | Sección entera sin implementar |
| C5 | **AlertsPanel** | Genera `alert-item--red/green` en lugar de `.alert-item.red/.alert-item.green` — CSS no tiene esos modificadores dinámicos | Estilos de alertas no aplican |
| C6 | **Pipeline** | KanbanColumn y DealCard usan Tailwind puro. Ni `.pipe-col` ni `.pipe-col-h` usados. | Columnas Kanban no usan design system |
| C7 | **Coaching** | Falta `.ai-box` para insights. Sin `.prog`/`.prog-fill` para progress bars. Solo números sin visualización. | Sección de IA coaching sin diseño |

### MEDIOS — funcional pero visual incorrecto

| # | Módulo | Gap |
|---|--------|-----|
| M1 | **Header** | Botones (Tarea, Prospecto, Registrar actividad) con inline styles. Deben usar `.btn-ghost` y `.btn-green`. |
| M2 | **LoginPage** | Submit button con inline en lugar de `.btn-green`. Inputs con duplicación inline+clase. |
| M3 | **Sales** | Spec describe tabs con `border-b-2` activo. Implementado como 3 columnas grid — diferente visual. |
| M4 | **Coaching** | Mini stats no tienen bg #F8FAFC. Labels sin uppercasing/letter-spacing del spec. |

### MENORES — detalle visual

| # | Módulo | Gap |
|---|--------|-----|
| m1 | **Sidebar** | SVG strokeWidth="2" vs "1.6" del spec |
| m2 | **Equipo** | No usa `.seller-row`. `.slabel` inconsistente. |
| m3 | **Pipeline - DealCard** | No usa clase `.card` del spec |
| m4 | **AppLayout** | Mix menor de Tailwind + inline styles |

---

## Módulos completamente alineados ✅

| Módulo | Clases | Funcionalidad | Datos |
|--------|--------|---------------|-------|
| MiDia | ✅ | ✅ | Reales |
| Clientes | ✅ | ✅ | Reales |
| KPIStrip | ✅ | ✅ | Reales |
| SellerSemaphoreTable | ✅ | ✅ | Reales |
| AppLayout | ✅ | ✅ | — |
| Settings | ✅ | ✅ | Reales |
| ImportExport | ✅ | ✅ | Reales |
| SaleFormBase | ✅ | ✅ | Props |
| ActivityForm | ✅ | ✅ | Reales |
| AgendaPage | ✅ | ✅ | Reales |

---

## Plan de fixes sugerido (en orden)

### Paso 1 — Definir clases faltantes en CSS (sin tocar componentes)
- Añadir `.navbtn`, `.sb-logo`, `.sb-section`, `.sb-footer`, `.ni` a `index.css`
- Añadir `.pipe-col`, `.pipe-col-h` a `index.css`
- Añadir `.alert-item.navy`, `.alert-item.green`, `.alert-item.red`, `.alert-item.amber` a `index.css`

### Paso 2 — Sidebar (refactor completo a clases)
- Reemplazar todos los inline styles con clases del spec

### Paso 3 — Header (botones a clases)
- `btn-ghost` para Tarea y Prospecto
- `btn-green` para Registrar actividad

### Paso 4 — AlertsPanel (clase correcta)
- Cambiar `alert-item--${color}` → `alert-item ${color}` para que CSS aplique

### Paso 5 — Pipeline (KanbanColumn + DealCard)
- KanbanColumn: `pipe-col` + `pipe-col-h`
- DealCard: clase `card`

### Paso 6 — Coaching (`.ai-box` + progress bars)
- Insights section con `.ai-box`
- Stats con `.prog`/`.prog-fill`

### Paso 7 — Reports (4 paneles IA)
- Implementar sección Fortalezas/Oportunidades/Red Flags/Recomendaciones con colores del spec

### Paso 8 — Dashboard (Chart.js)
- `npm install chart.js react-chartjs-2`
- Reemplazar SVG custom con `<Line>` de react-chartjs-2

### Paso 9 — Login + menores
- Submit button → `.btn-green`
- Equipo → `.seller-row`

---

## Funcionalidad conectada (datos reales vs mock)

**Todos los módulos usan datos reales de API.** No hay mocks en producción. Flujos clave verificados:
- Completar tarea → pre-llena formulario de actividad ✅
- Puntos TASK_POINTS calculados en backend ✅
- Calidad actividad 0-100% ✅
- Pipeline con 7 etapas y transiciones ✅
- Dashboard semáforo con score calculado ✅

---

## Checkpoints feature 16 — estado post-exploración

De los 14 checkpoints del CHECKPOINTS.md para feature 16:
- Clases CSS faltantes (`.navbtn`, `.pipe-col`, `.pipe-col-h`): pendiente de añadir
- Sidebar sin clases spec: pendiente
- Chart.js no instalado: pendiente
- 4 paneles IA en Reports: pendiente
- Resto de páginas renderizando: ✅ (verificado por análisis de código)
