import { useState } from 'react';
import { useMonthlyReport } from '../../application/hooks/useMonthlyReport';
import { useWinLoss } from '../../application/hooks/useWinLoss';
import type { MonthlyReport } from '../../domain/reports.types';

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

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.13em',
};

function Bar({ pctVal, dark }: { pctVal: number; dark?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pctVal));
  return (
    <div style={{
      height: 3,
      background: dark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
      borderRadius: 99,
      overflow: 'hidden',
      marginBottom: 4,
    }}>
      <div style={{
        height: '100%',
        width: `${clamped}%`,
        background: '#82bc00',
        borderRadius: 99,
        transition: 'width 0.4s ease',
      }} />
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
      `<html><head><title>Reporte Ejecutivo — Tracker Sales OS</title>` +
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">` +
      `<style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Montserrat','Inter',sans-serif;background:#EEF2F7;padding:32px;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        #executive-slide{max-width:1080px;margin:0 auto}
        @media print{body{background:#fff;padding:0}#executive-slide{border-radius:0!important;border:none!important;box-shadow:none!important}}
      </style>` +
      `</head><body>${node.outerHTML}` +
      `<p style="font-size:11px;color:#94A3B8;margin-top:16px;text-align:center;font-family:sans-serif">Tip: imprime como PDF (Ctrl+P) para compartir o pegar en PowerPoint.</p>` +
      `</body></html>`,
    );
    win.document.close();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Config panel */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Informe Ejecutivo Mensual</div>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
              Separado por Dirección Comercial, ATC y Equipo de Vendedores.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Mes', width: 150, type: 'month' as const, value: month, onChange: (v: string) => setMonth(v) },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)} className="input" style={{ width: f.width }} />
              </div>
            ))}
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta $ equipo</label>
              <input type="number" className="input" style={{ width: 140 }} min={1} value={goalAmount || ''} onChange={(e) => setGoalAmount(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta unidades</label>
              <input type="number" className="input" style={{ width: 120 }} min={1} value={goalUnits || ''} onChange={(e) => setGoalUnits(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Meta $ x vendedor</label>
              <input type="number" className="input" style={{ width: 140 }} min={1} value={goalPerSeller || ''} onChange={(e) => setGoalPerSeller(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <button onClick={saveGoals} className="btn-green">{savedMsg ? 'Guardado' : 'Guardar metas'}</button>
              <button onClick={copyReportText} disabled={!data} className="btn-ghost">
                {copyMsg === 'ok' ? 'Copiado' : copyMsg === 'fail' ? 'Error al copiar' : 'Copiar informe'}
              </button>
              <button onClick={openLamina} className="btn-primary">Abrir lámina</button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando reporte...</p>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#EF4444' }}>Error al cargar el reporte.</p>
          <button className="btn-ghost" onClick={() => refetch()} style={{ fontSize: 12, padding: '4px 10px' }}>Reintentar</button>
        </div>
      )}

      {data && (() => {
        const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);
        const amtFill = goalAmount > 0 ? Math.min(100, (data.total.amount / goalAmount) * 100) : 0;
        const unitFill = goalUnits > 0 ? Math.min(100, (data.total.units / goalUnits) * 100) : 0;

        return (
          <>
            {/* ═══════════════════════════════════════════════════════
                EXECUTIVE SLIDE
            ═══════════════════════════════════════════════════════ */}
            <div
              id="executive-slide"
              style={{
                background: '#fff',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                fontFamily: "'Montserrat Variable','Montserrat','Inter',sans-serif",
              }}
            >
              {/* ── HEADER BAND ── */}
              <div style={{
                background: '#001524',
                padding: '22px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 3, height: 46, background: '#82bc00', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ ...LABEL_STYLE, color: '#82bc00', letterSpacing: '0.2em', marginBottom: 4 }}>
                      Tracker Sales OS
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                      Reporte Ejecutivo
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {month}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', marginBottom: 5 }}>
                    Venta Global
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.035em', lineHeight: 1 }}>
                    {money(data.total.amount)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#82bc00', marginTop: 5 }}>
                    {data.total.units} unidades
                  </div>
                  {updatedAt && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                      Datos al {updatedAt}
                    </div>
                  )}
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* KPI ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {/* Primary: Ventas $ — navy */}
                  <div style={{ background: '#001524', borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ ...LABEL_STYLE, color: '#82bc00', marginBottom: 9 }}>Ventas $</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
                      {money(data.total.amount)}
                    </div>
                    <Bar pctVal={amtFill} dark />
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.38)' }}>
                      {pct(data.total.amount, goalAmount)}% · Meta {money(goalAmount)}
                    </div>
                  </div>
                  {/* Unidades */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 9 }}>Unidades</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#001524', letterSpacing: '-0.02em', marginBottom: 10 }}>
                      {data.total.units}
                    </div>
                    <Bar pctVal={unitFill} />
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>
                      {pct(data.total.units, goalUnits)}% · Meta {goalUnits}
                    </div>
                  </div>
                  {/* Dir. Comercial */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 9 }}>Dir. Comercial</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#001524', letterSpacing: '-0.02em', marginBottom: 5 }}>
                      {money(data.direction.amount)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8' }}>
                      {data.direction.units} unidades · {data.direction.count} cierres
                    </div>
                  </div>
                  {/* ATC */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '16px 18px', border: '1px solid #E2E8F0' }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 9 }}>ATC Existentes</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#001524', letterSpacing: '-0.02em', marginBottom: 5 }}>
                      {money(data.atc.existingAmount)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8' }}>
                      {data.atc.existingUnits} unidades
                    </div>
                  </div>
                </div>

                {/* DIRECCIÓN + EQUIPO */}
                <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12 }}>
                  {/* Dirección */}
                  <div style={{ background: '#F5F3FF', borderRadius: 10, padding: 16, border: '1px solid #EDE9FE' }}>
                    <div style={{ ...LABEL_STYLE, color: '#6D28D9', marginBottom: 12 }}>Dirección Comercial</div>
                    {data.direction.count === 0 ? (
                      <p style={{ fontSize: 12, color: '#A78BFA', margin: 0 }}>Sin registros este mes.</p>
                    ) : (
                      <div style={{ background: '#fff', borderRadius: 7, padding: '12px 14px' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#4C1D95', letterSpacing: '-0.025em', lineHeight: 1 }}>
                          {data.direction.count}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#7C3AED', marginTop: 3, marginBottom: 10 }}>
                          cierres · {data.direction.units} uds
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#001524', letterSpacing: '-0.01em' }}>
                          {money(data.direction.amount)}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Equipo */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, border: '1px solid #E2E8F0' }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 12 }}>Equipo de Vendedores</div>
                    {data.sellers.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Sin ventas del equipo este mes.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            {['Vendedor', 'Unidades', 'Monto', ...(goalPerSeller > 0 ? ['% Meta'] : [])].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '0 12px 8px 0', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.sellers.map((r, i) => {
                            const mp = goalPerSeller > 0 ? (r.amount / goalPerSeller) * 100 : 0;
                            return (
                              <tr key={r.sellerId} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                                <td style={{ padding: '7px 12px 7px 0', fontWeight: 600, color: '#0F172A' }}>{r.sellerName}</td>
                                <td style={{ padding: '7px 12px 7px 0', color: '#475569' }}>{r.units}</td>
                                <td style={{ padding: '7px 12px 7px 0', fontWeight: 700, color: '#001524' }}>{money(r.amount)}</td>
                                {goalPerSeller > 0 && (
                                  <td style={{ padding: '7px 0', fontWeight: 700, fontSize: 11, color: mp >= 100 ? '#4a7c00' : '#B45309' }}>
                                    {mp.toFixed(1)}%
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* ATC + ORIGEN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 16, border: '1px solid #D1FAE5' }}>
                    <div style={{ ...LABEL_STYLE, color: '#15803D', marginBottom: 10 }}>ATC — Atención a Clientes</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#14532D', letterSpacing: '-0.02em' }}>
                      {money(data.atc.existingAmount)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#16A34A', marginTop: 5 }}>
                      {data.atc.existingUnits} unidades de clientes existentes
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, border: '1px solid #E2E8F0' }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 10 }}>Origen de Cuentas</div>
                    {data.bySource.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Sin datos de origen.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                        {data.bySource.slice(0, 6).map((s) => (
                          <div key={s.source} style={{ background: '#fff', borderRadius: 7, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>{s.source}</div>
                            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                              {s.count} ctas · {money(s.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* WIN / LOSS */}
                {!winLossLoading && winLoss && winLoss.totalDeals > 0 && (
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 18 }}>
                    <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 14 }}>Win / Loss — Conversión por Etapa</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                      <div style={{ background: '#001524', borderRadius: 9, padding: '12px 14px' }}>
                        <div style={{ ...LABEL_STYLE, color: '#82bc00', marginBottom: 6 }}>Win Rate</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{winLoss.winRate}%</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>{winLoss.totalDeals} oportunidades</div>
                      </div>
                      {[
                        { label: 'Ganados', value: winLoss.won },
                        { label: 'Perdidos', value: winLoss.lost },
                        { label: 'Abiertos', value: winLoss.open },
                      ].map((k) => (
                        <div key={k.label} style={{ background: '#F8FAFC', borderRadius: 9, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                          <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 6 }}>{k.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#001524', letterSpacing: '-0.03em' }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {winLoss.funnel.length > 0 && (
                      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                        <div style={{ ...LABEL_STYLE, color: '#94A3B8', marginBottom: 8 }}>Embudo de Conversión</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              {['Etapa', 'Alcanzados', 'Conversión %', 'Días prom.'].map((h) => (
                                <th key={h} style={{ textAlign: 'left', padding: '0 12px 7px 0', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {winLoss.funnel.map((f, i) => (
                              <tr key={f.stage} style={{ borderTop: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '7px 12px 7px 0', fontWeight: 600, color: '#0F172A' }}>{f.stage}</td>
                                <td style={{ padding: '7px 12px 7px 0', color: '#475569' }}>{f.reached}</td>
                                <td style={{ padding: '7px 12px 7px 0', color: '#475569' }}>{i === 0 ? '—' : `${f.conversionFromPrevious}%`}</td>
                                <td style={{ padding: '7px 0', color: '#475569' }}>{f.avgDaysInStage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(winLoss.lossesByOrigin.length > 0 || winLoss.lossReasons.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <div style={{ ...LABEL_STYLE, color: '#94A3B8', marginBottom: 8 }}>Perdidos por etapa de origen</div>
                          {winLoss.lossesByOrigin.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin pérdidas registradas.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr>
                                  {['Etapa', 'Pérdidas', '%'].map((h) => (
                                    <th key={h} style={{ textAlign: 'left', padding: '0 10px 7px 0', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {winLoss.lossesByOrigin.map((l, i) => (
                                  <tr key={l.originStage} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                                    <td style={{ padding: '7px 10px 7px 0', fontWeight: 600, color: '#0F172A' }}>{l.originStage}</td>
                                    <td style={{ padding: '7px 10px 7px 0', color: '#475569' }}>{l.count}</td>
                                    <td style={{ padding: '7px 0', color: '#475569' }}>{l.percentage}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        <div>
                          <div style={{ ...LABEL_STYLE, color: '#94A3B8', marginBottom: 8 }}>Motivos de pérdida</div>
                          {winLoss.lossReasons.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin pérdidas registradas.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr>
                                  {['Motivo', 'Pérdidas'].map((h) => (
                                    <th key={h} style={{ textAlign: 'left', padding: '0 10px 7px 0', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {winLoss.lossReasons.map((r, i) => (
                                  <tr key={r.reason} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                                    <td style={{ padding: '7px 10px 7px 0', fontWeight: 600, color: '#0F172A' }}>
                                      {LOSS_REASON_LABELS[r.reason] ?? r.reason}
                                    </td>
                                    <td style={{ padding: '7px 0', color: '#475569' }}>{r.count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ANÁLISIS EJECUTIVO IA */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 18 }}>
                  <div style={{ ...LABEL_STYLE, color: '#64748B', marginBottom: 14 }}>Análisis Ejecutivo IA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ background: '#F0FDF4', borderRadius: 9, padding: 14, border: '1px solid #D1FAE5' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#15803D', marginBottom: 8 }}>Fortalezas</div>
                      <ul style={{ fontSize: 12, color: '#166534', paddingLeft: 14, lineHeight: 1.65, margin: 0 }}>
                        <AnalysisList items={ai.strengths} />
                      </ul>
                    </div>
                    <div style={{ background: '#FFFBEB', borderRadius: 9, padding: 14, border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#B45309', marginBottom: 8 }}>Áreas de Oportunidad</div>
                      <ul style={{ fontSize: 12, color: '#92400E', paddingLeft: 14, lineHeight: 1.65, margin: 0 }}>
                        <AnalysisList items={ai.opportunities} />
                      </ul>
                    </div>
                    <div style={{ background: '#FEF2F2', borderRadius: 9, padding: 14, border: '1px solid #FECACA' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#B91C1C', marginBottom: 8 }}>Focos Rojos</div>
                      <ul style={{ fontSize: 12, color: '#991B1B', paddingLeft: 14, lineHeight: 1.65, margin: 0 }}>
                        <AnalysisList items={ai.redFlags} />
                      </ul>
                    </div>
                    <div style={{ background: '#EEF2FF', borderRadius: 9, padding: 14, border: '1px solid #C7D2FE' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#3730A3', marginBottom: 8 }}>Recomendaciones para Dirección</div>
                      <ul style={{ fontSize: 12, color: '#312E81', paddingLeft: 14, lineHeight: 1.65, margin: 0 }}>
                        <AnalysisList items={ai.recommendations} />
                      </ul>
                    </div>
                  </div>

                  {/* HEALTH SCORE */}
                  <div style={{
                    background: '#001524',
                    borderRadius: 10,
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}>
                    <div>
                      <div style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', marginBottom: 7 }}>
                        Salud Comercial General
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5, maxWidth: 380 }}>
                        {ai.status}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 54, fontWeight: 900, color: healthColor(ai.health), letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {ai.health}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>/ 100</div>
                    </div>
                  </div>
                </div>

              </div>{/* /body */}
            </div>{/* /executive-slide */}

            {/* Detalle Top Vendedores */}
            {data.sellers.length > 0 && (
              <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
                <div className="slabel" style={{ marginBottom: 12 }}>Detalle Top Vendedores</div>
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
                      const metaPct = goalPerSeller > 0 ? (r.amount / goalPerSeller) * 100 : 0;
                      const metaColor = metaPct >= 100 ? '#4a7c00' : '#B45309';
                      return (
                        <tr key={r.sellerId}>
                          <td style={{ fontWeight: 600, color: '#0F172A' }}>{r.sellerName}</td>
                          <td>{r.units}</td>
                          <td style={{ fontWeight: 600 }}>{money(r.amount)}</td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 600, color: metaColor }}>
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
                meta de {money(goalAmount)} ({((data.total.amount / goalAmount) * 100).toFixed(2)}%).
                Unidades: {data.total.units} contra meta de {goalUnits} ({((data.total.units / goalUnits) * 100).toFixed(2)}%).
                <br /><br />
                <b>Dirección Comercial:</b> {data.direction.units} unidades por {money(data.direction.amount)}.
                <br />
                <b>ATC:</b> {data.atc.existingUnits} unidades existentes por {money(data.atc.existingAmount)}.
                {data.sellers.length > 0 && (
                  <>
                    <br />
                    <b>Equipo:</b>{' '}
                    {data.sellers.slice(0, 5).map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`).join(' · ')}.
                  </>
                )}
                {data.bySource.length > 0 && (
                  <>
                    <br />
                    <b>Origen de cuentas:</b>{' '}
                    {data.bySource.slice(0, 5).map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`).join(' · ')}.
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
