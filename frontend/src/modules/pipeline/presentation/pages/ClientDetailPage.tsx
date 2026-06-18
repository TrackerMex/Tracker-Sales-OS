import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { clientsApi } from "@/modules/clients/infrastructure/clients.api"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import { ActivityHistoryModal } from "@/modules/activities/presentation/components/ActivityHistoryModal"
import { useAppStore } from "@/shared/store/app.store"
import { useChangeStage } from "../../application/hooks/useChangeStage"
import type { Deal, PipelineStage } from "../../domain/pipeline.types"
import type { Activity } from "@/modules/activities/domain/activities.types"

const STATUS_CLASSES: Record<string, string> = {
  Pendiente: "tag tag-yellow",
  "En curso": "tag tag-blue",
  Completada: "tag tag-green",
  Cancelada: "tag",
}

interface Props {
  deal: Deal
  onBack: () => void
}

const PIPELINE_STAGES: PipelineStage[] = [
  "Prospecto", "Contactado", "Interesado", "Propuesta",
  "Negociación", "Cierre", "Perdido",
]

const STAGE_COLORS: Record<string, string> = {
  Prospecto: '#002B49',
  Contactado: '#1E40AF',
  Interesado: '#82bc00',
  Propuesta: '#D97706',
  'Negociación': '#7C3AED',
  Cierre: '#059669',
  Perdido: '#DC2626',
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCaptured(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ClientDetailPage({ deal, onBack }: Props) {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const username = currentUser?.username ?? ""
  const changeStage = useChangeStage()
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

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

  function handleStageChange(newStage: PipelineStage) {
    changeStage.mutate({
      dealId: deal.id,
      input: { newStage, changedBy: username },
    })
  }

  return (
    <div className="space-y-4">
      <button
        className="btn-ghost"
        onClick={onBack}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Volver al pipeline
      </button>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div className="card" style={{ padding: 20, background: '#001524', color: '#fff' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{deal.clientName}</h2>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#82bc00', textTransform: 'uppercase', marginBottom: 16 }}>
              {deal.stage} · {deal.sellerName ?? ''}
            </p>

            {/* Contacts */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Contactos</p>
              {client?.contacts && client.contacts.length > 0 ? (
                client.contacts.map((c) => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{c.role}{c.isDecisionMaker ? ' · Contacto principal' : ''}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: '#64748B' }}>Sin contactos</p>
              )}
            </div>

            {/* Pain */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Dolor</p>
              <p style={{ fontSize: 13 }}>{client?.pain ?? deal.painPoint ?? '-'}</p>
            </div>

            {/* Provider */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Proveedor actual</p>
              <p style={{ fontSize: 13 }}>{client?.provider ?? '-'}</p>
            </div>

            {/* Next Step */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Próximo paso</p>
              {deal.nextStep ? (
                <>
                  <p style={{ fontSize: 13, color: '#82bc00', fontWeight: 600 }}>{deal.nextStep}</p>
                  {deal.nextDate && (
                    <p style={{ fontSize: 12, color: '#94A3B8' }}>{deal.nextDate}{deal.nextTime ? ` ${deal.nextTime}` : ''}</p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 13 }}>-</p>
              )}
            </div>

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

          {/* Update Stage */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 }}>Actualizar fase</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PIPELINE_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  disabled={s === deal.stage}
                  style={{
                    padding: '6px 0', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid #E2E8F0',
                    background: s === deal.stage ? STAGE_COLORS[s] ?? '#002B49' : '#fff',
                    color: s === deal.stage ? '#fff' : '#475569',
                    cursor: s === deal.stage ? 'default' : 'pointer',
                    opacity: s === deal.stage ? 1 : 0.8,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Historial comercial */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Historial comercial</h3>
          {clientActivities.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Sin actividades registradas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientActivities.map((activity) => (
                <div key={activity.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#002B49' }}>
                        {activity.type} · {activity.result}
                        {activity.stage && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, fontWeight: 600,
                            background: '#F1F5F9', color: '#475569',
                            borderRadius: 4, padding: '2px 6px',
                          }}>
                            {activity.stage}
                          </span>
                        )}
                      </p>
                      <span className={STATUS_CLASSES[activity.status ?? 'Pendiente'] ?? 'tag'} style={{ alignSelf: 'flex-start' }}>
                        {activity.status ?? 'Pendiente'}
                      </span>
                      {activity.contactId && (
                        <p style={{ fontSize: 12, color: '#64748B' }}>
                          Contacto: {client?.contacts.find((c) => c.id === activity.contactId)?.name ?? activity.contactId}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        {new Date(activity.executedAt).toLocaleDateString('es-MX')}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setSelectedActivityId(activity.id)}
                      >
                        Ver historial
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                    Ejecutada: {formatDateTime(activity.executedAt)} · Capturada: {formatCaptured(activity.capturedAt)}
                  </p>
                  {activity.summary && (
                    <p style={{ fontSize: 12, color: '#334155', marginBottom: 2 }}>
                      <strong>Qué ocurrió:</strong> {activity.summary}
                    </p>
                  )}
                  {activity.discovery && (
                    <p style={{ fontSize: 12, color: '#334155', marginBottom: 2 }}>
                      <strong>Descubrí:</strong> {activity.discovery}
                    </p>
                  )}
                  {activity.agreement && (
                    <p style={{ fontSize: 12, color: '#334155', marginBottom: 2 }}>
                      <strong>Acordamos:</strong> {activity.agreement}
                    </p>
                  )}
                  {activity.nextStep && (
                    <p style={{ fontSize: 12, color: '#82bc00', fontWeight: 600, marginTop: 6 }}>
                      Siguiente paso: {activity.nextStep}{activity.nextDate ? ` · ${activity.nextDate}` : ''}{activity.nextTime ? ` ${activity.nextTime}` : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#94A3B8' }}>
                    <span>Calidad: {activity.quality}%</span>
                    <span>Puntos: {activity.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ActivityHistoryModal
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />
    </div>
  )
}
