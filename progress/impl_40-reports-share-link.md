# Feature 40: Compartir como hipervínculo — Reports tab

## Status: done

## Changes

### frontend/src/routes/_app/reportes.tsx
- Added `validateSearch` to parse `month`, `goalAmount`, `goalUnits`, `goalPerSeller` from URL query params.
- Numbers accepted as both `number` and `string` (URL always passes strings).

### frontend/src/modules/reports/presentation/pages/ReportsPage.tsx
- Added `useSearch` import from `@tanstack/react-router`.
- Added `search` const (strict: false) before useState declarations.
- Updated 4 useState initializers to prefer URL search params, fall back to localStorage/defaults.
- Added `shareLinkMsg` state (`'idle' | 'ok' | 'fail'`).
- Added `shareLink()` function: builds URLSearchParams from current filter state, copies full URL to clipboard.
- Added "Compartir" button before "Abrir lámina" with idle/ok/fail feedback labels.

## Verification
- `cd frontend && npx tsc --noEmit` → exit 0, no errors.
