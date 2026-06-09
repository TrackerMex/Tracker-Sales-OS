import { useState } from 'react';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import type { TypeReport } from '../../domain/reports.types';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function fmtAmount(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

function healthBarColor(pct: number): string {
  if (pct >= 75) return '#82bc00';
  if (pct >= 45) return '#F59E0B';
  return '#EF4444';
}

interface TypeRowProps {
  label: string;
  report: TypeReport;
}

function TypeRow({ label, report }: TypeRowProps) {
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{label}</td>
      <td className="text-right">{report.count}</td>
      <td className="text-right">{report.units}</td>
      <td className="text-right">{fmtAmount(report.amount)}</td>
      <td className="text-right">{report.newUnits}</td>
      <td className="text-right">{report.existingUnits}</td>
    </tr>
  );
}

export function ReportsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const { data, isLoading, error } = useMonthlyReport(month);

  return (
    <div style={{ maxWidth: 900 }} className="space-y-5">
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Reportes Dirección</h1>

      <div>
        <label className="slabel mb-1 block">Mes</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input"
          style={{ maxWidth: 200 }}
        />
      </div>

      {isLoading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando reporte...</p>}
      {error && <p style={{ fontSize: 13, color: '#EF4444' }}>Error al cargar el reporte.</p>}

      {data && (
        <div className="space-y-5">
          {/* Health score card */}
          <div className="flex gap-4">
            <div
              className="rounded-lg p-5 text-center"
              style={{ background: '#001524', minWidth: 140 }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Salud Comercial
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#82bc00', lineHeight: 1.1, marginTop: 8 }}>
                {data.commercialHealth}%
              </div>
            </div>

            {/* Summary cards */}
            <div className="kpi-strip flex-1">
              <div className="kpi-cell">
                <div className="kl">Monto total</div>
                <div className="kv" style={{ fontSize: 16 }}>{fmtAmount(data.total.amount)}</div>
                <div className="ksb">meta {fmtAmount(data.monthlyAmountGoal)}</div>
              </div>
              <div className="kpi-cell">
                <div className="kl">Unidades</div>
                <div className="kv">{data.total.units}</div>
                <div className="ksb">meta {data.monthlyUnitGoal}</div>
              </div>
              <div className="kpi-cell">
                <div className="kl">Cierres</div>
                <div className="kv">{data.total.count}</div>
              </div>
              <div className="kpi-cell">
                <div className="kl">Nuevos / Existentes</div>
                <div className="kv">{data.total.newUnits} / {data.total.existingUnits}</div>
                <div className="ksb">unidades</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card p-4">
            <div className="flex justify-between mb-2">
              <span className="kl">Avance mensual</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{data.commercialHealth}%</span>
            </div>
            <div className="prog">
              <div
                className="prog-fill"
                style={{ width: `${Math.min(100, data.commercialHealth)}%`, backgroundColor: healthBarColor(data.commercialHealth) }}
              />
            </div>
          </div>

          {/* Por tipo de cierre */}
          <div className="card overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-5 py-3">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Por Tipo de Cierre</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th className="text-right">Cierres</th>
                    <th className="text-right">Unidades</th>
                    <th className="text-right">Monto</th>
                    <th className="text-right">Nuevos</th>
                    <th className="text-right">Existentes</th>
                  </tr>
                </thead>
                <tbody>
                  <TypeRow label="Equipo Vendedores" report={data.team} />
                  <TypeRow label="Dirección Comercial" report={data.direction} />
                  <TypeRow label="ATC" report={data.atc} />
                  <tr style={{ borderTop: '2px solid #E2E8F0', fontWeight: 700, color: '#002B49' }}>
                    <td>Total</td>
                    <td className="text-right">{data.total.count}</td>
                    <td className="text-right">{data.total.units}</td>
                    <td className="text-right">{fmtAmount(data.total.amount)}</td>
                    <td className="text-right">{data.total.newUnits}</td>
                    <td className="text-right">{data.total.existingUnits}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendedores */}
          <div className="card overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-5 py-3">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Vendedores</h3>
            </div>
            {data.sellers.length === 0 ? (
              <p className="p-5" style={{ fontSize: 13, color: '#94A3B8' }}>Sin ventas registradas.</p>
            ) : (
              <table className="dt">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="text-right">Cierres</th>
                    <th className="text-right">Unidades</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sellers.map((s) => (
                    <tr key={s.sellerId}>
                      <td style={{ fontWeight: 500 }}>{s.sellerName}</td>
                      <td className="text-right">{s.count}</td>
                      <td className="text-right">{s.units}</td>
                      <td className="text-right" style={{ fontWeight: 600, color: '#82bc00' }}>{fmtAmount(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Por origen */}
          {data.bySource.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-[#E2E8F0] px-5 py-3">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Por Origen</h3>
              </div>
              <table className="dt">
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th className="text-right">Cierres</th>
                    <th className="text-right">Unidades</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySource.map((s) => (
                    <tr key={s.source}>
                      <td>{s.source}</td>
                      <td className="text-right">{s.count}</td>
                      <td className="text-right">{s.units}</td>
                      <td className="text-right">{fmtAmount(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paneles de análisis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Fortalezas */}
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Fortalezas
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, color: '#166534', lineHeight: 1.65 }}>
                {data.total.amount >= data.monthlyAmountGoal && (
                  <li>Meta de ventas superada ({((data.total.amount / (data.monthlyAmountGoal || 1)) * 100).toFixed(0)}%)</li>
                )}
                {data.commercialHealth >= 75 && (
                  <li>Salud comercial sobresaliente ({data.commercialHealth}%)</li>
                )}
                {data.total.units >= data.monthlyUnitGoal && (
                  <li>Meta de unidades alcanzada ({data.total.units} / {data.monthlyUnitGoal})</li>
                )}
                {data.total.amount < data.monthlyAmountGoal &&
                 data.commercialHealth < 75 &&
                 data.total.units < data.monthlyUnitGoal && (
                  <li style={{ color: '#6B7280', fontStyle: 'italic' }}>Sin datos suficientes para este periodo</li>
                )}
              </ul>
            </div>

            {/* Oportunidades */}
            <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Oportunidades
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, color: '#9A3412', lineHeight: 1.65 }}>
                {data.total.amount < data.monthlyAmountGoal && (
                  <li>Brecha de {(((data.monthlyAmountGoal - data.total.amount) / 1000)).toFixed(0)}K en meta de monto</li>
                )}
                {data.commercialHealth < 70 && (
                  <li>Salud comercial por debajo del 70% — reforzar descubrimiento y acuerdos</li>
                )}
                {data.total.units < data.monthlyUnitGoal && data.total.amount >= data.monthlyAmountGoal && (
                  <li>Unidades por debajo de meta ({data.total.units} / {data.monthlyUnitGoal})</li>
                )}
                {data.total.amount >= data.monthlyAmountGoal &&
                 data.commercialHealth >= 70 &&
                 data.total.units >= data.monthlyUnitGoal && (
                  <li style={{ color: '#6B7280', fontStyle: 'italic' }}>Sin oportunidades críticas identificadas</li>
                )}
              </ul>
            </div>

            {/* Red Flags */}
            <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Red Flags
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, color: '#991B1B', lineHeight: 1.65 }}>
                {data.commercialHealth < 50 && (
                  <li>Salud comercial crítica ({data.commercialHealth}%) — actividades incompletas</li>
                )}
                {data.total.count === 0 && (
                  <li>Sin cierres registrados en el periodo</li>
                )}
                {data.total.amount < data.monthlyAmountGoal * 0.5 && data.monthlyAmountGoal > 0 && (
                  <li>Monto alcanzado menor al 50% de la meta — revisar pipeline urgente</li>
                )}
                {data.commercialHealth >= 50 &&
                 data.total.count > 0 &&
                 (data.total.amount >= data.monthlyAmountGoal * 0.5 || data.monthlyAmountGoal === 0) && (
                  <li style={{ color: '#6B7280', fontStyle: 'italic' }}>Sin alertas críticas este periodo</li>
                )}
              </ul>
            </div>

            {/* Recomendaciones */}
            <div style={{ background: '#EDE9FE', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Recomendaciones
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12.5, color: '#5B21B6', lineHeight: 1.65 }}>
                {data.commercialHealth < 75 && (
                  <li>Mejorar salud comercial: registrar descubrimiento, acuerdo y siguiente paso en cada actividad</li>
                )}
                {data.total.amount < data.monthlyAmountGoal * 0.8 && data.monthlyAmountGoal > 0 && (
                  <li>Aumentar frecuencia de propuestas y visitas presenciales</li>
                )}
                {data.total.units < data.monthlyUnitGoal && (
                  <li>Enfocar esfuerzos en cerrar unidades pendientes antes de fin de mes</li>
                )}
                <li>Revisar mix de actividades: balance llamadas → reuniones → propuestas</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
