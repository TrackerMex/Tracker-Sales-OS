interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function KPICard({ title, value, subtitle, color }: KPICardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p
        className="mt-1 text-2xl font-black"
        style={{ color: color ?? '#002B49' }}
      >
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
