import { useNavigate } from "@tanstack/react-router"
import type { Deal } from "../../domain/pipeline.types"
import { formatCurrency } from "@/shared/lib/format"
import { Button } from "@/components/ui/button"
import { PeekHeader, PeekRow, PeekActions } from "@/shared/components/peek/Peek"
import { StatusBadge } from "@/shared/components/data/StatusBadge"

export function DealPeek({
  deal,
  onOpenDetail,
}: {
  deal: Deal
  onOpenDetail: (deal: Deal) => void
}) {
  const navigate = useNavigate()

  return (
    <div className="w-64">
      <PeekHeader
        title={deal.clientName}
        badge={<StatusBadge status={deal.stage} />}
      />
      <PeekRow label="Monto" value={formatCurrency(deal.amount)} />
      <PeekRow label="Probabilidad" value={`${deal.probability}%`} />
      {deal.sellerName && <PeekRow label="Vendedor" value={deal.sellerName} />}
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
