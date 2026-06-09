# impl_16-ui-login-equipo

Date: 2026-06-08

## Changes applied

### LoginPage.tsx
- Submit button: replaced inline `style={{...}}` with `className="btn-green"` + `style={{ width: '100%' }}`
- Username input: removed duplicate inline `style` (kept `className="input"` which covers all properties via CSS)
- Password input: same as username
- Labels (Usuario, Contrasena): replaced full inline style with `className="slabel"` + `style={{ display: 'block', marginBottom: 6 }}` (display/margin not covered by `.slabel`)

### EquipoPage.tsx
- Seller rows in the "Equipo comercial" grid: added `seller-row` to className; removed redundant `background` and `rounded-lg px-3 py-3` (`.seller-row` CSS handles padding, border-radius, background, border and transition)

## CSS reference
- `.btn-green`: inline-flex, rounded-lg, px-3.5 py-[7px], text-xs font-bold, background: var(--tracker-green), color: var(--tracker-dark)
- `.input`: w-full, rounded-lg, px-3 py-2, text-[13px] font-medium, background/border via CSS vars
- `.slabel`: text-[11px] font-semibold uppercase, color: var(--tracker-text-muted), letter-spacing: 0.07em
- `.seller-row`: padding 12px 14px, border-radius 9px, background #F8FAFC, border 1px solid transparent, transition border-color 0.12s; hover: border-color #E2E8F0

## Result
- TypeScript: no errors (tsc --noEmit clean)
- Files modified:
  - frontend/src/modules/auth/presentation/pages/LoginPage.tsx
  - frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx
