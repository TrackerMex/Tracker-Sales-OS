# UI Review: Páginas Principales

## MiDiaPage.tsx
- **Clases CSS:** Mix inline + `.card`, `.slabel`, `.tag`, `.btn-green`, `.btn-primary`, `.ai-box`
- **Datos:** REALES (useMiDia, useTodayTasks, useCompleteTask)
- **Gaps:** NINGUNO — completamente alineado con spec
- **Estado:** ✅

---

## ClientesPage.tsx
- **Clases CSS:** Tailwind + `.card`, `.tag-*`, `.input`, `.modal-blur`, `.empty-state`, `.log-card`
- **Datos:** REALES (useClients, useCreateClient, useUpdateClient, useDeleteClient)
- **Gaps:** NINGUNO — completamente alineado
- **Estado:** ✅

---

## PipelinePage.tsx
- **Clases CSS:** Tailwind puro — falta `.pipe-col` y `.pipe-col-h` del spec
- **Datos:** REALES (usePipeline, useCreateDeal, useChangeStage)
- **Gaps:**
  - ❌ KanbanColumn usa Tailwind `w-64 shrink-0` en lugar de `.pipe-col`
  - ❌ Header de columna no usa `.pipe-col-h`
- **Estado:** ⚠️ Funciona visualmente, faltan clases del design system

---

## KanbanColumn.tsx
- **Clases CSS:** Tailwind puro (flex, w-64, shrink-0, rounded-lg, border)
- **Gaps:**
  - ❌ No usa `.pipe-col`
  - ❌ No usa `.pipe-col-h`
- **Estado:** ⚠️

---

## DealCard.tsx
- **Clases CSS:** Tailwind puro (space-y-2, rounded-lg, border, bg-white, p-3, shadow-sm)
- **Gaps:**
  - ⚠️ No usa clase `.card` del spec — Tailwind inline
- **Estado:** ⚠️ Menor

---

## SalesPage.tsx
- **Clases CSS:** Tailwind + `.card`, `.slabel`, `.input`, `.btn-green`, `.btn-primary`, `.tag`
- **Datos:** REALES (useCreateSale x3, useSales, useClients)
- **Gaps:**
  - ⚠️ Spec describe "tabs con active border-bottom" — implementado como 3 columnas grid (diferente visual, misma funcionalidad)
- **Estado:** ⚠️ Medio

---

## SaleFormBase.tsx
- **Clases CSS:** `.slabel`, `.input`, `.btn-primary` + Tailwind grid/gap
- **Datos:** Props-based (form puro)
- **Gaps:** NINGUNO
- **Estado:** ✅

---

## CoachingPage.tsx
- **Clases CSS:** Inline styles + `.card`, `.slabel`, `.tag` — falta `.ai-box`, `.prog`, `.prog-fill`
- **Datos:** REALES (useSellers, useCoachingDaily)
- **Gaps:**
  - ❌ Falta `.ai-box` para insights (mencionado explícitamente en spec)
  - ⚠️ No hay `.prog`/`.prog-fill` para progress bars — solo números
  - ⚠️ Mini stats no tienen bg #F8FAFC visible
- **Estado:** ❌ Crítico — falta sección visual de IA insights

---

## ReportsPage.tsx
- **Clases CSS:** Mix inline + Tailwind + `.card`, `.slabel`, `.kpi-strip`, `.kpi-cell`, `.dt`, `.prog`, `.prog-fill`
- **Datos:** REALES (useMonthlyReport)
- **Gaps:**
  - ❌ Spec menciona "4 paneles de IA con colores" (Fortalezas/Oportunidades/Red Flags/Recomendaciones) — NO existen en código
- **Estado:** ❌ Crítico — sección IA completamente ausente

---

## EquipoPage.tsx
- **Clases CSS:** Tailwind + `.input`, `.btn-primary`, `.btn-green`, `.slabel`
- **Datos:** REALES (useUsers, useSellers, useCreateSeller, useCreateUser, useBlockUser)
- **Gaps:**
  - ⚠️ No usa `.seller-row` del spec (usa div genérico)
  - ⚠️ `.slabel` no aplicado consistentemente
- **Estado:** ⚠️ Menor

---

## SettingsPage.tsx
- **Clases CSS:** Tailwind + `.input`, `.slabel`, `.btn-primary`, `.card`
- **Datos:** REALES (useSettings, useUpdateSettings)
- **Gaps:** NINGUNO
- **Estado:** ✅

---

## ImportExportPage.tsx
- **Clases CSS:** `.btn-primary`, `.empty-state`, `.card`, `.slabel` + Tailwind
- **Datos:** REALES (useExportData, useImportData)
- **Gaps:** NINGUNO
- **Estado:** ✅

---

## Resumen de gaps por severidad

### Críticos
1. **Pipeline - KanbanColumn + DealCard**: No usa `.pipe-col` ni `.pipe-col-h` — design system roto en pipeline
2. **Coaching**: Falta `.ai-box` para insights — sección visual no renderiza
3. **Reports**: "4 paneles de IA" (Fortalezas/Oportunidades/Red Flags/Recomendaciones) completamente ausentes en código

### Medios
4. **Sales**: Grid 3 columnas en lugar de tabs con active border-bottom
5. **Coaching**: Falta progress bars `.prog`/`.prog-fill` — solo números

### Menores
6. **Equipo**: Falta `.seller-row`
7. **Pipeline - DealCard**: Falta `.card`
8. **Equipo**: `.slabel` inconsistente

---

## Módulos completamente alineados
- MiDia ✅, Clientes ✅, SaleFormBase ✅, Settings ✅, ImportExport ✅
