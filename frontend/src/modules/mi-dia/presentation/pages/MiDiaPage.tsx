import { useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/shared/store/app.store';
import { useMiDia } from '../../application/hooks/useMiDia';
import { useTodayTasks } from '../../../tasks/application/hooks/useTodayTasks';
import { useCompleteTask } from '../../../tasks/application/hooks/useCompleteTask';

const semaphoreTagMap: Record<string, string> = {
  verde: 'green',
  ambar: 'amber',
  rojo: 'red',
  morado: 'purple',
};

const semaphoreLabel: Record<string, string> = {
  verde: 'Todo OK',
  ambar: 'Atención',
  rojo: 'Urgente',
  morado: 'Coach',
};

function stripColor(current: number, goal: number): string {
  if (goal === 0) return '#82bc00';
  const pct = current / goal;
  if (pct >= 1) return '#82bc00';
  if (pct >= 0.5) return '#F59E0B';
  return '#EF4444';
}

function formatTime(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return '';
  const d = new Date(scheduledAt);
  if (isNaN(d.getTime())) return scheduledAt;
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) {
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
}

export function MiDiaPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const { data, isLoading, isError } = useMiDia(currentUser?.sellerId);
  const { data: tasks } = useTodayTasks();
  const { mutate: completeTask } = useCompleteTask();

  if (!currentUser?.sellerId) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>No tienes un perfil de vendedor asociado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 13, color: '#EF4444' }}>Error cargando datos</p>
      </div>
    );
  }

  const taskList = tasks ?? [];

  const metrics = [
    {
      label: 'PUNTOS HOY',
      current: data.pointsToday,
      goal: data.dailyPointsGoal,
      goalText: `/ ${data.dailyPointsGoal}`,
    },
    {
      label: 'LLAMADAS',
      current: data.callsToday,
      goal: data.dailyCallsGoal,
      goalText: `/ ${data.dailyCallsGoal}`,
    },
    {
      label: 'TAREAS MAÑANA',
      current: data.tomorrowTasksCount,
      goal: data.tomorrowTasksGoal,
      goalText: `meta: ${data.tomorrowTasksGoal}`,
    },
    {
      label: 'PROSPECTOS',
      current: data.newProspectsToday,
      goal: data.newProspectsGoal,
      goalText: `/ ${data.newProspectsGoal}`,
    },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: 2, minWidth: 0 }}>
        {/* TERMÓMETRO OPERATIVO */}
        <p className="slabel" style={{ marginBottom: 12 }}>
          TERMÓMETRO OPERATIVO
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {metrics.map((m) => {
            const color = stripColor(m.current, m.goal);
            return (
              <div
                key={m.label}
                className="card"
                style={{
                  padding: 12,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  paddingBottom: 16,
                }}
              >
                <p className="slabel" style={{ marginBottom: 4 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  {m.current}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8' }}>{m.goalText}</p>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: color,
                  }}
                />
              </div>
            );
          })}

          {/* VENCIDOS */}
          <div
            className="card"
            style={{
              padding: 12,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              paddingBottom: 16,
            }}
          >
            <p className="slabel" style={{ marginBottom: 4 }}>
              VENCIDOS
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {data.overdueCount}
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>&nbsp;</p>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                background: data.overdueCount > 0 ? '#EF4444' : '#82bc00',
              }}
            />
          </div>
        </div>

        {/* AGENDA DE HOY Y PENDIENTES */}
        <p className="slabel" style={{ margin: '20px 0 10px' }}>
          AGENDA DE HOY Y PENDIENTES
        </p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {taskList.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94A3B8', padding: 16 }}>Sin tareas para hoy</p>
          ) : (
            taskList.map((task, idx) => {
              const isCompleted = task.status === 'Completado';
              const titleColor = task.isOverdue
                ? '#EF4444'
                : isCompleted
                  ? '#94A3B8'
                  : '#0F172A';

              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom:
                      idx < taskList.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: titleColor,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        margin: 0,
                      }}
                    >
                      {task.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
                      {formatTime(task.scheduledAt)}
                    </p>
                  </div>
                  {task.status === 'Pendiente' && (
                    <button
                      className="btn-green"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                      onClick={() => completeTask(task.id)}
                    >
                      Completar
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* AI Tips */}
        {data.coachTips.length > 0 && (
          <div className="ai-box" style={{ marginTop: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {data.coachTips.map((tip, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN — sidebar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card" style={{ padding: 20 }}>
          <p className="slabel" style={{ marginBottom: 12 }}>
            REGLA DEL DÍA
          </p>

          <span className={`tag tag-${semaphoreTagMap[data.semaphore]}`}>
            {semaphoreLabel[data.semaphore]}
          </span>

          <button
            className="btn-green"
            style={{ width: '100%', marginTop: 12, marginBottom: 8 }}
            onClick={() => void navigate({ to: '/agenda' })}
          >
            + Crear tarea
          </button>
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => void navigate({ to: '/clientes' })}
          >
            + Nuevo prospecto
          </button>

          {data.overdueCount > 0 && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: '#B91C1C',
                marginTop: 12,
              }}
            >
              {data.overdueCount} seguimiento{data.overdueCount !== 1 ? 's' : ''} vencido
              {data.overdueCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
