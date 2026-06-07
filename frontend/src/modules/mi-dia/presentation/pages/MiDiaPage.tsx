import { useAppStore } from '@/shared/store/app.store';
import { useMiDia } from '../../application/hooks/useMiDia';

interface MetricCardProps {
  title: string;
  current: number;
  goal: number;
}

function getBarColor(pct: number): string {
  if (pct >= 100) return '#82bc00';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function MetricCard({ title, current, goal }: MetricCardProps) {
  const percent = Math.min(100, (current / goal) * 100);

  return (
    <div className="kpi-cell" style={{ borderRadius: 10, border: '1px solid #E2E8F0' }}>
      <div className="kl">{title}</div>
      <div className="kv" style={{ fontSize: 20 }}>
        {current} <span style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>/ {goal}</span>
      </div>
      <div className="prog mt-3">
        <div
          className="prog-fill"
          style={{ width: `${percent}%`, backgroundColor: getBarColor(percent) }}
        />
      </div>
    </div>
  );
}

const SEMAPHORE_TAG: Record<string, string> = {
  verde: 'tag tag-green',
  ambar: 'tag tag-amber',
  rojo: 'tag tag-red',
  morado: 'tag tag-purple',
};

const SEMAPHORE_LABEL: Record<string, string> = {
  verde: 'Todo OK',
  ambar: 'Atención',
  rojo: 'Urgente',
  morado: 'Sugerencia del Coach',
};

export function MiDiaPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const { data, isLoading, isError } = useMiDia(currentUser?.sellerId);

  if (!currentUser?.sellerId) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>No tienes un perfil de vendedor asociado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#EF4444' }}>Error cargando datos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Mi Día</h1>
        <span className={SEMAPHORE_TAG[data.semaphore]}>
          {SEMAPHORE_LABEL[data.semaphore]}
        </span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>{data.sellerName}</span>
      </div>

      {data.overdueCount > 0 && (
        <div
          className="mb-4 rounded-lg px-4 py-3"
          style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: '#B91C1C' }}>
            Tienes {data.overdueCount} seguimiento{data.overdueCount !== 1 ? 's' : ''} vencido
            {data.overdueCount !== 1 ? 's' : ''} — atiéndelos primero.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Puntos hoy" current={data.pointsToday} goal={data.dailyPointsGoal} />
        <MetricCard title="Llamadas hoy" current={data.callsToday} goal={data.dailyCallsGoal} />
        <MetricCard title="Tareas mañana" current={data.tomorrowTasksCount} goal={data.tomorrowTasksGoal} />
        <MetricCard title="Prospectos nuevos" current={data.newProspectsToday} goal={data.newProspectsGoal} />
      </div>

      <div
        className="mt-3 kpi-cell"
        style={{ borderRadius: 10, border: '1px solid #E2E8F0', display: 'inline-block', minWidth: 160 }}
      >
        <div className="kl">Seguimientos vencidos</div>
        <div className="kv" style={{ color: data.overdueCount > 0 ? '#EF4444' : '#0F172A' }}>
          {data.overdueCount}
        </div>
      </div>

      {data.coachTips.length > 0 && (
        <div className="ai-box mt-5">
          <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Sugerencias del Coach
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.coachTips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
