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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
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

  return (
    <div>
      {/* Title */}
      <div className="mb-5">
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#002B49" }}>
          Dashboard
        </h1>
        <p style={{ marginTop: 2, fontSize: 12, color: "#94A3B8" }}>
          Vista general del equipo de ventas
        </p>
      </div>

      {summary.isError && (
        <p className="mb-4 text-sm text-red-600">
          No se pudo cargar el resumen del mes.
        </p>
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
      />

      {/* 2-column: Activity + Alerts */}
      <div
        className="mt-4 grid gap-4"
        style={{ gridTemplateColumns: "1fr 276px" }}
      >
        {/* Activity chart */}
        <div className="card">
          <div className="border-b border-[#E2E8F0] px-5 py-3">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#002B49" }}>
              Actividad — últimos 14 días
            </h3>
          </div>
          <div className="p-4">
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
                  label: "seguimientos vencidos",
                  value: String(totalOverdue),
                  color: "red",
                },
                {
                  label: "tareas pendientes manana",
                  value: "0",
                  color: "amber",
                },
                {
                  label: "cumplimiento semanal",
                  value: `${data?.avgQuality?.toFixed(0) ?? 0}%`,
                  color: "green",
                },
                {
                  label: "prospectos nuevos hoy",
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
          <p className="px-5 pb-4 text-sm text-red-600">
            No se pudo cargar el semaforo.
          </p>
        )}
      </div>
    </div>
  )
}
