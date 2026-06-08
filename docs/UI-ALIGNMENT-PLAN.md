# Plan de Alineación UI: React Frontend = Standalone HTML

**Objetivo**: Hacer que el frontend React sea visualmente idéntico al `Tracker Sales OS - Standalone.html`

**Total archivos**: ~20 | **Esfuerzo estimado**: 4-6 horas

---

## Fase 1: CSS Foundation (`frontend/src/index.css`)

Verificar que todas las clases del standalone estén definidas. Agregar las que falten:

### Clases de layout
```css
/* Ya existentes - verificar que coincidan */
.card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; }
.modal-blur { position: fixed; inset: 0; z-index: 100; backdrop-filter: blur(8px); background: rgba(0,21,36,0.55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; font-weight: 500; color: #94A3B8; background: #F8FAFC; border-radius: 8px; border: 1.5px dashed #E2E8F0; }
.locked { filter: blur(3px); pointer-events: none; user-select: none; }
```

### Clases de botones
```css
.btn-primary { background: #002B49; color: #fff; padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; transition: background 0.12s; }
.btn-primary:hover { background: #001E35; }

.btn-green { background: #82bc00; color: #001524; padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; transition: background 0.12s; }
.btn-green:hover { background: #6da000; }

.btn-ghost { background: #F1F5F9; color: #475569; padding: 7px 13px; border-radius: 7px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; transition: background 0.12s; }
.btn-ghost:hover { background: #E2E8F0; }

.btn-danger { background: #FEE2E2; color: #B91C1C; padding: 7px 10px; border-radius: 7px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
```

### Clase de input
```css
.input { display: block; width: 100%; padding: 8px 11px; border-radius: 7px; background: #F8FAFC; font-size: 13px; font-weight: 500; outline: none; border: 1.5px solid #E2E8F0; color: #0F172A; font-family: inherit; transition: border-color 0.12s, background 0.12s; }
.input:focus { border-color: #82bc00; background: #fff; }
textarea.input { resize: vertical; }
select.input { cursor: pointer; }
```

### Clases de KPI
```css
.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #E2E8F0; gap: 1px; }
.kpi-cell { background: #fff; padding: 18px 20px; }
.kpi-cell.ac { background: #001524; }
.kl { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; }
.kv { font-size: 22px; font-weight: 700; color: #0F172A; margin-top: 5px; letter-spacing: -0.02em; line-height: 1.1; }
.ksb { font-size: 11px; color: #94A3B8; margin-top: 4px; font-weight: 400; }
.kpi-cell.ac .kl { color: #82bc00; }
.kpi-cell.ac .kv { color: #fff; }
.kpi-cell.ac .ksb { color: rgba(255,255,255,0.35); }
```

### Clases de progress bar
```css
.prog { height: 5px; background: #F1F5F9; border-radius: 99px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 99px; transition: width 0.4s; }
```

### Clases de pipeline
```css
.pipe-col { min-width: 252px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; }
.pipe-col-h { font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; padding-bottom: 9px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; }
```

### Clases de seller row
```css
.seller-row { padding: 12px 14px; border-radius: 9px; background: #F8FAFC; border: 1px solid transparent; transition: border-color 0.12s; }
.seller-row:hover { border-color: #E2E8F0; }
```

### Clases de alert item
```css
.alert-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 13px; border-radius: 8px; }
.alert-item.navy { background: #EFF6FF; }
.alert-item.green { background: #F0FDF4; }
.alert-item.red { background: #FEF2F2; }
.alert-item.amber { background: #FFFBEB; }
```

### Clases de sidebar
```css
.navbtn { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 9px; border: none; background: none; border-radius: 7px; cursor: pointer; color: rgba(255,255,255,0.48); font-size: 12.5px; font-weight: 500; text-align: left; font-family: inherit; margin-bottom: 1px; transition: background 0.12s, color 0.12s; position: relative; }
.navbtn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.88); }
.navbtn.active { background: rgba(130,188,0,0.13); color: #fff; }
.navbtn.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; background: #82bc00; border-radius: 0 2px 2px 0; }
.ni { width: 14px; height: 14px; opacity: 0.55; }
.navbtn.active .ni { opacity: 1; color: #82bc00; }
.sb-section { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.15em; padding: 14px 8px 5px; }
.sb-logo { padding: 18px 14px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.sb-footer { padding: 10px 8px 12px; border-top: 1px solid rgba(255,255,255,0.06); }
```

### Clases de AI box
```css
.ai-box { background: #F5F3FF; border: 1px solid #EDE9FE; color: #6D28D9; border-radius: 8px; padding: 10px 13px; font-size: 12px; font-weight: 500; line-height: 1.55; }
```

### Scrollbar personalizada
```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
```

---

## Fase 2: Sidebar (`frontend/src/shared/components/layout/Sidebar.tsx`)

Reescribir usando clases CSS en lugar de estilos inline.

**Cambios clave:**
- Logo area: clase `.sb-logo`
- Section labels: clase `.sb-section`
- Nav buttons: clase `.navbtn` con `.active` + `.ni` para iconos
- Active indicator: `::before` pseudo-element (ya en CSS)
- Footer: clase `.sb-footer` con select
- Iconos SVG inline (14x14, stroke="currentColor", stroke-width="1.6")

**Referencia del standalone:**
```html
<div class="sb-logo">
  <img src="logo" style="height:30px; object-fit:contain">
  <div style="margin-top:7px; font-size:8.5px; font-weight:700; color:#82bc00; text-transform:uppercase; letter-spacing:0.2em">STANDALONE</div>
</div>
<div class="sb-section">PRINCIPAL</div>
<button class="navbtn active">
  <svg class="ni" ...>...</svg>
  Dashboard
</button>
<!-- ... más nav items ... -->
<div class="sb-footer">
  <select>Rol selector</select>
</div>
```

---

## Fase 3: Header (`frontend/src/shared/components/layout/Header.tsx`)

**Especificación:**
- Height: 54px, bg: #fff, border-bottom: 1px solid #E2E8F0
- Padding: 0 20px
- Title: font-size 14px, font-weight 700, color #0F172A
- Subtitle: font-size 11px, color #94A3B8, margin-top 1px
- Actions: display flex, gap 6px
- Botones: `.btn-ghost` o `.btn-green`

---

## Fase 4: AppLayout (`frontend/src/shared/components/layout/AppLayout.tsx`)

**Especificación:**
```
<div id="app-layout" style="display:flex; height:100vh">
  <div id="app-sidebar" style="width:216px; min-width:216px; bg:#001524; flex-direction:column; overflow:hidden; flex-shrink:0">
    <Sidebar />
  </div>
  <div id="app-main" style="flex:1; min-width:0; flex-direction:column">
    <Header />
    <div id="content-area" style="flex:1; overflow-y:auto; padding:20px">
      <Outlet />
    </div>
  </div>
</div>
```

- Background: `#EEF2F7` (body)
- Sidebar: fijo 216px, no colapsable
- Content area: scroll independently

---

## Fase 5: Login (`frontend/src/modules/auth/presentation/pages/LoginPage.tsx`)

**Reescribir con clases CSS:**

**Left panel (300px):**
- Background: `#001524`, padding: 36px 28px
- Logo: height 32px
- Tagline: color `rgba(255,255,255,0.42)`, font-size 12.5px
- Feature items: flex, gap 10px
  - Icon box: 18x18, bg `rgba(130,188,0,0.2)`, border-radius 5px
  - Text: color `rgba(255,255,255,0.6)`, font-size 12.5px

**Right panel (flex:1):**
- Padding: 36px 32px
- Title: font-size 22px, font-weight 800
- Subtitle: font-size 13px, color `#64748B`
- Inputs: usar `.input` class
- Submit: `.btn-green`, width 100%, padding 10px
- Hint box: padding 13px 14px, bg `#F8FAFC`, border `#E2E8F0`, font-size 11.5px

---

## Fase 6: Dashboard

### KPIStrip.tsx
Usar `.kpi-strip`, `.kpi-cell`, `.kpi-cell.ac`, `.kl`, `.kv`, `.ksb`

### SellerSemaphoreTable.tsx
Usar `.seller-row`, `.prog`, `.prog-fill`
- Row hover: border-color `#E2E8F0`
- Progress colors: >=75% `#82bc00`, >=45% `#F59E0B`, <45% `#EF4444`

### AlertsPanel.tsx
Usar `.alert-item` con modificadores `.navy`, `.green`, `.red`, `.amber`

### DashboardPage.tsx - Chart.js
Integrar Chart.js para gráfico de actividad (14 días):
```javascript
{
  type: 'line',
  data: { labels: [...], datasets: [{ 
    borderColor: '#82bc00',
    backgroundColor: 'rgba(130,188,0,0.08)',
    borderWidth: 2, fill: true, tension: 0.35,
    pointRadius: 3.5, pointBackgroundColor: '#82bc00',
    pointBorderColor: '#fff', pointBorderWidth: 1.5
  }]},
  options: {
    plugins: { tooltip: { backgroundColor: '#001524', titleColor: '#82bc00', bodyColor: '#fff' }},
    scales: { x: { grid: { display: false }}, y: { beginAtZero: true }}
  }
}
```

---

## Fase 7: Mi Dia (`frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx`)

**Cambios:**
- KPI cells: usar `.kpi-strip` con 4 columnas
- Metric cards: estilo `.kpi-cell` con progress bars
- Semaphore: badge visual con color
- Coach tips: usar `.ai-box`
- Overdue alert: bg `#FEF2F2`, border `#FCA5A5`

---

## Fase 8: Clientes (`frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`)

**Cambios:**
- Cards: usar `.card` class
- Tags: usar `.tag`, `.tag-navy`, `.tag-green`, etc.
- Detail sidebar: bg `#001524`, border-radius 12px
- Contacts: bg `rgba(255,255,255,0.07)`, border-radius 7px
- Activity log: usar `.log-card`
- Modal: usar `.modal-blur`
- Empty state: usar `.empty-state`
- Form inputs: usar `.input`
- Section labels: usar `.slabel`
- AI suggestions: usar `.ai-box`

---

## Fase 9: Agenda + Actividades

### AgendaPage.tsx
- Task rows: border `1px solid #E2E8F0`, border-radius 9px
- Late tasks: border `1px solid #FCA5A5`, bg `#FFF5F5`
- Empty state: usar `.empty-state`
- Buttons: `.btn-ghost`, `.btn-green`

### ActivitiesPage.tsx
- Activity cards: usar `.log-card`
- Points badge: `rounded-full`, bg `#EEFAD4`, color `#4a7c00`
- Quality: progress bar `.prog` + `.prog-fill`

---

## Fase 10: Pipeline (`frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`)

**Cambios:**
- Columns: usar `.pipe-col`
- Column headers: usar `.pipe-col-h`
- Deal cards: `.card` con padding 14px
- Stage tags: usar `.tag` + modifier (`.tag-gray` Prospecto, `.tag-navy` Contactado, etc.)
- Modal: usar `.modal-blur` en vez de `bg-black/40`
- Container: `display: flex; gap: 11px; overflow-x: auto`

---

## Fase 11: Ventas (`frontend/src/modules/sales/presentation/pages/SalesPage.tsx`)

**Cambios:**
- Tabs: active tab `border-b-2 border-[#002B49]` (ya correcto)
- Form inputs: usar `.input`
- Sale type badges: usar `.tag-*`
- Summary cards: usar `.card`

---

## Fase 12: Coaching (`frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`)

**Cambios:**
- Insights: usar `.ai-box`
- Progress bars: usar `.prog` + `.prog-fill`
- Mini stats: bg `#F8FAFC`, border-radius 7px, text-center
- Labels: font-size 9.5px, font-weight 600, color `#94A3B8`, uppercase, letter-spacing 0.06em

---

## Fase 13: Reportes (`frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`)

**Cambios:**
- Tables: usar `.dt`, `.dt th`, `.dt td`
- Health score card: bg `#001524`, border-radius 9px, text-center
  - Label: font-size 10px, font-weight 700, color `rgba(255,255,255,0.4)`, uppercase
  - Value: font-size 36px, font-weight 800, color `#82bc00`
- AI panels:
  - Strengths: bg `#F0FDF4`, header color `#15803D`, text color `#166534`
  - Opportunities: bg `#FFF7ED`, header color `#C2410C`, text color `#9A3412`
  - Red Flags: bg `#FEF2F2`, header color `#B91C1C`, text color `#991B1B`
  - Recommendations: bg `#EDE9FE`, header color `#6D28D9`, text color `#5B21B6`

---

## Fase 14: Equipo + Settings + Import/Export

### EquipoPage.tsx
- Forms: usar `.input`, `.btn-primary`, `.btn-green`
- Sellers grid: `.seller-row` o `.card`
- Section labels: `.slabel`

### SettingsPage.tsx
- Inputs: usar `.input`
- Save button: `.btn-primary`
- Section labels: `.slabel`

### ImportExportPage.tsx
- Export button: `.btn-primary`
- Import area: `.empty-state` o dashed border
- File input styling

---

## Verificación Final

Después de cada fase, verificar:
1. `npm run typecheck` pasa
2. `npm run build` pasa
3. Comparar visualmente con el standalone HTML

## Instalar Chart.js (si no está)

```bash
cd frontend
npm install chart.js react-chartjs-2
```

---

## Resumen de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| bg-page | `#EEF2F7` | Fondo body |
| bg-sidebar | `#001524` | Sidebar, paneles oscuros |
| accent-green | `#82bc00` | Brand, activo, CTA |
| accent-navy | `#002B49` | Botones primarios, títulos |
| text-primary | `#0F172A` | Texto principal |
| text-secondary | `#475569` | Texto terciario |
| text-muted | `#64748B` | Texto secundario |
| text-subtle | `#94A3B8` | Labels, meta |
| border | `#E2E8F0` | Bordes generales |
| surface-alt | `#F8FAFC` | Inputs, tablas |
| surface | `#F1F5F9` | Ghost buttons, progress bg |
