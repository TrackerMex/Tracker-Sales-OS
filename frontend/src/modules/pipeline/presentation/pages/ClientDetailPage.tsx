import { useState, Fragment } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { clientsApi } from "@/modules/clients/infrastructure/clients.api"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import { ActivityHistoryModal } from "@/modules/activities/presentation/components/ActivityHistoryModal"
import { useAppStore } from "@/shared/store/app.store"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import type { Activity } from "@/modules/activities/domain/activities.types"

interface Props {
  deal: Deal
  onBack: () => void
}

const STAGE_COLORS: Record<string, string> = {
  Prospecto: '#002B49',
  Contactado: '#1E40AF',
  Interesado: '#82bc00',
  Propuesta: '#D97706',
  'Negociación': '#7C3AED',
  Cierre: '#059669',
  Perdido: '#DC2626',
}

const STAGE_ORDER: PipelineStage[] = [
  'Prospecto', 'Contactado', 'Interesado', 'Propuesta', 'Negociación', 'Cierre',
]

export function ClientDetailPage({ deal, onBack }: Props) {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const username = currentUser?.username ?? ""
  const changeStage = useChangeStage()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const { data: client } = useQuery({
    queryKey: ["clients", deal.clientId],
    queryFn: () => clientsApi.getClients({ limit: 100 }).then((r) => r.data.find((c) => c.id === deal.clientId)),
    enabled: !!deal.clientId,
  })

  const { data: dealActivities } = useQuery({
    queryKey: ["activities", "client", deal.clientId, deal.sellerId],
    queryFn: () => activitiesApi.getClientActivities(deal.clientId!),
    enabled: !!deal.clientId,
  })

  const clientActivities: Activity[] = (dealActivities ?? []).filter(
    (a) => a.sellerId === deal.sellerId,
  )

  const currentIdx = STAGE_ORDER.indexOf(deal.stage as PipelineStage)

  function handleStageChange(newStage: PipelineStage) {
    changeStage.mutate({
      dealId: deal.id,
      input: { newStage, changedBy: username },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header sticky */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
        position: 'sticky', top: 0, background: '#fff', zIndex: 10,
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#002B49' }}>{deal.clientName}</h2>
          <p style={{ fontSize: 11, color: '#64748B' }}>
            {deal.sellerName ?? ''}{deal.sellerName ? ' · ' : ''}Oportunidad principal
          </p>
        </div>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Stage Stepper */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>
          Etapa actual
        </p>

        {/* Dots + connectors */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {STAGE_ORDER.map((s, idx) => {
            const isPast = idx < currentIdx
            const isCurrent = idx === currentIdx
            return (
              <Fragment key={s}>
                <button
                  title={s}
                  onClick={() => handleStageChange(s)}
                  disabled={isCurrent}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent ? (STAGE_COLORS[s] ?? '#002B49') : isPast ? '#94A3B8' : '#E2E8F0',
                    color: (isCurrent || isPast) ? '#fff' : '#94A3B8',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </button>
                {idx < STAGE_ORDER.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: isPast ? '#94A3B8' : '#E2E8F0', minWidth: 8 }} />
                )}
              </Fragment>
            )
          })}
          <div style={{ width: 16 }} />
          {/* Perdido button */}
          <button
            title="Perdido"
            onClick={() => handleStageChange('Perdido')}
            disabled={deal.stage === 'Perdido'}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: '1px solid #FCA5A5',
              cursor: deal.stage === 'Perdido' ? 'default' : 'pointer',
              background: deal.stage === 'Perdido' ? '#DC2626' : '#FEF2F2',
              color: deal.stage === 'Perdido' ? '#fff' : '#DC2626',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {STAGE_ORDER.map((s, idx) => (
            <Fragment key={s}>
              <span style={{
                fontSize: 9,
                color: idx === currentIdx ? '#002B49' : '#94A3B8',
                fontWeight: idx === currentIdx ? 700 : 400,
                textAlign: 'center', width: 28, flexShrink: 0,
                overflow: 'hidden', lineHeight: 1.2,
              }}>
                {s.slice(0, 4)}
              </span>
              {idx < STAGE_ORDER.length - 1 && <div style={{ flex: 1, minWidth: 8 }} />}
            </Fragment>
          ))}
        </div>

        <p style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
          <strong style={{ color: '#002B49' }}>{deal.stage}</strong>
          {deal.amount ? ` · ${deal.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })}` : ''}
          {deal.probability !== undefined ? ` · ${deal.probability}% prob` : ''}
        </p>
      </div>

      {/* Client info — 2 cols */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
            Contactos
          </p>
          {client?.contacts && client.contacts.length > 0 ? (
            client.contacts.map((c) => (
              <div key={c.id} style={{ marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{c.name}</p>
                <p style={{ fontSize: 11, color: '#94A3B8' }}>
                  {c.role}{c.isDecisionMaker ? ' · Principal' : ''}
                </p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin contactos</p>
          )}
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Dolor</p>
          <p style={{ fontSize: 12, color: '#334155', marginBottom: 12 }}>{client?.pain ?? deal.painPoint ?? '-'}</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Proveedor</p>
          <p style={{ fontSize: 12, color: '#334155' }}>{client?.provider ?? '-'}</p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div style={{ padding: '16px 20px', flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>
          Historial comercial
        </p>

        {clientActivities.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin actividades registradas</p>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 9, top: 8, bottom: 8,
              width: 2, background: '#E2E8F0',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {clientActivities.map((activity) => (
                <div key={activity.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: activity.status === 'Completada' ? '#82bc00'
                      : activity.status === 'Cancelada' ? '#94A3B8' : '#E2E8F0',
                    border: '2px solid #fff', zIndex: 1, marginTop: 2,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="tag tag-navy" style={{ fontSize: 10 }}>{activity.type}</span>
                        {activity.stage && (
                          <span className="tag" style={{ fontSize: 10 }}>{activity.stage}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginLeft: 8 }}>
                        {new Date(activity.executedAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    {activity.summary && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                          {activity.summary.length > 120 && !expandedIds.has(activity.id)
                            ? activity.summary.slice(0, 120) + '...'
                            : activity.summary}
                        </p>
                        {activity.summary.length > 120 && (
                          <button
                            className="btn-ghost"
                            style={{ fontSize: 10, padding: '1px 0', color: '#64748B' }}
                            onClick={() => toggleExpand(activity.id)}
                          >
                            {expandedIds.has(activity.id) ? 'Ver menos' : 'Ver más'}
                          </button>
                        )}
                      </div>
                    )}
                    {activity.nextStep && (
                      <p style={{ fontSize: 11, color: '#82bc00', fontWeight: 600 }}>
                        → {activity.nextStep}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>
                        +{activity.points}pts · {activity.quality}% cal.
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 10, padding: '1px 6px' }}
                        onClick={() => setSelectedActivityId(activity.id)}
                      >
                        Detalle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div style={{
        padding: '16px 20px', borderTop: '1px solid #E2E8F0',
        position: 'sticky', bottom: 0, background: '#fff',
      }}>
        <button
          onClick={() => navigate({ to: "/actividades/nueva", search: { clientId: deal.clientId } })}
          style={{
            width: '100%', padding: '10px 0', background: '#82bc00', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Registrar avance
        </button>
      </div>

      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
