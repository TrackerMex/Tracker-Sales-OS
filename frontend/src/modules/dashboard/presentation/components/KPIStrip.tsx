interface KPIStripProps {
  salesValue: string;
  salesCount: number;
  unitsValue: number;
  unitsGoal: number;
  pointsValue: number;
  qualityValue: number;
  isLoading: boolean;
}

export function KPIStrip({
  salesValue,
  salesCount,
  unitsValue,
  unitsGoal,
  pointsValue,
  qualityValue,
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
        <div className="kl">Puntos totales</div>
        <div className="kv">{fmt(pointsValue.toLocaleString('es-MX'))}</div>
        <div className="ksb">acumulados mes</div>
      </div>
      <div className="kpi-cell">
        <div className="kl">Calidad promedio</div>
        <div className="kv">{fmt(`${qualityValue.toFixed(1)}%`)}</div>
        <div className="ksb">promedio del equipo</div>
      </div>
    </div>
  );
}
