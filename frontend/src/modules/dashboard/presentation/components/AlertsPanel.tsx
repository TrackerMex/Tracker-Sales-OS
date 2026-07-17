interface AlertItem {
  label: string
  value: string
  color: "red" | "amber" | "green" | "navy"
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

const ALERT_CLASSES: Record<AlertItem["color"], string> = {
  red: "bg-red-50 text-tracker-danger",
  amber: "bg-amber-50 text-tracker-warning",
  green: "bg-green-50 text-tracker-success",
  navy: "bg-blue-50 text-tracker-blue",
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getStatusLabel = (color: string) => {
    const statusMap: Record<string, string> = {
      red: "crítico — requiere atención inmediata",
      amber: "pendiente — requiere seguimiento",
      green: "cumplimiento — está en buen camino",
      navy: "información",
    }
    return statusMap[color] || ""
  }

  return (
    <div
      className="flex flex-col gap-2"
      role="region"
      aria-label="Alertas operativas"
    >
      {alerts.map((alert, i) => {
        return (
          <div
            key={i}
            className={`alert-item ${alert.color} ${ALERT_CLASSES[alert.color]}`}
            role="status"
            aria-live="polite"
            aria-label={`${alert.label}: ${alert.value} (${getStatusLabel(alert.color)})`}
          >
            <p className="text-xs font-semibold">{alert.label}</p>
            <span className="text-xs font-bold">{alert.value}</span>
          </div>
        )
      })}
    </div>
  )
}
