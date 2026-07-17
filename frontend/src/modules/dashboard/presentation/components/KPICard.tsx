interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
}

export function KPICard({ title, value, subtitle, color }: KPICardProps) {
  return (
    <div className="rounded-xl border border-tracker-border bg-white p-5">
      <p className="text-[11px] font-semibold tracking-wide text-tracker-text-muted uppercase">
        {title}
      </p>
      <p
        className="mt-1 text-[22px] font-bold text-tracker-blue"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-tracker-text-muted">{subtitle}</p>
      )}
    </div>
  )
}
