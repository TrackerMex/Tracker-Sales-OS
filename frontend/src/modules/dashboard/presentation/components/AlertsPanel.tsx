import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { STATUS_TILE_CLASS, type StatusTone } from "@/shared/lib/status"

interface AlertItem {
  label: string
  value: string
  color: "red" | "amber" | "green" | "navy"
  /** 16px icon for the tile. */
  icon: ReactNode
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

const TONE: Record<AlertItem["color"], StatusTone> = {
  red: "danger",
  amber: "pending",
  green: "success",
  navy: "neutral",
}

const STATUS_LABEL: Record<AlertItem["color"], string> = {
  red: "crítico — requiere atención inmediata",
  amber: "pendiente — requiere seguimiento",
  green: "cumplimiento — está en buen camino",
  navy: "información",
}

// 2x2 tile grid in the style of the template's "Total Assets" card
// (dashboards/modern/total-assets.tsx); the icon box carries the alert tone.
export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div
      className="grid h-full grid-cols-2 gap-px bg-border"
      role="region"
      aria-label="Alertas operativas"
    >
      {alerts.map((alert) => (
        <div
          key={alert.label}
          className="flex flex-col justify-between gap-6 bg-background p-6"
          role="status"
          aria-live="polite"
          aria-label={`${alert.label}: ${alert.value} (${STATUS_LABEL[alert.color]})`}
        >
          <div
            className={cn(
              "w-fit rounded-md border p-2",
              STATUS_TILE_CLASS[TONE[alert.color]]
            )}
          >
            {alert.icon}
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground">
              {alert.value}
            </div>
            <p className="text-sm text-foreground">{alert.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
