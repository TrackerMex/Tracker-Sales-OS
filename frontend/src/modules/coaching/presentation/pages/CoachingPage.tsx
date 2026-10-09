import { useState } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCoachingDaily } from "../../application/hooks/useCoachingDaily"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { StatCard } from "@/shared/components/data/StatCard"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { EmptyState } from "@/shared/components/data/EmptyState"
import {
  ArrowRightIcon,
  PulseIcon,
  UserIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import { STATUS_FILL_CLASS, type StatusTone } from "@/shared/lib/status"
import type { EquipoSeller } from "@/modules/equipo/domain/equipo.types"
import type { ActivityMixItem } from "../../domain/coaching.types"
import { cn } from "@/lib/utils"

function getActivityCount(mix: ActivityMixItem[], types: string[]): number {
  return mix
    .filter((m) => types.includes(m.type))
    .reduce((sum, m) => sum + m.count, 0)
}

function getRecommendedAction(
  points: number,
  minDaily: number,
  overdueCount: number
): string {
  if (points < minDaily) return `Alcanzar mínimo de ${minDaily} puntos`
  if (overdueCount > 0) return `Atender ${overdueCount} seguimientos vencidos`
  return "Mantener ritmo de actividad"
}

// Seller cards: two per row on xl, one per row below. An odd last card spans
// the full row so the hairline bento has no empty cell.
function sellerSpan(index: number, total: number): string {
  return total % 2 === 1 && index === total - 1
    ? "col-span-12"
    : "col-span-12 xl:col-span-6"
}

function ProgressBar({ pct, tone }: { pct: number; tone: StatusTone }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
      <div
        className={cn(
          "h-full w-full origin-left rounded-full transition-transform duration-400 motion-reduce:transition-none",
          STATUS_FILL_CLASS[tone]
        )}
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  )
}

function SkeletonCard({
  className,
  label,
}: {
  className?: string
  label: string
}) {
  return (
    <div
      className={cn("flex flex-col gap-4 bg-background p-4", className)}
      role="status"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

interface SellerCoachingCardProps {
  seller: EquipoSeller
  minDaily: number
  className?: string
}

function SellerCoachingCard({
  seller,
  minDaily,
  className,
}: SellerCoachingCardProps) {
  const { data, isLoading } = useCoachingDaily(seller.id)

  if (isLoading)
    return (
      <SkeletonCard
        className={className}
        label={`Cargando coaching de ${seller.name}`}
      />
    )

  const mix: ActivityMixItem[] = data?.activityMix ?? []
  const calls = getActivityCount(mix, ["Llamada"])
  const meetings = getActivityCount(mix, [
    "Reunión virtual",
    "Reunión presencial",
    "Visita física",
  ])
  const proposals = getActivityCount(mix, ["Propuesta"])
  const closes = getActivityCount(mix, ["Cierre"])
  const points = data?.pointsToday ?? 0
  const quality = data?.avgQuality ?? 0
  const overdue = data?.overdueCount ?? 0
  const tomorrow = data?.tomorrowTasksCount ?? 0
  const totalActivities = data?.totalActivitiesToday ?? 0
  const mixInsights = data?.mixInsights ?? []

  const qualityTextClass =
    quality >= 80
      ? "text-status-success"
      : quality >= 50
        ? undefined
        : "text-status-danger"
  const qualityBarTone: StatusTone =
    quality >= 75 ? "success" : quality >= 45 ? "pending" : "danger"
  const recommendedAction = getRecommendedAction(points, minDaily, overdue)
  const meetsMinimum = points >= minDaily
  const progressPct =
    data?.progressPct ??
    (minDaily > 0 ? Math.min(100, Math.round((points / minDaily) * 100)) : 100)
  const progressTone: StatusTone = meetsMinimum
    ? "success"
    : progressPct >= 50
      ? "pending"
      : "danger"

  return (
    <SectionCard
      title={seller.name}
      icon={<UserIcon size={16} />}
      description={seller.profile ?? "Ejecutivo comercial"}
      actions={
        <StatusBadge tone={meetsMinimum ? "success" : "danger"}>
          {points}/{minDaily} pts
        </StatusBadge>
      }
      className={className}
    >
      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm text-muted-foreground">
          {totalActivities} actividades hoy
        </p>
        <ProgressBar pct={progressPct} tone={progressTone} />
      </div>

      <div className="grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-4">
        <StatCard label="Llamadas" value={calls} />
        <StatCard label="Reuniones" value={meetings} />
        <StatCard label="Propuestas" value={proposals} />
        <StatCard label="Cierres" value={closes} />
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-3">
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Calidad"
          value={<span className={qualityTextClass}>{quality}%</span>}
        >
          <ProgressBar pct={quality} tone={qualityBarTone} />
        </StatCard>
        <StatCard
          label="Vencidos"
          value={
            <span className={cn(overdue > 0 && "text-status-danger")}>
              {overdue}
            </span>
          }
        />
        <StatCard label="Mañana" value={tomorrow} />
      </div>

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-muted-foreground">
          {mixInsights.length > 0 ? (
            <PulseIcon size={16} />
          ) : (
            <ArrowRightIcon size={16} />
          )}
        </span>
        <h3 className="text-sm font-medium">
          {mixInsights.length > 0 ? "Coach IA" : "Acción recomendada"}
        </h3>
      </div>
      {mixInsights.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1.5 py-4 pr-4 pl-8 text-sm text-foreground">
          {mixInsights.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-sm text-foreground">{recommendedAction}</p>
      )}
    </SectionCard>
  )
}

export function CoachingPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role !== UserRole.Seller
  const currentSellerId = currentUser?.sellerId

  // Settings endpoint is gated to Admin/Director; Sellers get the goal from their own report
  const { data: settingsData } = useSettings()
  const { data: ownDaily } = useCoachingDaily(!isAdmin ? currentSellerId : null)
  const minDaily =
    settingsData?.dailyMinPoints ?? ownDaily?.dailyPointsGoal ?? 30

  const { data: sellers, isLoading: sellersLoading } = useSellers()
  const currentSeller = sellers?.find((s) => s.id === currentSellerId)

  const sellerFallback: EquipoSeller | null = currentSellerId
    ? {
        id: currentSellerId,
        name: currentUser?.name ?? "",
        profile: null,
        userId: currentUser?.id ?? null,
        active: true,
        createdAt: "",
      }
    : null

  const activeSellers = sellers?.filter((s) => s.active) ?? []
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const displayedSellers = selectedSellerId
    ? activeSellers.filter((s) => s.id === selectedSellerId)
    : activeSellers

  const ownSeller = currentSeller ?? sellerFallback

  return (
    <div>
      <PageHeader
        title="Coaching"
        description="Termómetro exacto de actividad comercial por vendedor"
        actions={
          <>
            <span className="text-sm text-muted-foreground">
              Mínimo diario{" "}
              <span className="font-semibold text-foreground">
                {minDaily} pts
              </span>
            </span>
            {isAdmin && activeSellers.length > 0 && (
              <Select
                value={selectedSellerId ?? "all"}
                onValueChange={(value) =>
                  setSelectedSellerId(value === "all" ? null : value)
                }
              >
                <SelectTrigger
                  className="w-auto min-w-40"
                  aria-label="Filtrar por vendedor"
                >
                  <SelectValue placeholder="Todos los vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {activeSellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {isAdmin ? (
        sellersLoading ? (
          <div className="grid grid-cols-12 gap-px bg-border p-px">
            <SkeletonCard
              className="col-span-12 xl:col-span-6"
              label="Cargando vendedores"
            />
            <SkeletonCard
              className="col-span-12 xl:col-span-6"
              label="Cargando vendedores"
            />
          </div>
        ) : activeSellers.length > 0 ? (
          <div className="grid grid-cols-12 gap-px bg-border p-px">
            {displayedSellers.map((seller, i) => (
              <SellerCoachingCard
                key={seller.id}
                seller={seller}
                minDaily={minDaily}
                className={sellerSpan(i, displayedSellers.length)}
              />
            ))}
          </div>
        ) : (
          <div className="border border-border bg-background">
            <EmptyState
              icon={<UsersIcon size={20} />}
              title="Sin vendedores activos"
              description="Registra vendedores en la sección Equipo para ver el reporte."
            />
          </div>
        )
      ) : (
        ownSeller && (
          <div className="grid grid-cols-12 gap-px bg-border p-px">
            <SellerCoachingCard
              seller={ownSeller}
              minDaily={minDaily}
              className="col-span-12"
            />
          </div>
        )
      )}
    </div>
  )
}
