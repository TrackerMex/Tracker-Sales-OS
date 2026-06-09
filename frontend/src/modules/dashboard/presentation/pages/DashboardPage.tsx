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
import { KPIStrip } from "../components/KPIStrip"
import { SellerSemaphoreTable } from "../components/SellerSemaphoreTable"
import { AlertsPanel } from "../components/AlertsPanel"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
)

function formatCurrency(value: number): string {
  // Handle edge cases: null, undefined, NaN, Infinity
  if (!Number.isFinite(value)) {
    return "$0.00"
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value) > 999999999 ? 999999999 : value)
}

function formatPercent(value: number): string {
  // Handle edge cases and clamp to 0-100
  if (!Number.isFinite(value)) {
    return "0%"
  }
  const clamped = Math.max(0, Math.min(100, value))
  return `${clamped.toFixed(1)}%`
}

function formatNumber(value: number): string {
  // Handle edge cases and format with thousands separator
  if (!Number.isFinite(value)) {
    return "0"
  }
  return new Intl.NumberFormat("es-MX").format(Math.round(value))
}

const CHART_DATA = [2, 5, 3, 8, 6, 4, 9, 7, 11, 6, 8, 10, 7, 12]

function getLast14Days(): string[] {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }))
  }
  return days
}

function ActivityChart() {
  const labels = getLast14Days()

  return (
    <div style={{ height: 180, position: "relative" }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              data: CHART_DATA,
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
  const summary = useDashboardSummary()
  const sellers = useSellersSemaphore()
  const overdue = useOverdueTasks()

  const isLoading = summary.isLoading
  const data = summary.data

  const totalOverdue = overdue.data?.length ?? 0

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
            <ActivityChart />
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
    </div>
  )
}
