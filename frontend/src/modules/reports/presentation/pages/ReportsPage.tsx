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
        </div>
      )}
    </div>
  );
}
