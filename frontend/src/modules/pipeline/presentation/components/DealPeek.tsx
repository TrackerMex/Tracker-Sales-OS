import { useNavigate } from "@tanstack/react-router"
import type { Deal } from "../../domain/pipeline.types"
import { formatCurrency } from "@/shared/lib/format"
import { Button } from "@/components/ui/button"
import { PeekHeader, PeekRow, PeekActions } from "@/shared/components/peek/Peek"

const STAGE_BADGE_COLORS: Record<string, string> = {
  Prospecto: "#002B49",
  Contactado: "#1E40AF",
  Interesado: "#82bc00",
  Propuesta: "#D97706",
  Negociación: "#7C3AED",
  Cierre: "#059669",
  Perdido: "#DC2626",
}

export function DealPeek({
  deal,
  onOpenDetail,
}: {
  deal: Deal
  onOpenDetail: (deal: Deal) => void
}) {
  const navigate = useNavigate()
  const badgeColor = STAGE_BADGE_COLORS[deal.stage] || "#002B49"

  return (
    <div className="w-64">
      <PeekHeader
        title={deal.clientName}
        badge={
          <span
            style={{ background: badgeColor }}
            className="shrink-0 rounded-[10px] px-2 py-0.5 text-[10px] font-bold text-white uppercase"
          >
            {deal.stage}
          </span>
        }
      />
      <PeekRow label="Monto" value={formatCurrency(deal.amount)} />
      <PeekRow label="Probabilidad" value={`${deal.probability}%`} />
      {deal.sellerName && (
        <PeekRow label="Vendedor" value={deal.sellerName} />
      )}
      {deal.nextStep && <PeekRow label="Próximo paso" value={deal.nextStep} />}
      {deal.updatedAt && (
        <PeekRow
          label="Última actividad"
          value={new Date(deal.updatedAt).toLocaleDateString("es-MX")}
        />
      )}
      <PeekActions>
        <Button
          size="xs"
          variant="secondary"
          className="flex-1"
          onClick={() => onOpenDetail(deal)}
        >
          Abrir expediente
        </Button>
        <Button
          size="xs"
          variant="success"
          className="flex-1"
          onClick={() =>
            void navigate({
              to: "/actividades/nueva",
              search: { clientId: deal.clientId, clientName: deal.clientName },
            })
          }
        >
          Registrar avance
        </Button>
      </PeekActions>
    </div>
  )
}
