import { useState } from 'react';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import type { TypeReport } from '../../domain/reports.types';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function fmtAmount(amount: number): string {
  return `$${amount.toLocaleString('es-MX')}`;
}

function healthColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 45) return 'bg-amber-400';
  return 'bg-red-500';
}

function healthLabel(pct: number): string {
  if (pct >= 75) return 'text-green-700';
  if (pct >= 45) return 'text-amber-600';
  return 'text-red-600';
}

interface TypeRowProps {
  label: string;
  report: TypeReport;
}

function TypeRow({ label, report }: TypeRowProps) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 font-medium text-slate-700">{label}</td>
      <td className="py-2 text-right text-slate-700">{report.count}</td>
      <td className="py-2 text-right text-slate-700">{report.units}</td>
      <td className="py-2 text-right text-slate-700">{fmtAmount(report.amount)}</td>
      <td className="py-2 text-right text-slate-700">{report.newUnits}</td>
      <td className="py-2 text-right text-slate-700">{report.existingUnits}</td>
    </tr>
  );
}

export function ReportsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const { data, isLoading, error } = useMonthlyReport(month);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h2 className="text-2xl font-black text-[#002B49]">Reportes Dirección</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Mes
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-slate-500">Cargando reporte...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">Error al cargar el reporte.</p>
      )}

      {data && (
        <div className="space-y-6">
          {/* Salud Comercial */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Salud Comercial
              </p>
              <span className={`text-sm font-bold ${healthLabel(data.commercialHealth)}`}>
                {data.commercialHealth}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full transition-all ${healthColor(data.commercialHealth)}`}
                style={{ width: `${Math.min(100, data.commercialHealth)}%` }}
              />
            </div>
          </div>

          {/* Tarjetas resumen total */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Monto total</p>
              <p className="mt-1 text-lg font-black text-[#002B49]">
                {fmtAmount(data.total.amount)}
              </p>
              <p className="text-xs text-slate-400">
                meta {fmtAmount(data.monthlyAmountGoal)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Unidades total</p>
              <p className="mt-1 text-lg font-black text-[#002B49]">
                {data.total.units}
              </p>
              <p className="text-xs text-slate-400">
                meta {data.monthlyUnitGoal}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Cierres</p>
              <p className="mt-1 text-lg font-black text-[#002B49]">
                {data.total.count}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Nuevos / Existentes</p>
              <p className="mt-1 text-lg font-black text-[#002B49]">
                {data.total.newUnits} / {data.total.existingUnits}
              </p>
              <p className="text-xs text-slate-400">unidades</p>
            </div>
          </div>

          {/* Tabla por tipo de cierre */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Por Tipo de Cierre
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="pb-2 text-right font-medium">Cierres</th>
                    <th className="pb-2 text-right font-medium">Unidades</th>
                    <th className="pb-2 text-right font-medium">Monto</th>
                    <th className="pb-2 text-right font-medium">Nuevos</th>
                    <th className="pb-2 text-right font-medium">Existentes</th>
                  </tr>
                </thead>
                <tbody>
                  <TypeRow label="Equipo Vendedores" report={data.team} />
                  <TypeRow label="Dirección Comercial" report={data.direction} />
                  <TypeRow label="ATC" report={data.atc} />
                  <tr className="border-t-2 border-slate-300 font-semibold">
                    <td className="py-2 pr-4 text-[#002B49]">Total</td>
                    <td className="py-2 text-right text-[#002B49]">{data.total.count}</td>
                    <td className="py-2 text-right text-[#002B49]">{data.total.units}</td>
                    <td className="py-2 text-right text-[#002B49]">{fmtAmount(data.total.amount)}</td>
                    <td className="py-2 text-right text-[#002B49]">{data.total.newUnits}</td>
                    <td className="py-2 text-right text-[#002B49]">{data.total.existingUnits}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla vendedores */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Vendedores
            </p>
            {data.sellers.length === 0 ? (
              <p className="text-sm text-slate-400">Sin ventas registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-4 font-medium">Vendedor</th>
                      <th className="pb-2 text-right font-medium">Cierres</th>
                      <th className="pb-2 text-right font-medium">Unidades</th>
                      <th className="pb-2 text-right font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sellers.map((s) => (
                      <tr
                        key={s.sellerId}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-4 text-slate-700">{s.sellerName}</td>
                        <td className="py-2 text-right text-slate-700">{s.count}</td>
                        <td className="py-2 text-right text-slate-700">{s.units}</td>
                        <td className="py-2 text-right text-slate-700">{fmtAmount(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabla por origen */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Por Origen
            </p>
            {data.bySource.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos de origen.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-4 font-medium">Origen</th>
                      <th className="pb-2 text-right font-medium">Cierres</th>
                      <th className="pb-2 text-right font-medium">Unidades</th>
                      <th className="pb-2 text-right font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySource.map((s) => (
                      <tr
                        key={s.source}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-4 text-slate-700">{s.source}</td>
                        <td className="py-2 text-right text-slate-700">{s.count}</td>
                        <td className="py-2 text-right text-slate-700">{s.units}</td>
                        <td className="py-2 text-right text-slate-700">{fmtAmount(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
