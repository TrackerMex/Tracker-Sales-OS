# impl_16-ui-alerts-pipeline

## Changes applied

### AlertsPanel.tsx
- `frontend/src/modules/dashboard/presentation/components/AlertsPanel.tsx`
- Changed alert item className from `alert-item alert-item--${alert.color}` to `alert-item ${alert.color}`
- Now produces: `"alert-item navy"`, `"alert-item green"`, `"alert-item red"`, `"alert-item amber"`
- Color values were already typed as `'navy' | 'green' | 'red' | 'amber'` — no mapping needed

### KanbanColumn.tsx
- `frontend/src/modules/pipeline/presentation/components/KanbanColumn.tsx`
- Root div: replaced Tailwind classes with `className="pipe-col"`
- Header div: replaced dynamic Tailwind color classes with `className="pipe-col-h"`
- Removed unused `STAGE_HEADER_COLOR` record and `headerColor` variable
- Cards content div unchanged — retains `overflow-y-auto` and `max-h-[calc(100vh-220px)]`

### DealCard.tsx
- `frontend/src/modules/pipeline/presentation/components/DealCard.tsx`
- Root div: replaced Tailwind classes with `className="card" style={{ padding: '14px' }}`
- No logic changes
