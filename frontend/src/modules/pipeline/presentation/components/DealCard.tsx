import { useEffect, useRef, useState } from "react"
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import type { Deal } from "../../domain/pipeline.types"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"

const STAGE_BADGE_COLORS: Record<string, string> = {
  Prospecto: '#002B49',
  Contactado: '#1E40AF',
  Interesado: '#82bc00',
  Propuesta: '#D97706',
  'Negociación': '#7C3AED',
  Cierre: '#059669',
  Perdido: '#DC2626',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

interface DealCardProps {
  deal: Deal
  onClick: (deal: Deal) => void
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const contactInfo = [deal.contactName, deal.contactRole].filter(Boolean).join(' · ')
  const badgeColor = STAGE_BADGE_COLORS[deal.stage] || '#002B49'
  const { data: settings } = useSettings()

  const lastChange = deal.stageHistory?.length > 0
    ? deal.stageHistory[deal.stageHistory.length - 1].changedAt
    : (deal.createdAt as string | undefined)
  const daysStalled = lastChange
    ? Math.floor((Date.now() - new Date(lastChange).getTime()) / 86400000)
    : 0
  const amberDays = settings?.stalledAmberDays ?? 7
  const redDays = settings?.stalledRedDays ?? 14
  const showRed = daysStalled >= redDays
  const showAmber = !showRed && daysStalled >= amberDays

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return draggable({
      element: el,
      getInitialData: () => ({ dealId: deal.id as string, type: 'deal' }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [deal.id])

  return (
    <div
      ref={ref}
      onClick={() => onClick(deal)}
      className="card"
      style={{
        padding: '14px',
        marginBottom: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'box-shadow 0.2s, opacity 0.15s',
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <p style={{ fontSize: '13px', lineHeight: '1.3', fontWeight: 700, color: '#002B49', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.clientName}
        </p>
        <span
          style={{
            flexShrink: 0,
            fontSize: '10px',
            fontWeight: 700,
            color: '#fff',
            background: badgeColor,
            borderRadius: '10px',
            padding: '2px 8px',
            textTransform: 'uppercase',
          }}
        >
          {deal.stage}
        </span>
      </div>

      {contactInfo && (
        <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>
          {contactInfo}
        </p>
      )}

      {deal.painPoint && (
        <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.painPoint}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
          {deal.sellerName ?? ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(showRed || showAmber) && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
              background: showRed ? '#ef4444' : '#f59e0b',
              borderRadius: '10px',
              padding: '2px 6px',
            }}>
              {daysStalled}d
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            {deal.createdAt ? formatDate(deal.createdAt as unknown as string) : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
