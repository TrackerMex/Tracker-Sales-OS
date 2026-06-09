interface AlertItem {
  label: string;
  value: string;
  color: 'red' | 'amber' | 'green' | 'navy';
}

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const ALERT_STYLES: Record<AlertItem['color'], { bg: string; text: string }> = {
  red: { bg: '#FEF2F2', text: '#DC2626' },
  amber: { bg: '#FFFBEB', text: '#D97706' },
  green: { bg: '#F0FDF4', text: '#16A34A' },
  navy: { bg: '#EFF6FF', text: '#002B49' },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getStatusLabel = (color: string) => {
    const statusMap: Record<string, string> = {
      red: 'crítico — requiere atención inmediata',
      amber: 'pendiente — requiere seguimiento',
      green: 'cumplimiento — está en buen camino',
      navy: 'información',
    };
    return statusMap[color] || '';
  };

  return (
    <div className="flex flex-col gap-2" role="region" aria-label="Alertas operativas">
      {alerts.map((alert, i) => {
        const style = ALERT_STYLES[alert.color];
        return (
          <div
            key={i}
            className={`alert-item ${alert.color}`}
            style={{ backgroundColor: style.bg }}
            role="status"
            aria-live="polite"
            aria-label={`${alert.label}: ${alert.value} (${getStatusLabel(alert.color)})`}
          >
            <p className="text-xs font-semibold" style={{ color: style.text }}>
              {alert.label}
            </p>
            <span
              className="text-xs font-bold"
              style={{ color: style.text }}
            >
              {alert.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
