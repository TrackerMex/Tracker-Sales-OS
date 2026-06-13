import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useDashboardSummary } from "../../application/hooks/useDashboardSummary"
import { useSellersSemaphore } from "../../application/hooks/useSellersSemaphore"
import { useOverdueTasks } from "../../application/hooks/useOverdueTasks"
import { useActivityTrend } from "../../application/hooks/useActivityTrend"
import { useStalledDeals } from "../../application/hooks/useStalledDeals"
import { KPIStrip } from "../components/KPIStrip"
import { SellerSemaphoreTable } from "../components/SellerSemaphoreTable"
import { AlertsPanel } from "../components/AlertsPanel"
import type { ActivityTrendItem } from "../../domain/dashboard.types"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { formatCurrency } from "@/shared/lib/format"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
)

interface ActivityChartProps {
  data: ActivityTrendItem[];
}

function ActivityChart({ data }: ActivityChartProps) {
  const labels = data.map((d) => d.date.slice(5))
  const counts = data.map((d) => d.count)

  return (
    <div style={{ height: 180, position: "relative" }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              data: counts,
              borderColor: "#82bc00",
              backgroundColor: "rgba(130,188,0,0.08)",
              borderWidth: 2,
              fill: true,
              tension: 0.35,
              pointRadius: 3.5,
              pointBackgroundColor: "#82bc00",
              pointBorderColor: "#fff",
              pointBorderWidth: 1.5,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#001524",
              titleColor: "#82bc00",
              bodyColor: "#fff",
            },
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true },
          },
        }}
      />
    </div>
  )
}

export function DashboardPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdminOrDirector = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director
  const summary = useDashboardSummary()
  const sellers = useSellersSemaphore()
  const overdue = useOverdueTasks()
  const trend = useActivityTrend()
  const settings = useSettings()
  const stalledDeals = useStalledDeals()

  const isLoading = summary.isLoading
  const data = summary.data

  const totalOverdue = overdue.data?.length ?? 0

  const goal = settings.data?.monthlyAmountGoal ?? 600000
  const forecast = data?.pipelineForecast ?? 0
  const pct = goal > 0 ? Math.round((forecast / goal) * 100) : 0

  // Get current time for data freshness indicator
  const now = new Date()
  const timeString = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {/* Title */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#002B49" }}>
              Dashboard de ventas
            </h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "#94A3B8" }}>
              Resumen del desempeño del equipo de hoy
            </p>
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", textAlign: 'right' }}>
            Actualizado<br />a las {timeString}
          </p>
        </div>
      </div>

      {summary.isError && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          <p>No se pudo cargar el resumen. Verifica tu conexión e intenta de nuevo.</p>
          <button
            onClick={() => summary.refetch?.()}
            className="ml-3 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <KPIStrip
        salesValue={
          isLoading ? "..." : formatCurrency(data?.totalSalesAmount ?? 0)
        }
        salesCount={data?.totalSalesCount ?? 0}
        unitsValue={data?.totalUnits ?? 0}
        unitsGoal={150}
        pointsValue={data?.totalPoints ?? 0}
        qualityValue={data?.avgQuality ?? 0}
        forecastValue={isLoading ? "..." : formatCurrency(forecast)}
        forecastSubtitle={`${pct}% de meta ${formatCurrency(goal)}`}
        isLoading={isLoading}
        onRetry={() => summary.refetch?.()}
      />

      {/* 2-column: Activity + Alerts */}
      <div
        className="mt-4 grid gap-4"
        style={{ gridTemplateColumns: "1fr 276px" }}
      >
        {/* Activity chart */}
        <div className="card">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3
              style={{ fontSize: 13, fontWeight: 700, color: "#002B49" }}
              id="activity-chart-title"
            >
              Actividad — últimos 14 días
            </h3>
            <p style={{ fontSize: 11, marginTop: 4, color: "#94A3B8" }}>
              Muestra llamadas, emails y reuniones registradas
            </p>
          </div>
          <div className="p-4" aria-labelledby="activity-chart-title">
            <ActivityChart data={trend.data ?? []} />
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#002B49" }}>
              Alertas operativas
            </h3>
          </div>
          <div className="p-4">
            <AlertsPanel
              alerts={[
                {
                  label: "Seguimientos vencidos (acción requerida)",
                  value: String(totalOverdue),
                  color: "red",
                },
                {
                  label: "Tareas programadas para mañana",
                  value: "0",
                  color: "amber",
                },
                {
                  label: "Cumplimiento del equipo esta semana",
                  value: `${data?.avgQuality?.toFixed(0) ?? 0}%`,
                  color: "green",
                },
                {
                  label: "Nuevos prospectos hoy",
                  value: "0",
                  color: "navy",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Team performance */}
      <div className="card mt-4">
        <div className="border-b border-[#E2E8F0] px-5 py-3">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#002B49" }}>
            Desempeño del equipo
          </h3>
        </div>
        <SellerSemaphoreTable
          sellers={sellers.data ?? []}
          isLoading={sellers.isLoading}
        />
        {sellers.isError && (
          <div className="flex items-center justify-between px-5 pb-4">
            <p className="text-sm text-red-600">No se pudo cargar el desempeño del equipo.</p>
            <button
              onClick={() => sellers.refetch?.()}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      {/* Stalled deals — Admin/Director only */}
      {isAdminOrDirector && (
        <div className="card mt-4">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#002B49" }}>
              Deals en riesgo
            </h3>
            <p style={{ fontSize: 11, marginTop: 4, color: "#94A3B8" }}>
              Oportunidades sin movimiento de etapa
            </p>
          </div>
          <div className="p-4">
            {stalledDeals.isLoading && (
              <p style={{ fontSize: 13, color: "#94A3B8" }}>Cargando...</p>
            )}
            {stalledDeals.isError && (
              <p style={{ fontSize: 13, color: "#EF4444" }}>No se pudo cargar los deals estancados.</p>
            )}
            {!stalledDeals.isLoading && !stalledDeals.isError && (
              stalledDeals.data?.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94A3B8" }}>No hay deals estancados</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Cliente</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Stage</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Vendedor</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Monto</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Días estancado</th>
                      <th style={{ textAlign: "center", padding: "6px 8px", color: "#64748B", fontWeight: 600, fontSize: 11 }}>Severidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stalledDeals.data?.map((item) => (
                      <tr key={item.dealId} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px", color: "#002B49", fontWeight: 500 }}>{item.clientName}</td>
                        <td style={{ padding: "8px", color: "#475569" }}>{item.stage}</td>
                        <td style={{ padding: "8px", color: "#475569" }}>{item.sellerName || "—"}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#475569" }}>{formatCurrency(item.amount)}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#475569" }}>{item.daysStalled}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "10px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: item.severity === "red" ? "#ef4444" : "#f59e0b",
                          }}>
                            {item.severity === "red" ? "Rojo" : "Ámbar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
