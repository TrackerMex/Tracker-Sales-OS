import { useSearch } from "@tanstack/react-router"
import { UserRole } from "@/core/domain/types/common.types"
import { useAppStore } from "@/shared/store/app.store"
import { AlertCircleIcon } from "@/shared/components/Icon"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { useMonthlyReport } from "../../application/hooks/useMonthlyReport"
import { useWinLoss } from "../../application/hooks/useWinLoss"
import { ExecutiveSlide } from "../components/ExecutiveSlide"

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function LaminaPage() {
  const role = useAppStore((s) => s.currentUser?.role)
  const search = useSearch({ strict: false }) as {
    month?: string
    goalAmount?: number
    goalUnits?: number
    goalPerSeller?: number
  }

  const month = search.month ?? currentMonth()
  const goalAmount = search.goalAmount ?? 600000
  const goalUnits = search.goalUnits ?? 150
  const goalPerSeller = search.goalPerSeller ?? 150000

  const { data, isLoading, error, dataUpdatedAt } = useMonthlyReport(month)
  const { data: winLoss, isLoading: winLossLoading } = useWinLoss()

  const updatedAt =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null

  if (role !== UserRole.Admin && role !== UserRole.Director) {
    return (
      <div>
        <PageHeader title="Lámina" />
        <EmptyState icon={<AlertCircleIcon size={20} />} title="Acceso no disponible" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen min-w-0 bg-tracker-bg p-4 sm:p-8 print:p-0"
      style={{ fontFamily: "'Montserrat Variable','Montserrat','Inter',sans-serif" }}
    >
      <div className="mx-auto max-w-[1080px]">
        {isLoading && (
          <p className="pt-[60px] text-center text-[13px] text-tracker-text-muted">
            Cargando reporte...
          </p>
        )}
        {error && (
          <p className="pt-[60px] text-center text-[13px] text-tracker-danger-dark">
            Error al cargar el reporte. Verifica que tengas acceso.
          </p>
        )}
        {data && (
          <ExecutiveSlide
            data={data}
            winLoss={winLoss}
            winLossLoading={winLossLoading}
            goalAmount={goalAmount}
            goalUnits={goalUnits}
            goalPerSeller={goalPerSeller}
            month={month}
            updatedAt={updatedAt}
          />
        )}
        <p className="mt-4 text-center text-[11px] text-tracker-text-muted">
          Tracker Sales OS — Reporte Ejecutivo {month}
        </p>
      </div>
    </div>
  )
}
