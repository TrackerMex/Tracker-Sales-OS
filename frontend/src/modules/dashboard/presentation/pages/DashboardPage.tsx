import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
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
import type {
  ActivityTrendItem,
  StalledDeal,
} from "../../domain/dashboard.types"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { formatCurrency } from "@/shared/lib/format"
import { lineChartOptions, useChartColors } from "@/shared/lib/chart"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DottedDivider } from "@/shared/components/layout/DottedDivider"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import {
  AlertCircleIcon,
  BarChartIcon,
  CalendarIcon,
  CheckCircleIcon,
  KanbanIcon,
  PulseIcon,
  TeamIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function ErrorRow({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-sm text-status-danger">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

function ActivityChart({ data }: { data: ActivityTrendItem[] }) {
  const colors = useChartColors()
  const options = useMemo(() => lineChartOptions(colors), [colors])
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: "Actividades",
          data: data.map((d) => d.count),
          borderColor: colors.primary,
          backgroundColor: colors.primary,
          pointHoverBackgroundColor: colors.primary,
        },
      ],
    }),
    [data, colors]
  )

  return (
    <div className="relative h-[215px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}

const stalledDealColumns: ColumnDef<StalledDeal>[] = [
  {
    id: "clientName",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.clientName}
      </span>
    ),
  },
  {
    id: "stage",
    header: "Etapa",
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    id: "sellerName",
    header: "Vendedor",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.sellerName || "—"}
      </span>
    ),
  },
  {
    id: "amount",
    header: "Monto",
    meta: { className: "text-right" },
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    id: "daysStalled",
    header: "Días estancado",
    meta: { className: "text-right" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.daysStalled}</span>
    ),
  },
  {
    id: "severity",
    header: "Severidad",
    meta: { className: "text-center" },
    cell: ({ row }) =>
      row.original.severity === "red" ? (
        <StatusBadge tone="danger">Rojo</StatusBadge>
      ) : (
        <StatusBadge tone="pending">Ámbar</StatusBadge>
      ),
  },
]

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

  const trendData = trend.data ?? []
  const trendTotal = trendData.reduce((sum, d) => sum + d.count, 0)

  // Get current time for data freshness indicator
  const now = new Date()
  const timeString = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div>
      <PageHeader
        title="Dashboard de ventas"
        description={`Resumen del desempeño del equipo de hoy · Actualizado a las ${timeString}`}
      />

      {summary.isError && (
        <div className="mb-4 flex items-center justify-between gap-3 border border-destructive/20 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-status-danger">
            No se pudo cargar el resumen. Verifica tu conexión e intenta de
            nuevo.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => summary.refetch?.()}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <KPIStrip
          salesValue={formatCurrency(data?.totalSalesAmount ?? 0)}
          salesCount={data?.totalSalesCount ?? 0}
          unitsValue={data?.totalUnits ?? 0}
          unitsGoal={150}
          pointsValue={data?.totalPoints ?? 0}
          qualityValue={data?.avgQuality ?? 0}
          forecastValue={formatCurrency(forecast)}
          forecastSubtitle={`${pct}% de meta ${formatCurrency(goal)}`}
          isLoading={isLoading}
        />

        <DottedDivider />

        <SectionCard
          title="Actividad — últimos 14 días"
          icon={<PulseIcon size={16} />}
          titleId="activity-chart-title"
          className="lg:col-span-7"
          contentClassName="flex flex-col gap-6 p-5"
        >
          <div className="flex flex-col gap-1">
            <span className="text-base text-foreground">
              Actividades registradas
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {trend.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-2xl font-semibold text-foreground">
                  {trendTotal.toLocaleString("es-MX")}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Muestra llamadas, emails y reuniones registradas
              </span>
            </div>
          </div>
          <div role="figure" aria-labelledby="activity-chart-title">
            <ActivityChart data={trendData} />
          </div>
        </SectionCard>

        <SectionCard
          title="Alertas operativas"
          icon={<AlertCircleIcon size={16} />}
          className="lg:col-span-5"
        >
          <AlertsPanel
            alerts={[
              {
                label: "Seguimientos vencidos (acción requerida)",
                value: String(totalOverdue),
                color: "red",
                icon: <AlertCircleIcon size={16} />,
              },
              {
                label: "Tareas programadas para mañana",
                value: "0",
                color: "amber",
                icon: <CalendarIcon size={16} />,
              },
              {
                label: "Cumplimiento del equipo esta semana",
                value: `${data?.avgQuality?.toFixed(0) ?? 0}%`,
                color: "green",
                icon: <CheckCircleIcon size={16} />,
              },
              {
                label: "Nuevos prospectos hoy",
                value: "0",
                color: "navy",
                icon: <UsersIcon size={16} />,
              },
            ]}
          />
        </SectionCard>

        <DottedDivider />

        <SectionCard
          title="Desempeño del equipo"
          icon={<TeamIcon size={16} />}
          className={isAdminOrDirector ? "lg:col-span-6" : undefined}
        >
          <SellerSemaphoreTable
            sellers={sellers.data ?? []}
            isLoading={sellers.isLoading}
          />
          {sellers.isError && (
            <ErrorRow
              message="No se pudo cargar el desempeño del equipo."
              onRetry={() => sellers.refetch?.()}
            />
          )}
        </SectionCard>

        {/* Leaderboard del mes — Admin/Director only */}
        {isAdminOrDirector && (
          <SectionCard
            title="Leaderboard del mes"
            icon={<BarChartIcon size={16} />}
            description="Ranking por puntos acumulados este mes"
            className="lg:col-span-6"
          >
            {leaderboard.isError ? (
              <ErrorRow
                message="No se pudo cargar el leaderboard."
                onRetry={() => leaderboard.refetch?.()}
              />
            ) : (
              <LeaderboardTable
                entries={leaderboard.data ?? []}
                isLoading={leaderboard.isLoading}
              />
            )}
          </SectionCard>
        )}

        {/* Stalled deals — Admin/Director only */}
        {isAdminOrDirector && (
          <>
            <DottedDivider />
            <SectionCard
              title="Deals en riesgo"
              icon={<KanbanIcon size={16} />}
              description="Oportunidades sin movimiento de etapa"
            >
              {stalledDeals.isLoading && (
                <div
                  className="flex flex-col gap-3 p-4"
                  role="status"
                  aria-label="Cargando deals en riesgo"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}
              {stalledDeals.isError && (
                <ErrorRow message="No se pudo cargar los deals estancados." />
              )}
              {!stalledDeals.isLoading &&
                !stalledDeals.isError &&
                (stalledDeals.data?.data.length === 0 ? (
                  <EmptyState
                    icon={<KanbanIcon size={20} />}
                    title="No hay deals estancados"
                  />
                ) : (
                  <DataTable
                    columns={stalledDealColumns}
                    data={stalledDeals.data?.data ?? []}
                    getRowId={(d) => d.dealId}
                    pagination={{
                      page: stalledDealsPage,
                      pageCount: stalledDeals.data?.totalPages ?? 0,
                      onPageChange: setStalledDealsPage,
                      disabled: stalledDeals.isFetching,
                      label: "deals en riesgo",
                    }}
                  />
                ))}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}
