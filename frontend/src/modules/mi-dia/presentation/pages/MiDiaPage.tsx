import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/shared/store/app.store';
import { UserRole } from '@/core/domain/types/common.types';
import { useSellers } from '@/modules/equipo/application/hooks/useSellers';
import { useMiDia } from '../../application/hooks/useMiDia';
import { useTodayTasks } from '../../../tasks/application/hooks/useTodayTasks';
import { useCompleteTask } from '../../../tasks/application/hooks/useCompleteTask';

type Semaphore = 'verde' | 'ambar' | 'rojo' | 'morado';

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

function Skel({ w, h, bg = '#e2e8f0' }: { w?: string | number; h: number; bg?: string }) {
  return <div style={{ width: w ?? '100%', height: h, borderRadius: 4, background: bg }} />;
}

function MiDiaSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div className="kpi-strip" style={{ marginBottom: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i === 0 ? 'kpi-cell ac' : 'kpi-cell'}>
            <Skel h={11} w={70} bg={i === 0 ? 'rgba(255,255,255,0.18)' : '#e2e8f0'} />
            <div style={{ margin: '8px 0 6px' }}>
              <Skel h={26} w={48} bg={i === 0 ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} />
            </div>
            <Skel h={10} w={90} bg={i === 0 ? 'rgba(255,255,255,0.12)' : '#f1f5f9'} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 276px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <Skel h={11} w={140} bg="#e2e8f0" />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[48, 40].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 8, background: '#f8fafc' }} />
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <Skel h={11} w={170} bg="#e2e8f0" />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 52, borderRadius: 9, border: '1px solid #e2e8f0' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
          <Skel h={11} w={90} bg="#e2e8f0" />
          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <Skel h={20} w={60} bg="#f1f5f9" />
          </div>
          <Skel h={16} w="90%" bg="#e2e8f0" />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Skel h={13} bg="#f1f5f9" />
            <Skel h={13} w="80%" bg="#f1f5f9" />
            <Skel h={13} w="70%" bg="#f1f5f9" />
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skel h={32} bg="#e2e8f0" />
            <Skel h={32} bg="#e2e8f0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const { data: sellers, isLoading } = useSellers();
  const active = (sellers ?? []).filter((s) => s.active);

  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--tracker-text)', marginBottom: 4 }}>
        Mi Día
      </p>
      <p style={{ fontSize: 13, color: 'var(--tracker-text-secondary)', marginBottom: 18 }}>
        Selecciona un vendedor para ver su estado operativo del día.
      </p>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, borderRadius: 10, background: '#f1f5f9' }} />
          ))}
        </div>
      ) : active.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--tracker-text-muted)' }}>Sin vendedores activos.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {active.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id, s.name)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid var(--tracker-border)',
                background: '#fff',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--tracker-primary)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--tracker-border)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--tracker-text)', margin: '0 0 3px' }}>
                {s.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--tracker-text-muted)', margin: 0 }}>
                {s.profile ?? 'Ejecutivo comercial'}
              </p>
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

  const activeSellerId = isAdminOrDirector ? selectedSeller?.id ?? null : currentUser?.sellerId ?? null;

  const { data, isLoading, isError } = useMiDia(activeSellerId);
  const { data: tasks } = useTodayTasks(activeSellerId);
  const { mutate: completeTask } = useCompleteTask();

  if (isAdminOrDirector && !selectedSeller) {
    return <SellerPicker onSelect={(id, name) => setSelectedSeller({ id, name })} />;
  }

  if (!isAdminOrDirector && !currentUser?.sellerId) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 56 }}>
        <div className="card" style={{ padding: '32px 40px', maxWidth: 400, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--tracker-text-secondary)' }}>
            Tu cuenta no tiene perfil de vendedor asociado.
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) return <MiDiaSkeleton />;

  if (isError || !data) {
    return (
      <div style={{ padding: 24 }}>
        <div
          className="card"
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--tracker-danger)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <p style={{ fontSize: 13, color: 'var(--tracker-danger)', margin: 0 }}>
            Error cargando datos de mi día
          </p>
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

  const alerts: Array<{ color: string; bg: string; text: string }> = [];
  if (data.overdueCount > 0)
    alerts.push({
      color: 'var(--tracker-danger)',
      bg: '#FEF2F2',
      text: `${data.overdueCount} seguimiento${data.overdueCount !== 1 ? 's' : ''} vencido${data.overdueCount !== 1 ? 's' : ''}. Atiende lo vencido primero.`,
    });
  if (data.pointsToday < data.dailyPointsGoal)
    alerts.push({
      color: 'var(--tracker-warning)',
      bg: '#FFFBEB',
      text: `Vas en ${data.pointsToday}/${data.dailyPointsGoal} puntos. Te faltan ${data.dailyPointsGoal - data.pointsToday} para el mínimo.`,
    });
  if (data.callsToday < data.dailyCallsGoal)
    alerts.push({
      color: 'var(--tracker-warning)',
      bg: '#FFFBEB',
      text: `Llevas ${data.callsToday}/${data.dailyCallsGoal} llamadas. ${data.dailyCallsGoal - data.callsToday} más para cumplir el objetivo.`,
    });
  if (data.tomorrowTasksCount < data.tomorrowTasksGoal)
    alerts.push({
      color: 'var(--tracker-danger)',
      bg: '#FEF2F2',
      text: `Agenda de mañana baja (${data.tomorrowTasksCount}/${data.tomorrowTasksGoal}). Programa actividades antes de cerrar el día.`,
    });
  if (data.newProspectsToday < data.newProspectsGoal)
    alerts.push({
      color: 'var(--tracker-purple)',
      bg: '#F5F3FF',
      text: `Prospectos nuevos hoy: ${data.newProspectsToday}/${data.newProspectsGoal}. Alimenta pipeline si la agenda está baja.`,
    });
  if (data.coldAccountsCount > 0)
    alerts.push({
      color: 'var(--tracker-warning)',
      bg: '#FFF7ED',
      text: `${data.coldAccountsCount} cuenta${data.coldAccountsCount !== 1 ? 's' : ''} fría${data.coldAccountsCount !== 1 ? 's' : ''} asignada${data.coldAccountsCount !== 1 ? 's' : ''}. Reactiva antes de fin de semana.`,
    });
  if (alerts.length === 0)
    alerts.push({
      color: 'var(--tracker-success-dark)',
      bg: '#F0FDF4',
      text: 'Buen ritmo: tienes puntos, llamadas, agenda futura y pipeline activo. Mantén calidad en notas.',
    });

  return (
    <div style={{ padding: 24 }}>
      {/* SELLER BANNER (admin/director only) */}
      {isAdminOrDirector && selectedSeller && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            padding: '8px 14px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid var(--tracker-border)',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--tracker-text-secondary)', margin: 0 }}>
            Viendo Mi Día de{' '}
            <strong style={{ color: 'var(--tracker-text)' }}>{selectedSeller.name}</strong>
          </p>
          <button
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => setSelectedSeller(null)}
          >
            Cambiar
          </button>
        </div>
      )}
      {/* KPI STRIP */}
      <div className="kpi-strip" style={{ marginBottom: 18 }}>
        <div className="kpi-cell ac">
          <div className="kl">Puntos de hoy</div>
          <div className="kv">
            {data.pointsToday}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              /{data.dailyPointsGoal}
            </span>
          </div>
          <div className="ksb">
            <span>Meta de actividad mínima</span>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
                overflow: 'hidden',
                marginTop: 5,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${ptsPct}%`,
                  background: 'var(--tracker-green)',
                  transition: 'width 0.4s',
                }}
              />
            </div>
          </div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Llamadas hoy</div>
          <div className="kv" style={{ color: metricColor(data.callsToday, data.dailyCallsGoal) }}>
            {data.callsToday}
            <span style={{ fontSize: 13, color: 'var(--tracker-text-muted)', fontWeight: 400 }}>
              /{data.dailyCallsGoal}
            </span>
          </div>
          <div className="ksb">Objetivo recomendado</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Agenda mañana</div>
          <div
            className="kv"
            style={{ color: metricColor(data.tomorrowTasksCount, data.tomorrowTasksGoal) }}
          >
            {data.tomorrowTasksCount}
            <span style={{ fontSize: 13, color: 'var(--tracker-text-muted)', fontWeight: 400 }}>
              {' '}
              meta: {data.tomorrowTasksGoal}
            </span>
          </div>
          <div className="ksb">Planeación mínima</div>
        </div>
        <div className="kpi-cell">
          <div className="kl">Prospectos hoy</div>
          <div
            className="kv"
            style={{ color: metricColor(data.newProspectsToday, data.newProspectsGoal) }}
          >
            {data.newProspectsToday}
            <span style={{ fontSize: 13, color: 'var(--tracker-text-muted)', fontWeight: 400 }}>
              /{data.newProspectsGoal}
            </span>
          </div>
          <div className="ksb">Alimenta pipeline si vas bajo</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 276px', gap: 16 }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* THERMOMETER */}
          <div className="card" style={{ padding: 20 }}>
            <p className="slabel" style={{ marginBottom: 12 }}>
              Termómetro operativo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: '11px 13px',
                    borderRadius: 8,
                    background: a.bg,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: a.color,
                    lineHeight: 1.5,
                  }}
                >
                  {a.text}
                </div>
              ))}
            </div>
          </div>

          {/* AI COACH TIPS */}
          {data.coachTips.length > 0 && (
            <div className="ai-box">
              <p className="slabel" style={{ marginBottom: 8, color: 'var(--tracker-purple)' }}>
                Coach IA
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {data.coachTips.map((tip, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 12.5, marginBottom: i < data.coachTips.length - 1 ? 5 : 0 }}
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TASK LIST */}
          <div className="card" style={{ padding: 20 }}>
            <p className="slabel" style={{ marginBottom: 13 }}>
              Agenda de hoy y pendientes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {taskList.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--tracker-text-muted)', margin: 0 }}>
                  Sin tareas abiertas. Crea agenda para mañana antes de cerrar el día.
                </p>
              ) : (
                taskList.map((task) => {
                  const isOverdue = task.isOverdue && task.status === 'Pendiente';
                  const isCompleted = task.status === 'Completado';
                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: 13,
                        borderRadius: 9,
                        border: `1px solid ${isOverdue ? '#FCA5A5' : 'var(--tracker-border)'}`,
                        background: isOverdue ? '#FFF5F5' : '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        opacity: isCompleted ? 0.55 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isOverdue
                                ? 'var(--tracker-danger)'
                                : 'var(--tracker-text)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              margin: 0,
                            }}
                          >
                            {task.title}
                          </p>
                          {isOverdue && <span className="tag tag-red">Vencida</span>}
                        </div>
                        {task.scheduledAt && (
                          <p
                            style={{
                              fontSize: 11,
                              color: isOverdue
                                ? 'var(--tracker-danger)'
                                : 'var(--tracker-success-dark)',
                              fontWeight: 500,
                              margin: 0,
                            }}
                          >
                            {formatTime(task.scheduledAt)}
                          </p>
                        )}
                      </div>
                      {task.status === 'Pendiente' && !isAdminOrDirector && (
                        <button
                          className="btn-green"
                          style={{ padding: '5px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
                          onClick={() => completeTask(task.id)}
                          aria-label={`Completar: ${task.title}`}
                        >
                          Completar
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
        <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
          <p className="slabel" style={{ marginBottom: 11 }}>
            Regla del día
          </p>
          <div style={{ marginBottom: 12 }}>
            <span className={`tag tag-${semaph.tag}`}>{semaph.label}</span>
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--tracker-text)',
              lineHeight: 1.45,
              marginBottom: 8,
            }}
          >
            {semaph.rule}
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--tracker-text-secondary)',
              lineHeight: 1.65,
              marginBottom: 20,
            }}
          >
            {semaph.desc}
          </p>
          <button
            className="btn-green"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={() => void navigate({ to: '/agenda' })}
          >
            + Crear tarea
          </button>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => void navigate({ to: '/clientes' })}
          >
            + Nuevo prospecto
          </button>
        </div>
      </div>
    </div>
  );
}
