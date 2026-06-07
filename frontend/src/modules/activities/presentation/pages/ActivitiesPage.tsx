import { useState } from "react"
import { useDailyActivities } from "../../application/hooks/useDailyActivities"
import { useCreateActivity } from "../../application/hooks/useCreateActivity"
import { ActivityForm } from "../components/ActivityForm"
import type { CreateActivityInput } from "../../domain/activities.types"

function pointsBadgeClass(pts: number): string {
  if (pts >= 30) return "bg-[#82bc00]/20 text-[#4a6b00] border border-[#82bc00]/40"
  if (pts >= 15) return "bg-amber-100 text-amber-700 border border-amber-300"
  return "bg-red-100 text-red-700 border border-red-300"
}

export function ActivitiesPage() {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useDailyActivities()
  const { mutate, isPending } = useCreateActivity()

  function handleSubmit(input: CreateActivityInput) {
    mutate(input, {
      onSuccess: () => setShowForm(false),
    })
  }

  const totalPoints = data?.totalPoints ?? 0
  const activities = data?.activities ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#002B49]">Actividades del día</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pointsBadgeClass(totalPoints)}`}>
            {totalPoints} / 30 pts
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#002B49]/90"
        >
          {showForm ? "Cancelar" : "Registrar actividad"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ActivityForm onSubmit={handleSubmit} isLoading={isPending} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-400">Sin actividades registradas hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <span className="rounded-md bg-[#002B49]/10 px-2 py-1 text-xs font-semibold text-[#002B49]">
                  {activity.type}
                </span>
                <span className="text-xs font-bold text-[#82bc00]">+{activity.points} pts</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">
                  {activity.summary.length > 80
                    ? activity.summary.slice(0, 80) + "..."
                    : activity.summary}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Calidad: {activity.quality}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
