# impl_11-coaching-redesign

Visual/UX polish pass on the existing Coaching Comercial tab. Feature 11-coaching was already `done`; no backend, types, or hooks touched. Only file edited: `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`.

## Changes

1. **Page header** — replaced the hand-rolled `<div className="card p-6 mb-6">` + `<h2 className="font-black ...">` header with the standard pattern used on Dashboard/Mi Día: `<h1 className="page-title">` + `<p className="page-subtitle">`, dropping the card wrapper to match `DashboardPage.tsx`'s plain flex header. Kept the "Mínimo diario" value in a trailing meta block on the same row.

2. **Points progress bar** — added a `.prog`/`.prog-fill` bar in `SellerCoachingCard`, under the seller name/points badge row, driven by `data?.progressPct` (falls back to `Math.min(100, Math.round((points/minDaily)*100))` when the field is undefined). Fill color: green (`var(--tracker-green)`) when `meetsMinimum`, amber (`#F59E0B`) when `>=50%`, red (`#EF4444`) otherwise — same threshold logic already used for the quality bar in this file.

3. **Real coach insights** — the bottom "Acción recomendada" block now renders `data?.mixInsights` (backend-computed, e.g. "Muchos chats vs llamadas. Sube el teléfono.") as a bulleted list inside `.ai-box`, with a `.slabel` "Coach IA" heading colored `var(--tracker-purple)` — copied verbatim from the "AI COACH TIPS" pattern in `MiDiaPage.tsx`. Falls back to the previous single-line `getRecommendedAction()` output when `mixInsights` is empty/undefined (function kept, not deleted).

4. **Overdue urgency** — `StatCell` gained an optional `background` prop (default `#F8FAFC`, unchanged for all other cells). The "Vencidos" cell now passes `background="#FEF2F2"` when `overdue > 0`, giving it the same red-tinted treatment as `.task-item.is-overdue` elsewhere in the app, on top of the existing red text.

5. **totalActivitiesToday surfaced** — small muted caption ("`{n}` actividades hoy") under the points badge, not a new stat cell/grid column.

Structure otherwise unchanged: skeleton loader, admin seller selector, single-seller view for non-admins, empty state all intact.

## Verification

`cd frontend && npx tsc --noEmit` → exit code 0, no errors.
