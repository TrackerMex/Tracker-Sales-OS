import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import { useDailyActivities } from "../../application/hooks/useDailyActivities"
import { useCreateActivity } from "../../application/hooks/useCreateActivity"
import { ActivityForm } from "../components/ActivityForm"
import type { CreateActivityInput } from "../../domain/activities.types"

function getPointsBarColor(pct: number): string {
  if (pct >= 100) return '#82bc00'
  if (pct >= 50) return '#F59E0B'
  return '#EF4444'
}

export function ActivitiesPage() {
  const search = useSearch({ strict: false })
  const taskTitle = (search as { taskTitle?: string }).taskTitle
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useDailyActivities()
  const { mutate, isPending, error: createError, reset: resetCreate } = useCreateActivity()

  function handleSubmit(input: CreateActivityInput) {
    mutate(input, {
      onSuccess: () => setShowForm(false),
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
          <ActivityForm onSubmit={handleSubmit} isLoading={isPending} programmedTask={taskTitle} submitError={createError} />
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
