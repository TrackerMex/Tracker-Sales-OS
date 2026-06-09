# impl: Dashboard Activity Chart — Chart.js Migration

## Status: DONE

## What was done

Replaced the manual SVG `ActivityChart` component in `DashboardPage.tsx` with a `react-chartjs-2` `<Line>` component.

## Changes

### `frontend/src/modules/dashboard/presentation/pages/DashboardPage.tsx`

- Added imports for `chart.js` (CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip) and `react-chartjs-2` (Line)
- Registered Chart.js components via `ChartJS.register(...)`
- Removed the entire SVG-based `ActivityChart` function (~55 lines)
- Replaced with a new `ActivityChart` that renders `<Line>` inside a `div` with `height: 180, position: relative`
- Data sources unchanged: `CHART_DATA` (14-point array) and `getLast14Days()` function
- Removed the now-unnecessary `height: 170` style from the card container div

## Dependencies

Both `chart.js` and `react-chartjs-2` were already present in `package.json` — no install needed.

## Validation

- `pnpm typecheck` passed with zero errors
