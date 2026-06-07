import { useAppStore } from '@/shared/store/app.store';
import { useMiDia } from '../../application/hooks/useMiDia';

interface MetricCardProps {
  title: string;
  current: number;
  goal: number;
}

function MetricCard({ title, current, goal }: MetricCardProps) {
  const percent = Math.min(100, (current / goal) * 100);
  const barColor =
    percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {current} <span className="text-sm font-normal text-slate-400">/ {goal}</span>
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

const SEMAPHORE_STYLES = {
  verde: { badge: 'bg-green-100 text-green-700', label: 'Todo OK' },
  ambar: { badge: 'bg-amber-100 text-amber-700', label: 'Atención' },
  rojo: { badge: 'bg-red-100 text-red-700', label: 'Urgente' },
  morado: { badge: 'bg-purple-100 text-purple-700', label: 'Sugerencia del Coach' },
};

export function MiDiaPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const { data, isLoading, isError } = useMiDia(currentUser?.sellerId);

  if (!currentUser?.sellerId) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">No tienes un perfil de vendedor asociado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Error cargando datos</p>
      </div>
    );
  }

  const semStyle = SEMAPHORE_STYLES[data.semaphore];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xl font-black text-[#002B49]">Mi Día</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${semStyle.badge}`}>
          {semStyle.label}
        </span>
        <span className="text-sm text-slate-500">{data.sellerName}</span>
      </div>

      {data.overdueCount > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            Tienes {data.overdueCount} seguimiento{data.overdueCount !== 1 ? 's' : ''} vencido
            {data.overdueCount !== 1 ? 's' : ''} — atiéndelos primero.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Puntos hoy"
          current={data.pointsToday}
          goal={data.dailyPointsGoal}
        />
        <MetricCard
          title="Llamadas hoy"
          current={data.callsToday}
          goal={data.dailyCallsGoal}
        />
        <MetricCard
          title="Tareas mañana"
          current={data.tomorrowTasksCount}
          goal={data.tomorrowTasksGoal}
        />
        <MetricCard
          title="Prospectos nuevos"
          current={data.newProspectsToday}
          goal={data.newProspectsGoal}
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Seguimientos vencidos</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              data.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {data.overdueCount}
          </p>
        </div>
      </div>

      {data.coachTips.length > 0 && (
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-purple-800 mb-2">Sugerencias del Coach</p>
          <ul className="list-disc list-inside space-y-1">
            {data.coachTips.map((tip, index) => (
              <li key={index} className="text-purple-800 text-sm">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
