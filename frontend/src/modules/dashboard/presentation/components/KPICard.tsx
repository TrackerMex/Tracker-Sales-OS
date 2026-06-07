interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function KPICard({ title, value, subtitle, color }: KPICardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
        {title}
      </p>
      <p
        className="mt-1 text-[22px] font-bold"
        style={{ color: color ?? '#002B49' }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">{subtitle}</p>
      )}
    </div>
  );
}
