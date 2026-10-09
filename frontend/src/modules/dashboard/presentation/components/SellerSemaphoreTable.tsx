import { Link } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { TeamIcon } from "@/shared/components/Icon"
import { STATUS_FILL_CLASS, type StatusTone } from "@/shared/lib/status"
import { cn } from "@/lib/utils"
import type { SellerScore } from "../../domain/dashboard.types"

interface SellerSemaphoreTableProps {
  sellers: SellerScore[]
  isLoading: boolean
}

function getSemaphoreTone(score: number): StatusTone {
  if (score >= 75) return "success"
  if (score >= 45) return "pending"
  return "danger"
}

export function SellerSemaphoreTable({
  sellers,
  isLoading,
}: SellerSemaphoreTableProps) {
  if (isLoading) {
    return (
      <div role="status" aria-label="Cargando desempeño del equipo">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-5 w-56" />
          </div>
        ))}
      </div>
    )
  }

  if (sellers.length === 0) {
    return (
      <EmptyState
        icon={<TeamIcon size={20} />}
        title="No hay vendedores activos"
        description="Los vendedores aparecerán aquí una vez que tengan actividad registrada."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {sellers.map((seller) => {
        const tone = getSemaphoreTone(seller.score)
        return (
          <Link
            key={seller.sellerId}
            to="/coaching"
            className="flex flex-col gap-2 border-b border-border px-4 py-3 transition-colors outline-none last:border-0 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            aria-label={`${seller.sellerName}: puntuación ${seller.score}, ${seller.overdueCount > 0 ? seller.overdueCount + " seguimientos vencidos" : "sin seguimientos vencidos"}`}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span
                className="truncate text-sm font-medium text-foreground"
                title={seller.sellerName}
              >
                {seller.sellerName}
              </span>
              <StatusBadge
                tone={tone}
                aria-label={`Puntuación ${seller.score} de 100`}
              >
                {seller.score}
              </StatusBadge>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  "h-full w-full origin-left rounded-full transition-transform duration-400 motion-reduce:transition-none",
                  STATUS_FILL_CLASS[tone]
                )}
                style={{
                  transform: `scaleX(${Math.min(seller.score, 100) / 100})`,
                }}
                role="progressbar"
                aria-valuenow={seller.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso: ${seller.score}%`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="shrink-0">{seller.pointsToday} pts hoy</span>
              <span className="shrink-0">
                {seller.avgQualityToday}% calidad
              </span>
              <span className="shrink-0">{seller.monthlyPoints} pts mes</span>
              {seller.overdueCount > 0 && (
                <span
                  className="shrink-0 font-medium text-status-danger"
                  role="status"
                >
                  {seller.overdueCount}{" "}
                  {seller.overdueCount === 1 ? "vencida" : "vencidas"}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
