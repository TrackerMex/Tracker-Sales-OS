import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export interface ChartColors {
  primary: string
  border: string
  mutedForeground: string
  background: string
  foreground: string
}

let probe: CanvasRenderingContext2D | null = null

// chart.js paints on a canvas: it cannot use var(--token), and its color
// helpers do not parse oklch(). Paint the token on one pixel and read it back
// as rgba(), which works for any CSS color the browser understands.
function resolveToken(name: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  probe ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true })
  if (!probe) return value
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = "transparent"
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 100) / 100})`
}

function readChartColors(): ChartColors {
  return {
    primary: resolveToken("--primary"),
    border: resolveToken("--border"),
    mutedForeground: resolveToken("--muted-foreground"),
    background: resolveToken("--background"),
    foreground: resolveToken("--foreground"),
  }
}

/**
 * Theme tokens resolved for chart.js. next-themes switches the theme by
 * toggling the `dark` class on <html>, so the colors are re-read whenever that
 * class changes and the chart re-renders with the new palette.
 */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState(readChartColors)
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readChartColors()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])
  return colors
}

/**
 * Line chart look of the template (dashboards/modern/total-sales.tsx):
 * dashed horizontal grid only, no axis lines or ticks, 12px muted labels,
 * compact bordered tooltip. Canvas text has no tabular-nums, and the
 * tooltip shadow of the template is not drawn by chart.js.
 */
export function lineChartOptions(colors: ChartColors): ChartOptions<"line"> {
  const font = { size: 12, family: getComputedStyle(document.body).fontFamily }
  // chart.js ignores the CSS reduced-motion rule; honor it here (DESIGN.md).
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  return {
    ...(reduceMotion && { animation: false }),
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 8, right: 4 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        cornerRadius: 10,
        padding: { x: 10, y: 6 },
        titleColor: colors.foreground,
        titleFont: { ...font, weight: 500 },
        bodyColor: colors.foreground,
        bodyFont: font,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 4,
      },
    },
    elements: {
      line: { borderWidth: 1.5, tension: 0 },
      point: { radius: 0, hoverRadius: 4, hoverBorderWidth: 0 },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: colors.mutedForeground, font, padding: 10 },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.border, drawTicks: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: colors.mutedForeground,
          font,
          padding: 8,
          precision: 0,
        },
      },
    },
  }
}
