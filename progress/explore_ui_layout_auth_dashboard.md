# UI Review: Layout + Auth + Dashboard

## Sidebar.tsx
**Estado actual:**
- Estructura correcta (logo, secciones, nav items, footer)
- **PROBLEMA CRÍTICO**: 100% estilos inline, NO usa ninguna clase del spec
- Iconos SVG inline, sin clase `.ni`
- Active indicator usa `<span>` en lugar de pseudo-elemento `::before`
- Hover manejado con `onMouseEnter/Leave` en lugar de `:hover` CSS
- Sin uso de `.navbtn`, `.sb-logo`, `.sb-section`, `.sb-footer`

**Gaps vs spec:**
1. ❌ No usa clase `.navbtn` — completamente inline
2. ❌ No usa `.sb-logo` — padding y estilos inline
3. ❌ No usa `.sb-section` — estilos inline
4. ❌ No usa `.ni` para iconos
5. ❌ Active indicator es `<span>` no `::before` pseudo-element
6. ❌ Hover interactividad es React (JS) no CSS
7. ⚠️ Icono SVG tiene strokeWidth="2" en lugar de "1.6" del spec

---

## Header.tsx
**Estado actual:**
- Height 54px ✓, bg white ✓, border-bottom ✓
- Usa mezcla de Tailwind + inline styles
- Botones Action (Tarea, Prospecto, Registrar actividad) con estilos inline duplicados

**Gaps vs spec:**
1. ❌ Botones NO usan clases `.btn-ghost` o `.btn-green` — usan inline
2. ⚠️ Mezcla Tailwind (`className="flex h-[54px]..."`) con inline styles
3. ❌ Botón "Registrar actividad" debería ser `.btn-green`
4. ⚠️ Botones "Tarea" y "Prospecto" deberían ser `.btn-ghost`

---

## AppLayout.tsx
**Estado actual:**
- Sidebar 216px ✓
- Body bg #EEF2F7 ✓
- Content area scrollable (overflow-y-auto) ✓

**Evaluación:** ✅ Funcional y completo. Mezcla Tailwind + inline menor.

---

## LoginPage.tsx
**Estado actual:**
- Left panel 300px, #001524 ✓
- Right panel flex ✓
- Inputs tienen clase `.input` PERO también estilos inline duplicados
- Submit button usa estilos inline en lugar de clase `.btn-green`

**Gaps vs spec:**
1. ⚠️ Inputs usan clase `.input` pero TAMBIÉN tienen estilos inline (duplicación)
2. ❌ Submit button NO usa clase `.btn-green` — estilos inline
3. ⚠️ Credenciales hint box usa estilos inline

---

## DashboardPage.tsx
**Estado actual:**
- Estructura correcta: KPIStrip + Activity chart + Alerts + SellerTable
- Activity chart: **usa SVG custom en lugar de Chart.js**
- Usa clase `.card` para containers

**Gaps vs spec:**
1. ❌ **CRÍTICO**: Spec pide Chart.js (`chart.js` + `react-chartjs-2`), implementa SVG custom
2. ⚠️ Sin opciones interactivas de tooltip (#001524 bg, #82bc00 title)
3. ⚠️ Mix de Tailwind con inline styles

---

## KPIStrip.tsx
**Evaluación:** ✅ **100% alineado**
- Usa `.kpi-strip`, `.kpi-cell.ac`, `.kl`, `.kv`, `.ksb` correctamente

---

## SellerSemaphoreTable.tsx
**Evaluación:** ✅ Funcional, ~93% alineado
- Usa `.seller-row`, `.prog`, `.prog-fill` ✓
- Colores correctos: #82bc00 (≥75%), #F59E0B (≥45%), #EF4444 (<45%) ✓
- ⚠️ Badge styling con Tailwind en lugar de clase custom
- ⚠️ Metadata con inline styles

---

## AlertsPanel.tsx
**Estado actual:**
- Usa `className="alert-item"` ✓
- **PROBLEMA**: Genera clase dinámica `alert-item--${color}` — spec pide `.alert-item.red` (modificador directo)

**Gaps vs spec:**
1. ❌ Usa `alert-item--red/green/navy/amber` en lugar de `.alert-item.red` etc.
2. ⚠️ Estilos de texto color vía inline style

---

## Resumen de Gaps por Severidad

### Críticos
1. **Sidebar**: 100% inline, cero clases del spec — refactor completo necesario
2. **DashboardPage**: Chart.js no instalado ni usado — SVG custom en su lugar
3. **AlertsPanel**: Clase dinámica incorrecta (`alert-item--X` vs `.alert-item.X`)

### Altos
4. **Header**: Botones usan inline, no `.btn-ghost`/`.btn-green`
5. **LoginPage**: Submit button inline, no `.btn-green`

### Medios
6. Mix generalizado de Tailwind + inline styles en AppLayout, Header, Dashboard

### Menores
7. Sidebar: SVG strokeWidth="2" vs "1.6"
8. Sidebar: active indicator usa `<span>` vs `::before`

---

## Estado de Cumplimiento

| Componente | CSS Clases | Estructura | Funcionalidad | %Alineado |
|---|---|---|---|---|
| Sidebar | ❌ 0% | ⚠️ 60% | ✅ 100% | **20%** |
| Header | ❌ 10% | ⚠️ 70% | ✅ 100% | **60%** |
| AppLayout | ✅ 100% | ✅ 100% | ✅ 100% | **100%** |
| LoginPage | ⚠️ 30% | ✅ 100% | ✅ 100% | **75%** |
| DashboardPage | ⚠️ 40% | ⚠️ 80% | ⚠️ 70% | **63%** |
| KPIStrip | ✅ 100% | ✅ 100% | ✅ 100% | **100%** |
| SellerSemaphoreTable | ✅ 100% | ⚠️ 80% | ✅ 100% | **93%** |
| AlertsPanel | ⚠️ 50% | ⚠️ 70% | ✅ 100% | **73%** |
