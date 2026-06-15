import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/shared/store/app.store';
import { UserRole } from '@/core/domain/types/common.types';
import { useSellers } from '@/modules/equipo/application/hooks/useSellers';
import { useMiDia } from '../../application/hooks/useMiDia';
import { useTodayTasks } from '../../../tasks/application/hooks/useTodayTasks';
import { useCompleteTask } from '../../../tasks/application/hooks/useCompleteTask';

type Semaphore = 'verde' | 'ambar' | 'rojo' | 'morado';
type AlertVariant = 'danger' | 'warning' | 'purple' | 'success';

const SEMAPHORE: Record<Semaphore, { tag: string; label: string; rule: string; desc: string }> = {
  verde: {
    tag: 'green',
    label: 'Todo OK',
    rule: 'Mantén el ritmo. Registra cada actividad en tiempo real.',
    desc: 'Llevas buen ritmo de llamadas, agenda y esfuerzo. Mantén calidad en notas y asegura que cada compromiso tenga siguiente paso.',
  },
  ambar: {
    tag: 'amber',
    label: 'Atención',
    rule: 'Registra actividad en tiempo real, no al cierre del día.',
    desc: 'Llamadas, visitas y propuestas requieren siguiente paso. Chat y correo no lo requieren salvo que exista compromiso.',
  },
  rojo: {
    tag: 'red',
    label: 'Urgente',
    rule: 'Atiende primero lo vencido.',
    desc: 'Tienes seguimientos vencidos o puntos muy por debajo del mínimo. Prioriza llamadas y cierra los pendientes antes de sumar nuevos.',
  },
  morado: {
    tag: 'purple',
    label: 'Coach',
    rule: 'Sesión de coaching sugerida.',
    desc: 'Tu patrón de actividad indica que necesitas apoyo del líder. Agenda una sesión antes de continuar.',
  },
};

function metricColor(current: number, goal: number): string {
  if (goal === 0) return 'var(--tracker-text)';
  const pct = current / goal;
  if (pct >= 1) return 'var(--tracker-text)';
  if (pct >= 0.5) return 'var(--tracker-warning)';
  return 'var(--tracker-danger)';
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

function MiDiaSkeleton() {
  return (
    <div className="p-6">
      <div className="kpi-strip mb-[18px] animate-pulse motion-reduce:animate-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i === 0 ? 'kpi-cell ac' : 'kpi-cell'}>
            <div
              className="rounded"
              style={{
                width: 70,
                height: 11,
                background: i === 0 ? 'rgba(255,255,255,0.18)' : '#e2e8f0',
              }}
            />
            <div className="my-2">
              <div
                className="rounded"
                style={{
                  width: 48,
                  height: 26,
                  background: i === 0 ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                }}
              />
            </div>
            <div
              className="rounded"
              style={{
                width: 90,
                height: 10,
                background: i === 0 ? 'rgba(255,255,255,0.12)' : '#f1f5f9',
              }}
            />
          </div>
        ))}
      </div>
      <div className="page-grid">
        <div className="flex flex-col gap-4">
          <div className="card p-5 animate-pulse motion-reduce:animate-none">
            <div className="rounded mb-3" style={{ width: 140, height: 11, background: '#e2e8f0' }} />
            <div className="flex flex-col gap-2">
              {[48, 40].map((h, i) => (
                <div key={i} className="rounded-lg" style={{ height: h, background: '#f8fafc' }} />
              ))}
            </div>
          </div>
          <div className="card p-5 animate-pulse motion-reduce:animate-none">
            <div className="rounded mb-3" style={{ width: 170, height: 11, background: '#e2e8f0' }} />
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-[9px] border border-[#e2e8f0]" style={{ height: 52 }} />
              ))}
            </div>
          </div>
        </div>
        <div className="card p-5 animate-pulse motion-reduce:animate-none self-start">
          <div className="rounded mb-3" style={{ width: 90, height: 11, background: '#e2e8f0' }} />
          <div className="rounded mb-3" style={{ width: 60, height: 20, background: '#f1f5f9' }} />
          <div className="rounded mb-2" style={{ width: '90%', height: 16, background: '#e2e8f0' }} />
          <div className="flex flex-col gap-1">
            {[100, 80, 70].map((w, i) => (
              <div key={i} className="rounded" style={{ width: `${w}%`, height: 13, background: '#f1f5f9' }} />
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-5">
            <div className="rounded-lg" style={{ height: 32, background: '#e2e8f0' }} />
            <div className="rounded-lg" style={{ height: 32, background: '#e2e8f0' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const { data: sellers, isLoading, isError, refetch } = useSellers();
  const active = (sellers ?? []).filter((s) => s.active);

  return (
    <div className="p-6">
      <h1 className="page-title mb-1">Mi Día</h1>
      <p className="page-subtitle mb-[18px]">
        Selecciona un vendedor para ver su estado operativo del día.
      </p>
      {isLoading ? (
        <div
          className="grid gap-3 animate-pulse motion-reduce:animate-none"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[10px]" style={{ height: 72, background: '#f1f5f9' }} />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-5 flex items-center justify-between">
          <p className="text-[13px] m-0" style={{ color: 'var(--tracker-danger)' }}>
            No se pudo cargar la lista de vendedores.
          </p>
          <button className="btn-ghost ml-3" onClick={() => void refetch()}>
            Reintentar
          </button>
        </div>
      ) : active.length === 0 ? (
        <div className="empty-state">Sin vendedores activos.</div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {active.map((s) => (
            <button
              key={s.id}
              className="seller-pick-card"
              onClick={() => onSelect(s.id, s.name)}
            >
              <p className="spc-name" title={s.name}>{s.name}</p>
              <p className="spc-role">{s.profile ?? 'Ejecutivo comercial'}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MiDiaPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAdminOrDirector =
    currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director;
  const [selectedSeller, setSelectedSeller] = useState<{ id: string; name: string } | null>(null);

  const activeSellerId = isAdminOrDirector
    ? selectedSeller?.id ?? null
    : currentUser?.sellerId ?? null;

  const { data, isLoading, isError, refetch } = useMiDia(activeSellerId);
  const { data: tasks, isError: tasksError } = useTodayTasks(activeSellerId);
  const { mutate: completeTask, isPending: isCompleting, variables: completingTaskId } = useCompleteTask();

  if (isAdminOrDirector && !selectedSeller) {
    return <SellerPicker onSelect={(id, name) => setSelectedSeller({ id, name })} />;
  }

  if (!isAdminOrDirector && !currentUser?.sellerId) {
    return (
      <div className="p-6 flex justify-center pt-14">
        <div className="card p-10 max-w-sm text-center">
          <p className="text-sm" style={{ color: 'var(--tracker-text-secondary)' }}>
            Tu cuenta no tiene perfil de vendedor asociado.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <MiDiaSkeleton />;

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="card p-4 flex items-center justify-between gap-2.5">
          <p className="text-[13px] m-0" style={{ color: 'var(--tracker-danger)' }}>
            No se pudo cargar los datos de Mi Día.
          </p>
          <button className="btn-ghost ml-3" onClick={() => void refetch()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const taskList = tasks ?? [];
  const semaph = SEMAPHORE[data.semaphore] ?? SEMAPHORE.ambar;
  const ptsPct =
    data.dailyPointsGoal > 0
      ? Math.min(100, Math.round((data.pointsToday / data.dailyPointsGoal) * 100))
      : 100;

  const alerts: Array<{ variant: AlertVariant; text: string }> = [];
  if (data.overdueCount > 0)
    alerts.push({
      variant: 'danger',
      text: `${data.overdueCount} seguimiento${data.overdueCount !== 1 ? 's' : ''} vencido${data.overdueCount !== 1 ? 's' : ''}. Atiende lo vencido primero.`,
    });
  if (data.pointsToday < data.dailyPointsGoal)
    alerts.push({
      variant: 'warning',
      text: `Vas en ${data.pointsToday}/${data.dailyPointsGoal} puntos. Te faltan ${data.dailyPointsGoal - data.pointsToday} para el mínimo.`,
    });
  if (data.callsToday < data.dailyCallsGoal)
    alerts.push({
      variant: 'warning',
      text: `Llevas ${data.callsToday}/${data.dailyCallsGoal} llamadas. ${data.dailyCallsGoal - data.callsToday} más para cumplir el objetivo.`,
    });
  if (data.tomorrowTasksCount < data.tomorrowTasksGoal)
    alerts.push({
      variant: 'danger',
      text: `Agenda de mañana baja (${data.tomorrowTasksCount}/${data.tomorrowTasksGoal}). Programa actividades antes de cerrar el día.`,
    });
  if (data.newProspectsToday < data.newProspectsGoal)
    alerts.push({
      variant: 'purple',
      text: `Prospectos nuevos hoy: ${data.newProspectsToday}/${data.newProspectsGoal}. Alimenta pipeline si la agenda está baja.`,
    });
  if (data.coldAccountsCount > 0)
    alerts.push({
      variant: 'warning',
      text: `${data.coldAccountsCount} cuenta${data.coldAccountsCount !== 1 ? 's' : ''} fría${data.coldAccountsCount !== 1 ? 's' : ''} asignada${data.coldAccountsCount !== 1 ? 's' : ''}. Reactiva antes de fin de semana.`,
    });
  if (alerts.length === 0)
    alerts.push({
      variant: 'success',
      text: 'Buen ritmo: tienes puntos, llamadas, agenda futura y pipeline activo. Mantén calidad en notas.',
    });

  return (
    <div className="p-6">
      {/* SELLER BANNER (admin/director only) */}
      {isAdminOrDirector && selectedSeller && (
        <div className="seller-banner">
          <span>
            Viendo Mi Día de <strong>{selectedSeller.name}</strong>
          </span>
          <button
            className="btn-ghost"
            onClick={() => setSelectedSeller(null)}
            aria-label={`Cambiar vendedor (actualmente: ${selectedSeller.name})`}
          >
            Cambiar
          </button>
        </div>
      )}

      {/* KPI STRIP */}
      <div className="kpi-strip mb-5">
        <div className="kpi-cell ac">
          <div className="kl">Puntos de hoy</div>
          <div className="kv">
            {data.pointsToday}
            <span className="kv-sub-light">/{data.dailyPointsGoal}</span>
          </div>
          <div className="ksb">
            <span>Meta de actividad mínima</span>
            <div className="prog mt-1">
              <div
                className="prog-fill"
                style={{ width: `${ptsPct}%`, background: 'var(--tracker-green)', transition: 'width 0.4s' }}
              />
            </div>
          </div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Llamadas hoy</div>
          <div className="kv" style={{ color: metricColor(data.callsToday, data.dailyCallsGoal) }}>
            {data.callsToday}
            <span className="kv-sub">/{data.dailyCallsGoal}</span>
          </div>
          <div className="ksb">Objetivo recomendado</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Agenda mañana</div>
          <div className="kv" style={{ color: metricColor(data.tomorrowTasksCount, data.tomorrowTasksGoal) }}>
            {data.tomorrowTasksCount}
            <span className="kv-sub"> meta: {data.tomorrowTasksGoal}</span>
          </div>
          <div className="ksb">Planeación mínima</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Prospectos hoy</div>
          <div className="kv" style={{ color: metricColor(data.newProspectsToday, data.newProspectsGoal) }}>
            {data.newProspectsToday}
            <span className="kv-sub">/{data.newProspectsGoal}</span>
          </div>
          <div className="ksb">Alimenta pipeline si vas bajo</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="page-grid">
        {/* LEFT */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* THERMOMETER */}
          <div className="card p-5">
            <p className="slabel mb-3">Termómetro operativo</p>
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <div key={i} className={`thermo-alert ${a.variant}`}>
                  {a.text}
                </div>
              ))}
            </div>
          </div>

          {/* AI COACH TIPS */}
          {data.coachTips.length > 0 && (
            <div className="ai-box">
              <p className="slabel mb-2" style={{ color: 'var(--tracker-purple)' }}>
                Coach IA
              </p>
              <ul className="m-0 pl-4">
                {data.coachTips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-[12.5px]"
                    style={{ marginBottom: i < data.coachTips.length - 1 ? 5 : 0 }}
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TASK LIST */}
          <div className="card p-5">
            <p className="slabel mb-3">Agenda de hoy y pendientes</p>
            <div className="flex flex-col gap-2">
              {tasksError ? (
                <div className="empty-state" style={{ color: 'var(--tracker-danger)' }}>
                  No se pudo cargar la agenda.
                </div>
              ) : taskList.length === 0 ? (
                <div className="empty-state">
                  Sin tareas abiertas. Crea agenda para mañana antes de cerrar el día.
                </div>
              ) : (
                taskList.map((task) => {
                  const isOverdue = task.isOverdue && task.status === 'Pendiente';
                  const isCompleted = task.status === 'Completado';
                  const isThisTaskPending = isCompleting && completingTaskId === task.id;
                  const cls = [
                    'task-item',
                    isOverdue ? 'is-overdue' : '',
                    isCompleted ? 'is-completed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <div key={task.id} className={cls}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="ti-title">{task.title}</p>
                          {isOverdue && <span className="tag tag-red">Vencida</span>}
                        </div>
                        {task.scheduledAt && (
                          <p className="ti-time">{formatTime(task.scheduledAt)}</p>
                        )}
                      </div>
                      {task.status === 'Pendiente' && !isAdminOrDirector && (
                        <button
                          className="btn-green btn-sm"
                          onClick={() => completeTask(task.id)}
                          disabled={isThisTaskPending}
                          aria-label={`Completar: ${task.title}`}
                          aria-busy={isThisTaskPending}
                        >
                          {isThisTaskPending ? '...' : 'Completar'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="card p-5 self-start">
          <p className="slabel mb-3">Regla del día</p>
          <div className="mb-3">
            <span className={`tag tag-${semaph.tag}`}>{semaph.label}</span>
          </div>
          <p className="rule-title">{semaph.rule}</p>
          <p className="rule-desc">{semaph.desc}</p>
          <button
            className="btn-green w-full justify-center mb-2"
            onClick={() => void navigate({ to: '/agenda' })}
          >
            + Crear tarea
          </button>
          <button
            className="btn-primary w-full justify-center"
            onClick={() => void navigate({ to: '/clientes' })}
          >
            + Nuevo prospecto
          </button>
        </div>
      </div>
    </div>
  );
}
