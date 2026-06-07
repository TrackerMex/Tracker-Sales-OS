import { useState } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCoachingDaily } from "../../application/hooks/useCoachingDaily"

export function CoachingPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role !== UserRole.Seller

  const [selectedSellerId, setSelectedSellerId] = useState<string>("")
  const { data: sellers } = useSellers()

  const targetSellerId = isAdmin
    ? selectedSellerId || null
    : currentUser?.sellerId
  const { data, isLoading, error } = useCoachingDaily(targetSellerId)

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const barColor = (pct: number) => {
    if (pct >= 100) return "bg-green-500"
    if (pct >= 50) return "bg-amber-400"
    return "bg-red-500"
  }

  const qualityColor = (q: number) => {
    if (q >= 80) return "text-green-600"
    if (q >= 50) return "text-amber-500"
    return "text-red-600"
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h2 className="text-2xl font-black text-[#002B49]">Coaching Comercial</h2>

      {isAdmin && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Vendedor
          </label>
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un vendedor</option>
            {sellers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-slate-500">Cargando reporte...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">Error al cargar el reporte.</p>
      )}

      {data && (
        <div className="space-y-6">
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {data.sellerName}
            </p>
            <p className="text-sm text-slate-500 capitalize">{today}</p>
          </div>

          {/* Progreso del dia */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex justify-between text-sm font-medium text-slate-700">
              <span>Progreso del día</span>
              <span>
                {data.pointsToday} / {data.dailyPointsGoal} puntos
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full transition-all ${barColor(data.progressPct)}`}
                style={{ width: `${data.progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {data.progressPct}% completado
            </p>
          </div>

          {/* Calidad promedio */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm text-slate-500">Calidad promedio</p>
              <p
                className={`text-4xl font-black ${qualityColor(data.avgQuality)}`}
              >
                {Math.round(data.avgQuality)}%
              </p>
            </div>
          </div>

          {/* Mix de actividades */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Mix de actividades
            </p>
            {data.activityMix.length === 0 ? (
              <p className="text-sm text-slate-400">Sin actividades hoy</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 text-right font-medium">Cantidad</th>
                    <th className="pb-2 text-right font-medium">% del día</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activityMix.map((item) => (
                    <tr
                      key={item.type}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-1.5 text-slate-700">{item.type}</td>
                      <td className="py-1.5 text-right text-slate-700">
                        {item.count}
                      </td>
                      <td className="py-1.5 text-right text-slate-500">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Chips de vencidos y manana */}
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                data.overdueCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              Vencidos: {data.overdueCount}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                data.tomorrowTasksCount < 5
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              Mañana: {data.tomorrowTasksCount} tareas
            </span>
          </div>

          {/* Insights del mix */}
          {data.mixInsights.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 text-sm font-semibold text-blue-800">
                Análisis del día
              </p>
              <ul className="space-y-1">
                {data.mixInsights.map((insight, i) => (
                  <li
                    key={i}
                    className="text-sm text-blue-800 before:mr-2 before:content-['•']"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!data && !isLoading && !error && isAdmin && !selectedSellerId && (
        <p className="text-sm text-slate-400">
          Selecciona un vendedor para ver el reporte.
        </p>
      )}
    </div>
  )
}
