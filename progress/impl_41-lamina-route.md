# impl: /lamina route — Executive Slide standalone page

## Status: DONE

## Files created
- `frontend/src/modules/reports/presentation/components/ExecutiveSlide.tsx`
  - Extracted helpers: LOSS_REASON_LABELS, money (exported), pct, buildAnalysis (exported), healthColor, AnalysisList, Bar
  - Exported: LABEL_STYLE, money, buildAnalysis, ExecutiveSlideProps, ExecutiveSlide
- `frontend/src/modules/reports/presentation/pages/LaminaPage.tsx`
  - Full-screen page, no AppLayout, no sidebar
  - Reads query params: month, goalAmount, goalUnits, goalPerSeller
- `frontend/src/routes/lamina.tsx`
  - Root-level route (not under _app)
  - validateSearch parses numeric params from string
  - beforeLoad: redirects to /login if no accessToken

## Files modified
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`
  - Removed all extracted helpers, imports money/buildAnalysis/LABEL_STYLE from ExecutiveSlide
  - Replaced executive slide JSX block with <ExecutiveSlide ... />
  - Updated shareLink() to generate /lamina?... URL
- `frontend/src/App.tsx`
  - Added laminaRoute import and registration at root level

## Verification
- `npx tsc --noEmit` — 0 errors
