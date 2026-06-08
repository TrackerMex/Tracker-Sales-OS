import { useDashboardSummary } from '../../application/hooks/useDashboardSummary';
import { useSellersSemaphore } from '../../application/hooks/useSellersSemaphore';
import { useOverdueTasks } from '../../application/hooks/useOverdueTasks';
import { KPIStrip } from '../components/KPIStrip';
import { SellerSemaphoreTable } from '../components/SellerSemaphoreTable';
import { AlertsPanel } from '../components/AlertsPanel';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

const CHART_DATA = [2, 5, 3, 8, 6, 4, 9, 7, 11, 6, 8, 10, 7, 12];

function getLast14Days(): string[] {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }));
  }
  return days;
}

function ActivityChart() {
  const W = 560;
  const H = 120;
  const PAD = { top: 10, right: 10, bottom: 28, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...CHART_DATA);
  const labels = getLast14Days();
  const n = CHART_DATA.length;

  const px = (i: number) => PAD.left + (i / (n - 1)) * innerW;
  const py = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const points = CHART_DATA.map((v, i) => ({ x: px(i), y: py(v), v }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillPath = `M${px(0)},${py(0)} ` +
    points.map((p) => `L${p.x},${p.y}`).join(' ') +
    ` L${px(n - 1)},${PAD.top + innerH} L${px(0)},${PAD.top + innerH} Z`;

  const yTicks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {/* Y grid lines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left} y1={py(v)} x2={W - PAD.right} y2={py(v)}
            stroke="#F1F5F9" strokeWidth="1"
          />
          <text x={PAD.left - 4} y={py(v) + 4} textAnchor="end" fontSize="9" fill="#94A3B8">{v}</text>
        </g>
      ))}

      {/* Fill area */}
      <path d={fillPath} fill="rgba(130,188,0,0.08)" />

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#82bc00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#82bc00" />
          <circle cx={p.x} cy={p.y} r="2" fill="#fff" />
        </g>
      ))}

      {/* X labels — show every other one to avoid overlap */}
      {labels.map((label, i) => (
        i % 2 === 0 ? (
          <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">
            {label}
          </text>
        ) : null
      ))}
    </svg>
  );
}

export function DashboardPage() {
  const summary = useDashboardSummary();
  const sellers = useSellersSemaphore();
  const overdue = useOverdueTasks();

  const isLoading = summary.isLoading;
  const data = summary.data;

  const totalOverdue = overdue.data?.length ?? 0;

  return (
    <div>
      {/* Title */}
      <div className="mb-5">
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Dashboard</h1>
        <p style={{ marginTop: 2, fontSize: 12, color: '#94A3B8' }}>Vista general del equipo de ventas</p>
      </div>

      {summary.isError && (
        <p className="mb-4 text-sm text-red-600">No se pudo cargar el resumen del mes.</p>
      )}

      {/* KPI Strip */}
      <KPIStrip
        salesValue={isLoading ? '...' : formatCurrency(data?.totalSalesAmount ?? 0)}
        salesCount={data?.totalSalesCount ?? 0}
        unitsValue={data?.totalUnits ?? 0}
        unitsGoal={150}
        pointsValue={data?.totalPoints ?? 0}
        qualityValue={data?.avgQuality ?? 0}
        isLoading={isLoading}
      />

      {/* 2-column: Activity + Alerts */}
      <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: '1fr 276px' }}>
        {/* Activity chart */}
        <div className="card">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Actividad — últimos 14 días</h3>
          </div>
          <div className="p-4" style={{ height: 170 }}>
            <ActivityChart />
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Alertas operativas</h3>
          </div>
          <div className="p-4">
            <AlertsPanel
              alerts={[
                {
                  label: 'seguimientos vencidos',
                  value: String(totalOverdue),
                  color: 'red',
                },
                {
                  label: 'tareas pendientes manana',
                  value: '0',
                  color: 'amber',
                },
                {
                  label: 'cumplimiento semanal',
                  value: `${data?.avgQuality?.toFixed(0) ?? 0}%`,
                  color: 'green',
                },
                {
                  label: 'prospectos nuevos hoy',
                  value: '0',
                  color: 'navy',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Team performance */}
      <div className="card mt-4">
        <div className="border-b border-[#E2E8F0] px-5 py-3">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Desempeño del equipo</h3>
        </div>
        <SellerSemaphoreTable
          sellers={sellers.data ?? []}
          isLoading={sellers.isLoading}
        />
        {sellers.isError && (
          <p className="px-5 pb-4 text-sm text-red-600">No se pudo cargar el semaforo.</p>
        )}
      </div>
    </div>
  );
}
