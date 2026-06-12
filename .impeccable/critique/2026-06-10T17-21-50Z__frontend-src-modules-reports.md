---
target: frontend/src/modules/reports
total_score: 21
p0_count: 0
p1_count: 2
timestamp: 2026-06-10T17-21-50Z
slug: frontend-src-modules-reports
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Bare "Cargando reporte..." text, no skeleton; "Guardado" confirmation appears for 2s only |
| 2 | Match System / Real World | 3 | Spanish throughout, domain-appropriate; "ATC" unexplained in config labels |
| 3 | User Control and Freedom | 2 | Month change requires OS date picker; no prev/next arrows; goals have no unsaved-changes warning |
| 4 | Consistency and Standards | 2 | Uppercase eyebrow repeated 6x; inline-style repetition for identical label pattern; inconsistent empty-state copy |
| 5 | Error Prevention | 2 | Goals not auto-saved; no indicator when goals are dirty vs persisted; openLamina injects raw outerHTML |
| 6 | Recognition Rather Than Recall | 3 | Data visible, labels present; "Abrir lámina" boundary not labeled |
| 7 | Flexibility and Efficiency | 2 | No prev/next month shortcut; no seller sort; no cross-month comparison |
| 8 | Aesthetic and Minimalist Design | 2 | "Resumen para Dirección" duplicates all visible data; 4 stacked AI panels; health block duplicates score already in header |
| 9 | Error Recovery | 2 | "Error al cargar" + "Reintentar" exists but gives no cause |
| 10 | Help and Documentation | 1 | No tooltip on "Salud Comercial" scoring method; ATC/Dirección distinction unexplained |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

### Anti-Patterns Verdict

LLM: AI analysis block uses green/orange/red/purple tinted panels in traffic-light order — colored-section-per-category reflex. "Salud Comercial General" dark block = hero-metric template ban. Uppercase eyebrow on every section panel (6 instances). KPI strip is clean and on-brand.

Detector: 2 warnings — Inter hardcoded in openLamina (line 193-194), single-font usage flagged. Real findings.

### Priority Issues

[P1] AI analysis contradicts itself — buildAnalysis uses data.commercialHealth as "quality" proxy, reports "Calidad comercial en 93%" while simultaneously emitting red flags for 19.3% unit achievement. Health score says "zona verde" while red flags say team is failing.

[P1] Month navigation requires OS date picker — no prev/next arrows. Sales managers compare months constantly. 3x friction.

[P2] Goals show no unsaved state — in-memory goals update analysis without persisting. Manager can see analysis based on unsaved values, refresh, and see different numbers.

[P2] "Resumen para Dirección" is redundant — prose duplicate of all data already shown visually. Collapse or remove from default view.

[P2] openLamina injects raw node.outerHTML — user-controlled data (seller names) in injected HTML is XSS risk.

### Persona Red Flags

Sales Director: Sees 93/100 "zona verde" + "Unidades 19.3% de meta" + red flags on same screen. Contradiction destroys trust. Month comparison requires date picker. Goals reset on refresh if unsaved.

Alex (Power User): No keyboard month navigation. Copiar informe copies fixed template. Seller table unsortable.

Sam (Accessibility): ATC abbr textDecoration: none hides affordance. Color-only % meta status. "Datos al HH:MM" at #94A3B8 on white = ~3.3:1 (WCAG fail). Health status text rgba(255,255,255,0.65) on #001524 = borderline contrast.

### Minor Observations

- AnalysisList empty text inconsistent across sections
- SourceGrid inner cards need 1px border to read as cards on F8FAFC bg
- Dirección tinted purple, Equipo neutral — no design rationale for asymmetric color coding
- Config label style repeated inline 4x — extract to FieldLabel component
- TRACKER SALES OS in all-caps at letterSpacing -0.02em = cramped
