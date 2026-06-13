import { useState } from 'react';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import { useWinLoss } from '../../application/hooks/useWinLoss';
import type {
  MonthlyReport,
  SellerSalesReport,
  SourceBreakdown,
  WinLossReport,
} from '../../domain/reports.types';

const LOSS_REASON_LABELS: Record<string, string> = {
  precio: 'Precio',
  competencia: 'Competencia',
  sin_respuesta: 'Sin respuesta',
  timing: 'Timing',
  otro: 'Otro',
  'sin especificar': 'Sin especificar',
};

const STORAGE_KEY = 'tracker-report-goals';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function money(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(value: number, goal: number): string {
  if (!goal) return '0.0';
  return ((value / goal) * 100).toFixed(1);
}

/* Exact logic from standalone executiveAIAnalysis */
function buildAnalysis(
  data: MonthlyReport,
  goalAmount: number,
  goalUnits: number,
  goalPerSeller: number,
) {
  const amtPct = goalAmount > 0 ? (data.total.amount / goalAmount) * 100 : 0;
  const unitPct = goalUnits > 0 ? (data.total.units / goalUnits) * 100 : 0;
  const sellerRows = data.sellers;
  const topSeller = [...sellerRows].sort((a, b) => b.amount - a.amount)[0];
  const lowSellers = sellerRows.filter((r) => r.amount < goalPerSeller * 0.5);

  const strengths: string[] = [];
  const opportunities: string[] = [];
  const redFlags: string[] = [];
  const recommendations: string[] = [];

  if (amtPct >= 80) strengths.push(`Ventas en ${amtPct.toFixed(1)}% de la meta mensual.`);
  if (topSeller && topSeller.amount > 0)
    strengths.push(`${topSeller.sellerName} lidera ventas con ${money(topSeller.amount)}.`);

  if (amtPct < 50) opportunities.push('Ventas por debajo del 50% de la meta. Revisar calidad de pipeline.');
  if (unitPct < 50) opportunities.push(`Unidades en ${unitPct.toFixed(0)}% de meta. Revisar estrategia de volumen.`);
  if (lowSellers.length > 0)
    opportunities.push(`${lowSellers.map((s) => s.sellerName).join(', ')} por debajo del 50% de meta individual.`);

  if (unitPct < 30) redFlags.push('Unidades muy por debajo de la meta.');
  if (data.total.count < 5) redFlags.push('Volumen de actividad comercial muy bajo para el período.');

  if (amtPct < 80)
    recommendations.push('Revisión semanal de pipeline: identificar oportunidades en fase Propuesta/Negociación para cierre.');
  recommendations.push('Priorizar conversión de llamada a reunión y de reunión a propuesta.');

  const health = data.commercialHealth;
  const hasRedFlags = redFlags.length > 0;
  const status =
    health >= 80
      ? hasRedFlags
        ? 'Salud alta, pero con alertas activas. Revisar focos rojos.'
        : 'Equipo en zona verde. Mantener ritmo.'
      : health >= 50
        ? 'Atención requerida en actividad o calidad.'
        : 'Intervención urgente necesaria.';

  return { strengths, opportunities, redFlags, recommendations, health, status };
}

function healthColor(h: number): string {
  if (h >= 65) return '#82bc00';
  if (h >= 45) return '#F59E0B';
  return '#EF4444';
}

function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { amount: number; units: number; perSeller: number };
  } catch {}
  return null;
}

function AnalysisList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <li style={{ color: '#94A3B8' }}>Sin hallazgos para este periodo.</li>;
  }
  return (
    <>
      {items.map((x, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          {x}
        </li>
      ))}
    </>
  );
}

function SellerTable({ sellers }: { sellers: SellerSalesReport[] }) {
  if (sellers.length === 0) {
    return <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin ventas del equipo este mes.</p>;
  }
  return (
    <table className="dt">
      <thead>
        <tr>
          <th>Vendedor</th>
          <th>Unidades</th>
          <th>Monto</th>
        </tr>
      </thead>
      <tbody>
        {sellers.map((r) => (
          <tr key={r.sellerId}>
            <td style={{ fontWeight: 600, color: '#0F172A' }}>{r.sellerName}</td>
            <td>{r.units}</td>
            <td style={{ fontWeight: 600 }}>{money(r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SourceGrid({ sources }: { sources: SourceBreakdown[] }) {
  if (sources.length === 0) {
    return <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin datos de origen.</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 7 }}>
      {sources.slice(0, 6).map((s) => (
        <div key={s.source} style={{ background: '#fff', borderRadius: 7, padding: 9 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{s.source}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {s.count} cuentas · {money(s.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function WinLossSection({
  data,
  isLoading,
}: {
  data: WinLossReport | undefined;
  isLoading: boolean;
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 12 }}>
        Win/Loss y conversión por etapa
      </div>

      {isLoading && <p style={{ fontSize: 12, color: '#94A3B8' }}>Cargando análisis...</p>}

      {!isLoading && (!data || data.totalDeals === 0) && (
        <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin oportunidades registradas todavía.</p>
      )}

      {!isLoading && data && data.totalDeals > 0 && (
        <>
          <div className="kpi-strip" style={{ marginBottom: 14 }}>
            <div className="kpi-cell ac">
              <div className="kl">Win rate</div>
              <div className="kv" style={{ fontSize: 17 }}>{data.winRate}%</div>
              <div className="ksb">{data.totalDeals} oportunidades</div>
            </div>
            <div className="kpi-cell">
              <div className="kl">Ganados</div>
              <div className="kv">{data.won}</div>
            </div>
            <div className="kpi-cell">
              <div className="kl">Perdidos</div>
              <div className="kv">{data.lost}</div>
            </div>
            <div className="kpi-cell">
              <div className="kl">Abiertos</div>
              <div className="kv">{data.open}</div>
            </div>
          </div>

          <div style={{ marginBottom: 14, overflowX: 'auto' }}>
            <div className="slabel" style={{ marginBottom: 8 }}>Embudo de conversión</div>
            <table className="dt">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Alcanzados</th>
                  <th>Conversión %</th>
                  <th>Días prom.</th>
                </tr>
              </thead>
              <tbody>
                {data.funnel.map((f, i) => (
                  <tr key={f.stage}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{f.stage}</td>
                    <td>{f.reached}</td>
                    <td>{i === 0 ? '—' : `${f.conversionFromPrevious}%`}</td>
                    <td>{f.avgDaysInStage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="slabel" style={{ marginBottom: 8 }}>Perdidos por etapa de origen</div>
              {data.lossesByOrigin.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin pérdidas registradas.</p>
              ) : (
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Etapa</th>
                      <th>Pérdidas</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lossesByOrigin.map((l) => (
                      <tr key={l.originStage}>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{l.originStage}</td>
                        <td>{l.count}</td>
                        <td>{l.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <div className="slabel" style={{ marginBottom: 8 }}>Motivos de pérdida</div>
              {data.lossReasons.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin pérdidas registradas.</p>
              ) : (
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Motivo</th>
                      <th>Pérdidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lossReasons.map((r) => (
                      <tr key={r.reason}>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>
                          {LOSS_REASON_LABELS[r.reason] ?? r.reason}
                        </td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const { data, isLoading, error, refetch, dataUpdatedAt } = useMonthlyReport(month);
  const { data: winLoss, isLoading: winLossLoading } = useWinLoss();

  const [goalAmount, setGoalAmount] = useState<number>(() => loadGoals()?.amount ?? 600000);
  const [goalUnits, setGoalUnits] = useState<number>(() => loadGoals()?.units ?? 150);
  const [goalPerSeller, setGoalPerSeller] = useState<number>(() => loadGoals()?.perSeller ?? 150000);
  const [savedMsg, setSavedMsg] = useState(false);
  const [copyMsg, setCopyMsg] = useState<'idle' | 'ok' | 'fail'>('idle');
  const updatedAt = dataUpdatedAt > 0
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : null;

  function saveGoals() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ amount: goalAmount, units: goalUnits, perSeller: goalPerSeller }),
    );
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function copyReportText() {
    if (!data) return;
    const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);
    const sellerSummary = data.sellers
      .map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`)
      .join(' · ');
    const sourceSummary = data.bySource
      .slice(0, 5)
      .map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`)
      .join(' · ');
    const lines = [
      `Meta vs Logro ${month}: Ventas globales: ${money(data.total.amount)} contra meta de ${money(goalAmount)} (${((data.total.amount / goalAmount) * 100).toFixed(2)}%). Unidades: ${data.total.units} contra meta de ${goalUnits} (${((data.total.units / goalUnits) * 100).toFixed(2)}%).`,
      `Dirección Comercial: ${data.direction.units} unidades por ${money(data.direction.amount)}.`,
      `ATC (Atención a Clientes): ${data.atc.existingUnits} unidades existentes por ${money(data.atc.existingAmount)}.`,
      `Equipo: ${sellerSummary || 'Sin ventas del equipo.'}.`,
      `Origen de cuentas: ${sourceSummary || 'Sin datos.'}.`,
      `Análisis IA: Salud comercial ${ai.health}/100 — ${ai.status}`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'))
      .then(() => { setCopyMsg('ok'); setTimeout(() => setCopyMsg('idle'), 2000); })
      .catch(() => { setCopyMsg('fail'); setTimeout(() => setCopyMsg('idle'), 3000); });
  }

  function openLamina() {
    const node = document.getElementById('executive-slide');
    if (!node) { window.print(); return; }
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.write(
      `<html><head><title>Reporte Ejecutivo Tracker</title>` +
      `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">` +
      `<style>body{font-family:'Inter',sans-serif;background:#f1f5f9;padding:24px;color:#0F172A;}</style>` +
      `</head><body>${node.outerHTML}` +
      `<p style="font-size:12px;color:#94A3B8;margin-top:16px">Tip: captura esta lámina o imprime como PDF para pegarla en PowerPoint.</p>` +
      `</body></html>`,
    );
    win.document.close();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Config panel */}
      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Informe Ejecutivo Mensual
            </div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
              Separado por Dirección Comercial, ATC (Atención a Clientes) y Equipo de Vendedores.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Mes
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input"
                style={{ width: 150 }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Meta $ equipo
              </label>
              <input
                type="number"
                className="input"
                style={{ width: 140 }}
                min={1}
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Meta unidades
              </label>
              <input
                type="number"
                className="input"
                style={{ width: 120 }}
                min={1}
                value={goalUnits}
                onChange={(e) => setGoalUnits(Number(e.target.value))}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Meta $ x vendedor
              </label>
              <input
                type="number"
                className="input"
                style={{ width: 140 }}
                min={1}
                value={goalPerSeller}
                onChange={(e) => setGoalPerSeller(Number(e.target.value))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <button onClick={saveGoals} className="btn-green">
                {savedMsg ? 'Guardado' : 'Guardar metas'}
              </button>
              <button onClick={copyReportText} disabled={!data} className="btn-ghost">
                {copyMsg === 'ok' ? 'Copiado' : copyMsg === 'fail' ? 'Error al copiar' : 'Copiar informe'}
              </button>
              <button onClick={openLamina} className="btn-primary">
                Abrir lámina
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando reporte...</p>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#EF4444' }}>Error al cargar el reporte.</p>
          <button className="btn-ghost" onClick={() => refetch()} style={{ fontSize: 12, padding: '4px 10px' }}>
            Reintentar
          </button>
        </div>
      )}

      {data && (() => {
        const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);
        return (
          <>
            {/* Executive slide */}
            <div
              id="executive-slide"
              style={{
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 24,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#001524',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    TRACKER SALES OS
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginTop: 3,
                    }}
                  >
                    Reporte Ejecutivo {month}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Resultado Global
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: '#001524',
                      letterSpacing: '-0.02em',
                      marginTop: 2,
                    }}
                  >
                    {money(data.total.amount)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#82bc00', marginTop: 2 }}>
                    {data.total.units} unidades
                  </div>
                  {updatedAt && (
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                      Datos al {updatedAt}
                    </div>
                  )}
                </div>
              </div>

              {/* KPI strip */}
              <div className="kpi-strip" style={{ marginBottom: 18 }}>
                <div className="kpi-cell ac">
                  <div className="kl">Ventas $</div>
                  <div className="kv" style={{ fontSize: 17 }}>
                    {money(data.total.amount)}
                  </div>
                  <div className="ksb">
                    Meta: {money(goalAmount)} · {pct(data.total.amount, goalAmount)}%
                  </div>
                </div>
                <div className="kpi-cell">
                  <div className="kl">Unidades</div>
                  <div className="kv">{data.total.units}</div>
                  <div className="ksb">
                    Meta: {goalUnits} · {pct(data.total.units, goalUnits)}%
                  </div>
                </div>
                <div className="kpi-cell">
                  <div className="kl">Dirección Comercial</div>
                  <div className="kv" style={{ fontSize: 17 }}>
                    {money(data.direction.amount)}
                  </div>
                  <div className="ksb">{data.direction.units} unidades</div>
                </div>
                <div className="kpi-cell">
                  <div className="kl"><abbr title="Atención a Clientes" style={{ textDecoration: 'none' }}>ATC</abbr> Existentes</div>
                  <div className="kv" style={{ fontSize: 17 }}>
                    {money(data.atc.existingAmount)}
                  </div>
                  <div className="ksb">{data.atc.existingUnits} unidades</div>
                </div>
              </div>

              {/* Dirección + Equipo */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '240px 1fr',
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div style={{ background: '#EDE9FE', borderRadius: 10, padding: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#6D28D9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}
                  >
                    Dirección Comercial
                  </div>
                  <p style={{ fontSize: 12, color: '#5B21B6', marginBottom: 10 }}>
                    Cuentas estratégicas cerradas por Dirección.
                  </p>
                  {data.direction.count === 0 ? (
                    <p style={{ fontSize: 12, color: '#94A3B8' }}>
                      Sin registros de Dirección este mes.
                    </p>
                  ) : (
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: 7,
                        padding: 9,
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#001524' }}>
                        {data.direction.count} cierres
                      </p>
                      <p style={{ fontSize: 11, color: '#64748B' }}>
                        {data.direction.units} unidades · {money(data.direction.amount)}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}
                  >
                    Equipo de Vendedores
                  </div>
                  <SellerTable sellers={data.sellers} />
                </div>
              </div>

              {/* ATC + Origen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#15803D',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    <abbr title="Atención a Clientes" style={{ textDecoration: 'none' }}>ATC</abbr>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                    {data.atc.existingUnits} unidades existentes · {money(data.atc.existingAmount)}
                  </p>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}
                  >
                    Origen de cuentas
                  </div>
                  <SourceGrid sources={data.bySource} />
                </div>
              </div>

              {/* Win/Loss y conversión por etapa */}
              <WinLossSection data={winLoss} isLoading={winLossLoading} />

              {/* Análisis Ejecutivo IA */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 12,
                  }}
                >
                  Análisis Ejecutivo IA
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14 }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 8 }}
                    >
                      Fortalezas detectadas
                    </div>
                    <ul
                      style={{
                        fontSize: 12,
                        color: '#166534',
                        paddingLeft: 16,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      <AnalysisList items={ai.strengths} />
                    </ul>
                  </div>
                  <div style={{ background: '#FFF7ED', borderRadius: 9, padding: 14 }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 8 }}
                    >
                      Áreas de oportunidad
                    </div>
                    <ul
                      style={{
                        fontSize: 12,
                        color: '#9A3412',
                        paddingLeft: 16,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      <AnalysisList items={ai.opportunities} />
                    </ul>
                  </div>
                </div>

                <div
                  style={{
                    background: '#FEF2F2',
                    borderRadius: 9,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', marginBottom: 8 }}
                  >
                    Focos rojos
                  </div>
                  <ul
                    style={{
                      fontSize: 12,
                      color: '#991B1B',
                      paddingLeft: 16,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <AnalysisList items={ai.redFlags} />
                  </ul>
                </div>

                <div
                  style={{
                    background: '#EDE9FE',
                    borderRadius: 9,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', marginBottom: 8 }}
                  >
                    Recomendaciones para Dirección
                  </div>
                  <ul
                    style={{
                      fontSize: 12,
                      color: '#5B21B6',
                      paddingLeft: 16,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <AnalysisList items={ai.recommendations} />
                  </ul>
                </div>

                <div
                  style={{
                    background: '#001524',
                    borderRadius: 9,
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 6,
                    }}
                  >
                    Salud Comercial General
                  </div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: healthColor(ai.health),
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {ai.health}
                    <span
                      style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}
                    >
                      /100
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.65)',
                      marginTop: 4,
                    }}
                  >
                    {ai.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle Top Vendedores */}
            {data.sellers.length > 0 && (
              <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
                <div className="slabel" style={{ marginBottom: 12 }}>
                  Detalle Top Vendedores
                </div>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Unidades</th>
                      <th>Monto</th>
                      <th>% Meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sellers.map((r) => {
                      const metaPct = goalPerSeller > 0
                        ? (r.amount / goalPerSeller) * 100
                        : 0;
                      const metaColor =
                        metaPct >= 100 ? '#4a7c00' : '#B45309';
                      return (
                        <tr key={r.sellerId}>
                          <td style={{ fontWeight: 600, color: '#0F172A' }}>{r.sellerName}</td>
                          <td>{r.units}</td>
                          <td style={{ fontWeight: 600 }}>{money(r.amount)}</td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: metaColor,
                              }}
                            >
                              {metaPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumen para Dirección */}
            <div id="executive-report-text" className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                Resumen para Dirección
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#475569' }}>
                <b>Meta vs Logro {month}:</b> Ventas globales: {money(data.total.amount)} contra
                meta de {money(goalAmount)} (
                {((data.total.amount / goalAmount) * 100).toFixed(2)}%). Unidades:{' '}
                {data.total.units} contra meta de {goalUnits} (
                {((data.total.units / goalUnits) * 100).toFixed(2)}%).
                <br />
                <br />
                <b>Dirección Comercial:</b> {data.direction.units} unidades por{' '}
                {money(data.direction.amount)}.
                <br />
                <b><abbr title="Atención a Clientes" style={{ textDecoration: 'none' }}>ATC</abbr>:</b> {data.atc.existingUnits} unidades existentes por{' '}
                {money(data.atc.existingAmount)}.
                {data.sellers.length > 0 && (
                  <>
                    <br />
                    <b>Equipo:</b>{' '}
                    {data.sellers
                      .slice(0, 5)
                      .map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`)
                      .join(' · ')}
                    .
                  </>
                )}
                {data.bySource.length > 0 && (
                  <>
                    <br />
                    <b>Origen de cuentas:</b>{' '}
                    {data.bySource
                      .slice(0, 5)
                      .map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`)
                      .join(' · ')}
                    .
                  </>
                )}
                <br />
                <b>Análisis IA:</b> Salud comercial {ai.health}/100 — {ai.status}
              </p>
            </div>
          </>
        );
      })()}
    </div>
  );
}
