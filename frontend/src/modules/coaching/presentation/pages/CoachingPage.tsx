import { useState } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCoachingDaily } from "../../application/hooks/useCoachingDaily"

function getBarColor(pct: number): string {
  if (pct >= 100) return '#82bc00'
  if (pct >= 50) return '#F59E0B'
  return '#EF4444'
}

function getQualityColor(q: number): string {
  if (q >= 80) return '#82bc00'
  if (q >= 50) return '#F59E0B'
  return '#EF4444'
}

export function CoachingPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role !== UserRole.Seller

  const [selectedSellerId, setSelectedSellerId] = useState<string>("")
  const { data: sellers } = useSellers()

  const targetSellerId = isAdmin ? selectedSellerId || null : currentUser?.sellerId
  const { data, isLoading, error } = useCoachingDaily(targetSellerId)

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div style={{ maxWidth: 720 }} className="space-y-5">
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Coaching Comercial</h1>

      {isAdmin && (
        <div>
          <label className="slabel mb-1 block">Vendedor</label>
          <select
            value={selectedSellerId}
            onChange={(e) => setSelectedSellerId(e.target.value)}
            className="input"
            style={{ maxWidth: 280 }}
          >
            <option value="">Selecciona un vendedor</option>
            {sellers?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Cargando reporte...</p>}
      {error && <p style={{ fontSize: 13, color: '#EF4444' }}>Error al cargar el reporte.</p>}

      {data && (
        <div className="space-y-4">
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{data.sellerName}</p>
            <p style={{ fontSize: 12, color: '#94A3B8', textTransform: 'capitalize' }}>{today}</p>
          </div>

          {/* Progress */}
          <div className="card p-4">
            <div className="flex justify-between mb-2">
              <span className="kl">Progreso del día</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                {data.pointsToday} / {data.dailyPointsGoal} pts
              </span>
            </div>
            <div className="prog">
              <div
                className="prog-fill"
                style={{ width: `${data.progressPct}%`, backgroundColor: getBarColor(data.progressPct) }}
              />
            </div>
            <p style={{ marginTop: 4, fontSize: 11, color: '#94A3B8' }}>{data.progressPct}% completado</p>
          </div>

          {/* Quality + overdue chips */}
          <div className="flex gap-4">
            <div className="card p-4 flex-1 text-center">
              <div className="kl">Calidad promedio</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: getQualityColor(data.avgQuality), lineHeight: 1.1, marginTop: 4 }}>
                {Math.round(data.avgQuality)}%
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <span
                className="tag"
                style={{
                  background: data.overdueCount > 0 ? '#FEE2E2' : '#F0FDF4',
                  color: data.overdueCount > 0 ? '#B91C1C' : '#16A34A',
                }}
              >
                Vencidos: {data.overdueCount}
              </span>
              <span
                className="tag"
                style={{
                  background: data.tomorrowTasksCount < 5 ? '#FFFBEB' : '#F0FDF4',
                  color: data.tomorrowTasksCount < 5 ? '#D97706' : '#16A34A',
                }}
              >
                Mañana: {data.tomorrowTasksCount}
              </span>
            </div>
          </div>

          {/* Activity mix */}
          <div className="card p-4">
            <p className="slabel mb-3">Mix de actividades</p>
            {data.activityMix.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Sin actividades hoy</p>
            ) : (
              <table className="dt">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">% del día</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activityMix.map((item) => (
                    <tr key={item.type}>
                      <td>{item.type}</td>
                      <td className="text-right">{item.count}</td>
                      <td className="text-right" style={{ color: '#94A3B8' }}>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Insights */}
          {data.mixInsights.length > 0 && (
            <div className="ai-box">
              <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Análisis del día
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.mixInsights.map((insight, i) => (
                  <li key={i}>• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!data && !isLoading && !error && isAdmin && !selectedSellerId && (
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Selecciona un vendedor para ver el reporte.</p>
      )}
    </div>
  )
}
