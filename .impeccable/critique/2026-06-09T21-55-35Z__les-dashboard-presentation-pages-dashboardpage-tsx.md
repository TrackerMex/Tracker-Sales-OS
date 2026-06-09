---
target: frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx
total_score: 27
p0_count: 1
p1_count: 2
timestamp: 2026-06-09T21-55-35Z
slug: les-dashboard-presentation-pages-dashboardpage-tsx
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3.5 | No "as of [timestamp]" on dashboard—managers can't tell if data is fresh or 2 hours stale |
| 2 | Match System / Real World | 3 | Spanish labels are correct, but "Puntos totales" and "Calidad promedio" lack definition/context |
| 3 | User Control and Freedom | 2 | Read-only view; no drill-down from KPI or alerts to detail pages; filtering locked to fixed ranges |
| 4 | Consistency and Standards | 2.5 | Mixed inline `style={{}}` and CSS classes; KPIStrip uses classes, SellerSemaphoreTable uses inline styles, no unified pattern |
| 5 | Error Prevention | 3 | Read-only prevents accidents; server-computed scores avoid local math errors; validation gaps on chart data length |
| 6 | Recognition Rather Than Recall | 3 | Color badges (green/amber/red) are universal; metric definitions are missing (is quality score high-good or low-good?) |
| 7 | Flexibility and Efficiency of Use | 2 | No keyboard shortcuts, no bulk actions, alerts are dead-end data (can't click to navigate to task list or seller detail) |
| 8 | Aesthetic and Minimalist Design | 3.5 | Clean grid, reasonable density, restrained color; chart is placeholder-grade (hardcoded data signals "not production-ready") |
| 9 | Error Recovery | 3 | Clear error messages, graceful empty states; missing "Retry" button on failed data load |
| 10 | Help and Documentation | 1.5 | No tooltips, no onboarding, no glossary; metric definitions live only in product docs, not embedded |
| **Total** | | **27.5/40** | **Acceptable (20–27 band); significant improvements needed** |

---

## Anti-Patterns Verdict

### LLM Assessment

**Would a sales tool expert trust this?** Moderate. The design shows intentional sales ops understanding (dual-metric KPI, semaphore color system, Spanish labels, overdue tracking) that suggests real product thinking. But it falls short of "built by people who ship to real teams" because:

- **Chart is placeholder-grade**: Hardcoded 14-point line with no real integration hint; signals MVP, not production-ready for managers expecting live activity data.
- **Duplicate color definitions**: AlertsPanel hardcodes background colors AND mirrors them in CSS classes (.alert-item.navy). Component styling is scattered (AlertsPanel uses inline, KPIStrip uses CSS, SellerSemaphoreTable mixes both). No single source of truth.
- **Loading state confusion**: KPIStrip loads "..." as a string while SellerSemaphoreTable uses animate-pulse skeleton. AlertsPanel has no loading state. Inconsistent patterns.
- **Read-only friction**: Clicking "3 vencidas" (overdue) doesn't navigate to task list; "Carlos" (red seller) doesn't drill to detail. Managers must leave the dashboard to act, which breaks the "action center" mental model.

**Positive signals avoiding the AI trap**: Semaphore progress bar is capped at 100% (not open-ended), "Vencidas" label is explicit, Spanish copy throughout, points tied to real sales ops workflows (not vanilla "engagement score"), quality metric integrated with seller row.

### Deterministic Scan Results

**Zero findings from automated detector.** The code is structurally sound: no contrast violations, no semantic HTML gaps, no layout issues detected. This means the critiques are about UX, information architecture, and operational design—not broken CSS or missing labels.

**No browser visualization overlay needed** (detector found nothing to highlight).

---

## Overall Impression

**A solid morning briefing tool, not yet an action dashboard.** The design is clean, the data hierarchy is clear, and the semaphore table is genuinely well-thought-out. But the read-only nature, metric definition gaps, and lack of task integration mean managers will use this to *understand* team status, not to *fix* problems from this screen. For a product marketed as a "sales operations tracker," that's a missed opportunity.

**Single biggest opportunity**: Make alerts clickable. Clicking "3 vencidas" should navigate to the task filter (overdue tasks). Clicking on a seller's name should jump to their detail page or coaching record. This transforms the dashboard from a scorecard into a real action center.

---

## What's Working

**1. Semaphore visual is production-grade.** The seller row with score badge (green/amber/red) + inline metrics (points today, quality %, monthly points, overdue count) is exactly what a manager needs: glanceable, scannable, unambiguous color-meaning mapping. The progress bar is capped at 100%, which prevents visual misleading. This is where the design demonstrates "earned confidence."

**2. KPI strip hierarchy is unambiguous.** The dark navy cell (first position, highest contrast) reads as "this is the hero metric" (sales). Three white cells follow in order (units, points, quality). No ambiguity about priority. The green accent on the label reinforces brand without overwhelming. A sales manager lands on the dashboard and knows *immediately* which metrics to focus on.

**3. Dual-unit KPI pairing (sales $ + unit count).** Showing both "Venta del mes" (currency) and "Unidades" (unit count) prevents metric gaming. Managers can't inflate revenue by discounting, because unit count shows the real deal velocity. This is sales ops *rigor*, not generic dashboard bloat.

---

## Priority Issues

**[P0] No Data Timestamp — Blocks Confidence in Decision-Making**

Critical for fast-moving sales teams. Is the KPI data from 5 minutes ago or 2 hours? Without it, managers may make decisions on stale data. This is a showstopper for trust.

**Why it matters**: In sales, a two-hour lag can mean missed pipeline signals (a rep closes a big deal, but the dashboard hasn't updated). Managers need to know freshness.

**Fix**: Add "Updated: [HH:mm]" or "as of 2 minutes ago" above or below the KPI strip. Use server timestamp, not client time, so all users see consistent freshness across time zones.

**Suggested command**: `/impeccable clarify` (copy fix) + `/impeccable layout` (placement in grid)

---

**[P1] Broken Progressive Disclosure — Alerts Are Dead-End Data**

AlertsPanel displays counts ("3 vencidas", "68% cumplimiento") but clicking doesn't navigate to the detail view. Manager must manually navigate away to Tareas or Equipo module to act. This forces multi-step workflows and breaks the "action dashboard" mental model.

**Why it matters**: Every alert is a call to action. If the manager can't act from the dashboard without leaving, the dashboard becomes a secondary tool (they'll bookmark Tareas instead and check that first).

**Fix**: Make alert counts clickable/tappable. "3 vencidas" → filter to overdue tasks (Tareas module with `?status=overdue`). Seller name → drill to seller detail. Same for KPI cells—clicking "Units: 82/150" could show a breakdown by seller.

**Suggested command**: `/impeccable craft` (shape interaction model) or `/impeccable harden` (add link navigation to existing components)

---

**[P1] Metric Definition Gaps — "Puntos" and "Calidad" Are Jargon**

"Puntos totales" (total points) is unexplained. Is this points earned by the team, points available as a target, or a composite score? New managers don't know. Same for "Calidad promedio %"—is this % of follow-ups completed, quality score (0–100), or compliance metric?

**Why it matters**: Managers making coaching decisions based on undefined metrics will guess wrong. They'll misunderstand "68% calidad" as bad performance when it might be a different scale.

**Fix**: Add inline tooltips on KPI labels. Hover/tap "Puntos totales" → "Team-wide activity points earned this month (calls + emails + meetings logged)". Hover "Calidad %" → "% of follow-ups completed on schedule vs. planned date". Or embed a glossary link at the top of the dashboard.

**Suggested command**: `/impeccable clarify` (add definitions and copy)

---

**[P2] CSS/Tailwind Mixing (Code Debt, Not Visual Debt)**

KPIStrip uses `.kpi-cell` CSS class + inline `style={{}}` for colors. AlertsPanel hardcodes colors in the component AND duplicates them in CSS classes. SellerSemaphoreTable uses inline styles for everything. No single source of truth for color semantics.

**Why it matters**: Maintenance nightmare. If the brand changes tracker-green from #82bc00 to a new value, you'll have to hunt through three files. One line should own each color.

**Fix**: Move all semantic colors to CSS variables (already in place: `--tracker-green`, `--tracker-blue`). Use only Tailwind classes or CSS variables in components; eliminate inline `style={{}}` for semantic values. Build a component library for KPICell, SellerRow, AlertItem with props for color/state, not inline styles.

**Suggested command**: `/impeccable extract` (pull components and tokens into design system) + `/impeccable polish` (clean up styling)

---

**[P2] Chart Is Placeholder-Grade — Static Data Signals "MVP Not Production"**

CHART_DATA is hardcoded (`[2, 5, 3, 8, 6, 4, 9, 7, 11, 6, 8, 10, 7, 12]`). The static line chart renders with no axis labels, no legend, no interactivity. Managers expect real activity data (calls, emails, meetings logged), not fake noise.

**Why it matters**: The chart fills premium real estate on the dashboard and signals "not production-ready." Managers will skip it and rely on the KPI numbers, which wastes the layout.

**Fix**: Replace with real activity data once available. Until then, replace the chart with a 14-day sparkline in the KPI grid (à la Stripe dashboard: small, context-rich) or remove it entirely and reclaim the space for additional seller details or drill-down controls.

**Suggested command**: `/impeccable distill` (strip placeholder, reclaim space) or `/impeccable document` (update DESIGN.md with real data sources)

---

## Persona Red Flags

**Alex (Impatient Power User — Sales Manager, 8 years tenure)**

**Primary action**: "I land on dashboard at 9 AM, I see Carlos is red (score 41), I pull his activity log and coach him same-day."

**What breaks**:
- Clicking on Carlos's row does nothing (not a link).
- "41" score lacks definition (is this 41/100, or a percentile rank?).
- No keyboard shortcut to jump to seller detail (must mouse-click, then navigate).
- Dashboard is read-only, so Alex learns to skip it and go straight to Equipo module.

**Red flag**: Alex loses trust in the dashboard because it's slower than navigating directly. Dashboard becomes secondary; Alex optimizes around it instead of using it as intended.

---

**Sam (Accessibility Advocate — Screen Reader + Keyboard Navigation)**

**Primary action**: "I tab through the dashboard and listen to KPI values and seller names. Then I navigate to a seller detail or click an alert."

**What breaks**:
1. Colors convey meaning (red = overdue, green = on-track) with no text alternative. Sam hears "52" but doesn't hear "amber" (the danger signal is lost).
2. AlertsPanel divs (`.alert-item`) have no `role="status"` or `aria-live` or `aria-label`. Screen reader doesn't announce them as urgent or actionable.
3. Seller row is a `<div>` with inline styles, not a `<button>` or `<a>`. Sam tabs past it without knowing it's interactive (or realizing it's NOT interactive and can't be actioned).
4. No visible focus indicator on seller rows. Sam tabs through and loses track of where the focus is.
5. Chart has no alt text or accessible description. Sam gets no information from the Activity section.

**Red flag**: Dashboard fails WCAG 2.1 AA (per PRODUCT.md commitment of "4.5:1 contrast, keyboard nav, screen reader compatible"). This is not a nice-to-have; it's a shipped accessibility violation for employees with vision or motor impairments.

---

## Minor Observations

- **Inconsistent loading patterns**: KPIStrip uses "..." string. SellerSemaphoreTable uses animate-pulse skeleton. AlertsPanel has no loading state. During network lag, the UX is confusing.
- **Unfinished seller row hover**: Border appears but no background shift or cursor change. The row *looks* like it should be interactive (due to the border), but it's not. Remove the hover border or make the row clickable.
- **Chart height is hardcoded** (`height: 180`). No responsive scaling for mobile/tablet. Will be unreadable on narrow screens (portrait mode on iPad, etc.).
- **Activity chart has no data label**: What does the Y-axis measure? Calls? Meetings? Emails? Revenue? Context-free line noise for new users. Add a subtitle or axis label.
- **Overdue count is lumped**: "3 vencidas" could be follow-ups, coaching records, or tasks. No breakdown visible. Must navigate to Tareas module to drill down.
- **KPI "Unidades" goal is hardcoded**: `unitsGoal={150}` is baked in. If the monthly goal changes, dashboard shows stale ratio. Move to server (fetch from backend).
- **Spanish labels only**: UI is fully Spanish (good for MX market), but no i18n support visible. If you scale to US/LATAM, you'll need to rebuild.

---

## Questions to Consider

**Q1: Is this a dashboard or a scorecard?**
A scorecard *informs* (I see the number). A dashboard *enables action* (I see the number and I fix it from here). Your dashboard is read-only, which leans scorecard. If that's intentional (managers use a separate coaching flow, and the dashboard is just status), then you've achieved your goal. If you want a true action dashboard, make alerts clickable and seller rows navigate to detail.

**Q2: Why is the Activity chart a visualization instead of a number?**
The line chart takes premium real estate and renders 14 static points with no axis labels, no interactivity, and no obvious insight. A manager would ask: "Is this call count? Email count? Revenue trend?" If it's just a trend line, use a sparkline in the KPI grid (small, rich context) and free up space. If it's actionable (e.g., "activity dropped 40% on Friday"), call that out in the title and add annotations.

**Q3: Where does "Puntos" fit in manager workflows?**
Points appear in the KPI and in seller rows, but managers never *earn* or *allocate* points from the dashboard. Is this a hidden gamification layer (internal metric)? A sales ops reporting layer (visible only to ops, not frontline)? If it matters to decisions, define it and explain it. If it doesn't, remove it and reclaim KPI space for a metric that matters (e.g., pipeline stage breakdown, close rate trend).
