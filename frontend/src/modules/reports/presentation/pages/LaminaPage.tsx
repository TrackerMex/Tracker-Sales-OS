import { useSearch } from "@tanstack/react-router"
import { useMonthlyReport } from "../../application/hooks/useMonthlyReport"
import { useWinLoss } from "../../application/hooks/useWinLoss"
import { ExecutiveSlide } from "../components/ExecutiveSlide"

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function LaminaPage() {
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

  return (
    <div
      className="min-h-screen bg-tracker-bg p-8"
      style={{ fontFamily: "'Montserrat','Inter',sans-serif" }}
    >
      <div className="mx-auto max-w-[1080px]">
        {isLoading && (
          <p className="pt-[60px] text-center text-[13px] text-tracker-text-muted">
            Cargando reporte...
          </p>
        )}
        {error && (
          <p className="pt-[60px] text-center text-[13px] text-red-500">
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
