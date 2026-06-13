interface KPIStripProps {
  salesValue: string;
  salesCount: number;
  unitsValue: number;
  unitsGoal: number;
  pointsValue: number;
  qualityValue: number;
  forecastValue: string;
  forecastSubtitle: string;
  isLoading: boolean;
  onRetry?: () => void;
}

function KPITooltip({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="group relative inline-flex cursor-help">
      {children}
      <div className="invisible absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-[#0f172a] px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
        {title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]" />
      </div>
    </div>
  );
}

export function KPIStrip({
  salesValue,
  salesCount,
  unitsValue,
  unitsGoal,
  pointsValue,
  qualityValue,
  forecastValue,
  forecastSubtitle,
  isLoading,
}: KPIStripProps) {
  const fmt = (v: string | number) => (isLoading ? '...' : v);

  return (
    <div className="kpi-strip">
      <div className="kpi-cell ac">
        <div className="kl">Venta del mes</div>
        <div className="kv">{fmt(salesValue)}</div>
        <div className="ksb">{fmt(`${salesCount} cierres este mes`)}</div>
      </div>
      <div className="kpi-cell">
        <div className="kl">Unidades</div>
        <div className="kv">{fmt(`${unitsValue} / ${unitsGoal}`)}</div>
        <div className="ksb">meta mensual</div>
      </div>
      <div className="kpi-cell">
        <KPITooltip title="Actividad acumulada: llamadas, emails y reuniones registradas por el equipo este mes">
          <div className="kl">Puntos totales</div>
        </KPITooltip>
        <div className="kv">{fmt(pointsValue.toLocaleString('es-MX'))}</div>
        <div className="ksb">acumulados mes</div>
      </div>
      <div className="kpi-cell">
        <KPITooltip title="% de seguimientos completados a tiempo. Mayor % = mejor cumplimiento">
          <div className="kl">Calidad promedio</div>
        </KPITooltip>
        <div className="kv">{fmt(`${qualityValue.toFixed(1)}%`)}</div>
        <div className="ksb">promedio del equipo</div>
      </div>
      <div className="kpi-cell">
        <KPITooltip title="Forecast ponderado del pipeline: suma de cada deal por su probabilidad de cierre, excluyendo Perdido">
          <div className="kl">Forecast del mes</div>
        </KPITooltip>
        <div className="kv">{fmt(forecastValue)}</div>
        <div className="ksb">{fmt(forecastSubtitle)}</div>
      </div>
    </div>
  );
}
