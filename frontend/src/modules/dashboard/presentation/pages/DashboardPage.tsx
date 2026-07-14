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
import { useLeaderboard } from "../../application/hooks/useLeaderboard"
import { KPIStrip } from "../components/KPIStrip"
import { SellerSemaphoreTable } from "../components/SellerSemaphoreTable"
import { LeaderboardTable } from "../components/LeaderboardTable"
import { AlertsPanel } from "../components/AlertsPanel"
import type { ActivityTrendItem } from "../../domain/dashboard.types"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
)

interface ActivityChartProps {
  data: ActivityTrendItem[]
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
  const stalledDealsLimit = 10
  const [stalledDealsPage, setStalledDealsPage] = useState(1)
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdminOrDirector =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Director
  const summary = useDashboardSummary()
  const sellers = useSellersSemaphore()
  const overdue = useOverdueTasks()
  const trend = useActivityTrend()
  const settings = useSettings()
  const stalledDeals = useStalledDeals(stalledDealsPage, stalledDealsLimit)
  const leaderboard = useLeaderboard()

  useEffect(() => {
    if (!stalledDeals.data) return

    const lastValidPage = Math.max(stalledDeals.data.totalPages, 1)
    if (stalledDealsPage > lastValidPage) {
      const correctionTimer = window.setTimeout(() => {
        setStalledDealsPage((current) =>
          current > lastValidPage ? lastValidPage : current
        )
      }, 0)
      return () => window.clearTimeout(correctionTimer)
    }
  }, [stalledDeals.data, stalledDealsPage])

  const isLoading = summary.isLoading
  const data = summary.data

  const totalOverdue = overdue.data?.length ?? 0

  const goal = settings.data?.monthlyAmountGoal ?? 600000
  const forecast = data?.pipelineForecast ?? 0
  const pct = goal > 0 ? Math.round((forecast / goal) * 100) : 0

  // Get current time for data freshness indicator
  const now = new Date()
  const timeString = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div>
      {/* Title */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard de ventas</h1>
          <p className="page-subtitle">
            Resumen del desempeño del equipo de hoy
          </p>
        </div>
        <p className="page-timestamp">
          Actualizado
          <br />a las {timeString}
        </p>
      </div>

      {summary.isError && (
        <div
          className="mb-4 flex items-center justify-between rounded-lg border p-3"
          style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}
        >
          <p className="text-[13px]" style={{ color: "var(--tracker-danger)" }}>
            No se pudo cargar el resumen. Verifica tu conexión e intenta de
            nuevo.
          </p>
          <Button
            variant="ghost"
            onClick={() => summary.refetch?.()}
            className="ml-3"
          >
            Reintentar
          </Button>
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
      <div className="page-grid mt-4">
        {/* Activity chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-h3" id="activity-chart-title">
              Actividad — últimos 14 días
            </h3>
            <p className="card-meta">
              Muestra llamadas, emails y reuniones registradas
            </p>
          </div>
          <div className="card-body" aria-labelledby="activity-chart-title">
            <ActivityChart data={trend.data ?? []} />
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-h3">Alertas operativas</h3>
          </div>
          <div className="card-body">
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
        <div className="card-header">
          <h3 className="card-h3">Desempeño del equipo</h3>
        </div>
        <SellerSemaphoreTable
          sellers={sellers.data ?? []}
          isLoading={sellers.isLoading}
        />
        {sellers.isError && (
          <div className="flex items-center justify-between px-5 pb-4">
            <p
              className="text-[13px]"
              style={{ color: "var(--tracker-danger)" }}
            >
              No se pudo cargar el desempeño del equipo.
            </p>
            <Button
              variant="ghost"
              onClick={() => sellers.refetch?.()}
              className="ml-3"
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Leaderboard del mes — Admin/Director only */}
      {isAdminOrDirector && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-h3">Leaderboard del mes</h3>
            <p className="card-meta">Ranking por puntos acumulados este mes</p>
          </div>
          {leaderboard.isError ? (
            <div className="flex items-center justify-between px-5 py-4">
              <p
                className="text-[13px]"
                style={{ color: "var(--tracker-danger)" }}
              >
                No se pudo cargar el leaderboard.
              </p>
              <Button
                variant="ghost"
                onClick={() => leaderboard.refetch?.()}
                className="ml-3"
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <LeaderboardTable
              entries={leaderboard.data ?? []}
              isLoading={leaderboard.isLoading}
            />
          )}
        </div>
      )}

      {/* Stalled deals — Admin/Director only */}
      {isAdminOrDirector && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-h3">Deals en riesgo</h3>
            <p className="card-meta">Oportunidades sin movimiento de etapa</p>
          </div>
          <div className="card-body">
            {stalledDeals.isLoading && (
              <p
                className="text-[13px]"
                style={{ color: "var(--tracker-text-secondary)" }}
              >
                Cargando...
              </p>
            )}
            {stalledDeals.isError && (
              <p
                className="text-[13px]"
                style={{ color: "var(--tracker-danger)" }}
              >
                No se pudo cargar los deals estancados.
              </p>
            )}
            {!stalledDeals.isLoading &&
              !stalledDeals.isError &&
              (stalledDeals.data?.data.length === 0 ? (
                <div className="empty-state">No hay deals estancados</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">
                          Días estancado
                        </TableHead>
                        <TableHead className="text-center">Severidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stalledDeals.data?.data.map((item) => (
                        <TableRow key={item.dealId}>
                          <TableCell
                            className="font-medium"
                            style={{ color: "var(--tracker-blue)" }}
                          >
                            {item.clientName}
                          </TableCell>
                          <TableCell
                            style={{ color: "var(--tracker-text-dim)" }}
                          >
                            {item.stage}
                          </TableCell>
                          <TableCell
                            style={{ color: "var(--tracker-text-dim)" }}
                          >
                            {item.sellerName || "—"}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            style={{ color: "var(--tracker-text-dim)" }}
                          >
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            style={{ color: "var(--tracker-text-dim)" }}
                          >
                            {item.daysStalled}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                item.severity === "red" ? "red" : "amber"
                              }
                            >
                              {item.severity === "red" ? "Rojo" : "Ámbar"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setStalledDealsPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      disabled={
                        stalledDealsPage <= 1 || stalledDeals.isFetching
                      }
                      aria-label="Ir a la página anterior de deals en riesgo"
                    >
                      Anterior
                    </Button>
                    <p
                      className="text-[13px]"
                      aria-live="polite"
                      style={{ color: "var(--tracker-text-secondary)" }}
                    >
                      Página {stalledDealsPage} de{" "}
                      {Math.max(stalledDeals.data?.totalPages ?? 0, 1)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setStalledDealsPage((current) => current + 1)
                      }
                      disabled={
                        stalledDeals.isFetching ||
                        stalledDealsPage >= (stalledDeals.data?.totalPages ?? 0)
                      }
                      aria-label="Ir a la página siguiente de deals en riesgo"
                    >
                      Siguiente
                    </Button>
                  </div>
                </>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
