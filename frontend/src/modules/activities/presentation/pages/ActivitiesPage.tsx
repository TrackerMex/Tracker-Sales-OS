import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { OfficeIcon, User02Icon, CheckListIcon } from "@hugeicons/core-free-icons"
import { useDailyActivities } from "../../application/hooks/useDailyActivities"
import { useCreateActivity } from "../../application/hooks/useCreateActivity"
import { ActivityForm } from "../components/ActivityForm"
import { ActivityHistoryModal } from "../components/ActivityHistoryModal"
import type { CreateActivityInput } from "../../domain/activities.types"

function getPointsBarColor(pct: number): string {
  if (pct >= 100) return '#82bc00'
  if (pct >= 50) return '#F59E0B'
  return '#EF4444'
}

export function ActivitiesPage() {
  const search = useSearch({ strict: false })
  const clientId = (search as { clientId?: string }).clientId
  const clientName = (search as { clientName?: string }).clientName
  const taskTitle = (search as { taskTitle?: string }).taskTitle
  const taskId = (search as { taskId?: string }).taskId
  const [showForm, setShowForm] = useState(() => !!(clientId || taskId))
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const { data, isLoading } = useDailyActivities()
  const { mutate, isPending, error: createError, reset: resetCreate } = useCreateActivity()

  function handleSubmit(input: CreateActivityInput) {
    mutate(input, {
      onSuccess: () => {
        setShowForm(false)
        toast.success("Actividad registrada")
      },
      onError: () => toast.error("No se pudo registrar la actividad"),
    })
  }

  const totalPoints = data?.totalPoints ?? 0
  const activities = data?.activities ?? []
  const pct = Math.min(100, (totalPoints / 30) * 100)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Actividades del día</h1>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: '#EEFAD4', color: '#4a7c00' }}
          >
            {totalPoints} / 30 pts
          </span>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          )}
          <button onClick={() => { resetCreate(); setShowForm((v) => !v) }} className="btn-primary">
            {showForm ? 'Cerrar' : 'Registrar actividad'}
          </button>
        </div>
      </div>

      {/* Points progress */}
      <div className="card p-4">
        <div className="flex justify-between mb-2">
          <span className="kl">Progreso del día</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{totalPoints} / 30 pts</span>
        </div>
        <div className="prog">
          <div className="prog-fill" style={{ width: `${pct}%`, backgroundColor: getPointsBarColor(pct) }} />
        </div>
      </div>

      {showForm && (
        <div className="card p-5">
          <div className="slabel mb-4">Registrar actividad</div>
          <ActivityForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            programmedTask={taskTitle}
            submitError={createError}
            initialClientId={clientId}
            initialClientLabel={clientName}
            taskId={taskId}
          />
        </div>
      )}

      {isLoading ? (
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando...</p>
      ) : activities.length === 0 ? (
        <div className="empty-state">Sin actividades registradas hoy</div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="log-card flex items-start gap-4">
              <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 64 }}>
                <span className="tag tag-navy">{activity.type}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#82bc00' }}>+{activity.points} pts</span>
              </div>
              <div className="flex-1 min-w-0">
                {(activity.clientName || activity.contactName || activity.taskTitle) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                    {activity.clientName && (
                      <span className="inline-flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: '#002B49' }}>
                        <HugeiconsIcon icon={OfficeIcon} size={12} color="#002B49" strokeWidth={1.8} />
                        {activity.clientName}
                      </span>
                    )}
                    {activity.contactName && (
                      <span className="inline-flex items-center gap-1" style={{ fontSize: 11, color: '#475569' }}>
                        <HugeiconsIcon icon={User02Icon} size={12} color="#64748B" strokeWidth={1.8} />
                        {activity.contactName}
                      </span>
                    )}
                    {activity.taskTitle && (
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                        style={{ fontSize: 10, background: '#EEF2FF', color: '#3730A3' }}
                      >
                        <HugeiconsIcon icon={CheckListIcon} size={11} color="#4338CA" strokeWidth={1.8} />
                        {activity.taskTitle.length > 40 ? activity.taskTitle.slice(0, 40) + '…' : activity.taskTitle}
                      </span>
                    )}
                  </div>
                )}
                <p style={{ fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activity.summary.length > 80 ? activity.summary.slice(0, 80) + "..." : activity.summary}
                </p>
                <div className="prog mt-2" style={{ maxWidth: 120 }}>
                  <div
                    className="prog-fill"
                    style={{ width: `${activity.quality}%`, backgroundColor: getPointsBarColor(activity.quality) }}
                  />
                </div>
                <p style={{ marginTop: 2, fontSize: 11, color: '#94A3B8' }}>Calidad: {activity.quality}%</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`tag ${activity.status === 'Completada' ? 'tag-green' : activity.status === 'En curso' ? 'tag-blue' : activity.status === 'Cancelada' ? '' : 'tag-yellow'}`}>
                  {activity.status ?? 'Pendiente'}
                </span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setSelectedActivityId(activity.id)}
                >
                  Ver historial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
