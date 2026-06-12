---
target: frontend/src/modules/reports
total_score: 21
p0_count: 1
p1_count: 3
timestamp: 2026-06-10T16-55-51Z
slug: frontend-src-modules-reports
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2.5 | No data timestamp, no clipboard feedback, no save confirmation after "Guardar metas" |
| 2 | Match System / Real World | 3 | Spanish ops vernacular is correct; "ATC" acronym unexplained anywhere |
| 3 | User Control and Freedom | 2 | No goal reset-to-default; window.open lámina silently blocked by popup blockers; no undo on goals before saving |
| 4 | Consistency and Standards | 2 | SellerTable uses .dt design system class; entire executive slide uses raw inline style={{}} — two styling systems on the same page |
| 5 | Error Prevention | 2 | Goal inputs accept 0 (breaks pct() display); window.open blocked without user warning; no input validation |
| 6 | Recognition Rather Than Recall | 2.5 | "ATC" and "Salud Comercial 93/100" formula both opaque — no tooltip or inline definition |
| 7 | Flexibility and Efficiency | 1.5 | No keyboard shortcuts; single-month only; no MoM comparison; Copiar informe only export besides popup |
| 8 | Aesthetic and Minimalist Design | 2.5 | Uppercase tracked eyebrow on every section (absolute ban); Nuevas/Existentes dead columns in both tables |
| 9 | Error Recovery | 2 | API error shows one red sentence with no retry button; clipboard failure is silent |
| 10 | Help and Documentation | 1 | No tooltips, no acronym explanations, no score methodology, no inline help |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Not broad AI slop — purple/Dirección, green/ATC color coding, Spanish copy, dark Salud Comercial block show deliberate product thinking. But the uppercase tracked eyebrow fires on every section (DIRECCIÓN COMERCIAL, EQUIPO DE VENDEDORES, ATC, ORIGEN DE CUENTAS, ANÁLISIS EJECUTIVO IA) — same font-size/uppercase/letter-spacing, no differentiation. Absolute ban violation.

**Deterministic scan**: 3 findings — all contextual false positives. Inter font references are inside openLamina() print-window HTML string, not the main app UI (which uses Montserrat). No findings in live UI code.

## Overall Impression

Functional executive reporting tool with real data and coherent layout. Structural flaw: two seller table columns (Nuevas, Existentes) are hardcoded 0 in both table instances — blocks production confidence. Biggest opportunity: fix analysis logic contradiction (Áreas de oportunidad empty while Focos rojos has 2 critical items at 19% unit goal attainment).

## What's Working

1. Dark Salud Comercial block as closing beat — healthColor() thresholds are right for sales orgs.
2. Goal persistence via localStorage — manager sets targets once, not every visit.
3. Copiar informe clipboard format matches real sales ops communication (WhatsApp/Slack paste pattern).

## Priority Issues

**[P0] Dead Columns: "Nuevas" and "Existentes" Hardcoded to 0**
Both SellerTable (lines 116–117) and standalone Detalle Top Vendedores table (lines 709–710) render <td>0</td> for new/existing unit counts. Per-seller breakdown not in SellerSalesReport type.
Fix: Remove Nuevas/Existentes columns from both tables until API returns per-seller breakdown.
Suggested: /impeccable distill

**[P1] Áreas de Oportunidad Empty While Focos Rojos Has 2 Critical Items**
buildAnalysis() only fires opportunities when amtPct < 50 or quality < 60. At 167% sales / 19% units, opportunities array is empty while redFlags has 2 items. Manager and director see contradictory signals.
Fix: Add opportunity trigger when unitPct < 50, independent of amtPct threshold.
Suggested: /impeccable harden

**[P1] No Data Timestamp**
No "fetched at HH:mm" or freshness indicator anywhere on the report. Executive presentations require data provenance.
Fix: Add updatedAt to API response, display near KPI strip header.
Suggested: /impeccable clarify

**[P1] Uppercase Eyebrow on Every Section (Absolute Ban)**
Five sections share identical uppercase style: fontSize 11, fontWeight 700, textTransform uppercase, letterSpacing 0.08em. Everything equal weight = nothing navigable.
Fix: Reserve uppercase style for one level; differentiate ANÁLISIS EJECUTIVO IA from panel labels like ATC and ORIGEN DE CUENTAS.
Suggested: /impeccable typeset

**[P2] Goal Inputs: No Save Feedback, No Validation**
Guardar metas writes to localStorage silently. No toast, no confirmation. goalAmount=0 breaks pct() display.
Fix: Brief "Metas guardadas" toast after save. Add min="1" to all goal inputs.
Suggested: /impeccable harden

## Persona Red Flags

**Alex (Sales Manager, Power User)**: window.open blocked in corp environments — no error shown; Nuevas:0 columns undermine credibility in director meeting; Áreas de oportunidad empty contradicts Focos rojos; no timestamp for data freshness.

**Sam (Accessibility)**: Executive slide is div soup with no semantic headings — flat screen reader experience. healthColor() color-only meaning. No aria-label binding KPI label to value.

**Elena (Sales Director — receives the exported lámina)**: ATC unexplained in exported image. Áreas/Focos contradiction visible. openLamina() HTML may render unstyled in restrictive browser environments.

## Minor Observations

- SourceGrid single item in 2-col layout (line 131): replace gridTemplateColumns '1fr 1fr' with repeat(auto-fit, minmax(160px, 1fr))
- loadGoals() called on every render (line 148), not in useState initializer — move to useState(() => loadGoals())
- navigator.clipboard?.writeText has no .catch() — silent failure on HTTP origins
- healthColor() hardcodes #82bc00 instead of var(--tracker-green)
- Duplicate seller data when sellers exist: same sellers appear in both executive slide SellerTable and standalone Detalle Top Vendedores
