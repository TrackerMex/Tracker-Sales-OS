import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import { DealCard } from "./DealCard"


const NO_CREATE_STAGES: PipelineStage[] = ["Cierre", "Perdido"]

interface KanbanColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onChangeStage: (dealId: string, newStage: PipelineStage) => void
  onCreateDeal: (stage: PipelineStage) => void
}

export function KanbanColumn({
  stage,
  deals,
  onChangeStage,
  onCreateDeal,
}: KanbanColumnProps) {
  const canCreate = !NO_CREATE_STAGES.includes(stage)

  return (
    <div className="pipe-col">
      <div className="pipe-col-h">
        <span>{stage}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block',
            minWidth: '22px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748B',
            background: '#E2E8F0',
            borderRadius: '10px',
            padding: '2px 6px'
          }}>
            {deals.length}
          </span>
          {canCreate && (
            <button
              onClick={() => onCreateDeal(stage)}
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
                color: '#64748B',
                background: '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#CBD5E1'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#E2E8F0'}
              title={`Crear deal en ${stage}`}
            >
              +
            </button>
          )}
        </div>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '4px' }}>
        {deals.length === 0 ? (
          <p style={{ padding: '16px 0', textAlign: 'center', fontSize: '12px', color: '#CBD5E1' }}>
            Sin deals
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onChangeStage={onChangeStage} />
          ))
        )}
      </div>
    </div>
  )
}
