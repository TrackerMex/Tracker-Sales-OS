import type { MonthlyReport, WinLossReport } from '../../domain/reports.types';

const LOSS_REASON_LABELS: Record<string, string> = {
  precio: 'Precio',
  competencia: 'Competencia',
  sin_respuesta: 'Sin respuesta',
  timing: 'Timing',
  otro: 'Otro',
  'sin especificar': 'Sin especificar',
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.13em',
};

export function money(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(value: number, goal: number): string {
  if (!goal) return '0.0';
  return ((value / goal) * 100).toFixed(1);
}

export function buildAnalysis(
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

export interface ExecutiveSlideProps {
  data: MonthlyReport;
  winLoss?: WinLossReport | null;
  winLossLoading?: boolean;
  goalAmount: number;
  goalUnits: number;
  goalPerSeller: number;
  month: string;
  updatedAt?: string | null;
}

export function ExecutiveSlide({
  data,
  winLoss,
  winLossLoading,
  goalAmount,
  goalUnits,
  goalPerSeller,
  month,
  updatedAt,
}: ExecutiveSlideProps) {
  const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller);
  const amtFill = goalAmount > 0 ? Math.min(100, (data.total.amount / goalAmount) * 100) : 0;
  const unitFill = goalUnits > 0 ? Math.min(100, (data.total.units / goalUnits) * 100) : 0;

  return (
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
    </div>
  );
}
