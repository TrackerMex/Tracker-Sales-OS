import { useState, useMemo } from 'react'
import { useClients } from '../../../clients/application/hooks/useClients'
import type { CreateTaskInput } from '../../domain/tasks.types'
import { coachingApi } from '../../../coaching/infrastructure/coaching.api'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError'

const TASK_TYPES = [
  'Chat',
  'WhatsApp',
  'Correo',
  'Llamada',
  'Videoconferencia',
  'Reunión virtual',
  'Visita física',
  'Reunión presencial',
  'Propuesta',
  'Seguimiento',
  'Cierre',
]

const OUTLOOK_TYPES = new Set(['Videoconferencia', 'Reunión virtual', 'Visita física', 'Reunión presencial'])

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getAiComment(type: string, objective: string, contactName: string): string {
  const lower = objective.toLowerCase()
  if (objective.length < 10) return 'Escribe el objetivo de la tarea y te daré una sugerencia antes de guardar.'
  if (lower.includes('compra') || lower.includes('cierre'))
    return `Buena tarea de cierre. Con ${contactName}: confirma 1) unidades, 2) fecha de compra, 3) presupuesto final.`
  if (lower.includes('propuesta') || type === 'Propuesta')
    return `Antes de enviar propuesta, valida con ${contactName}: dolor principal, presupuesto y timeline de decisión.`
  if (type === 'Reunión presencial' || type === 'Reunión virtual' || type === 'Videoconferencia' || type === 'Visita física')
    return `Para la cita con ${contactName}, lleva agenda: 1) situación actual, 2) propuesta, 3) próximos pasos.`
  if (type === 'Llamada')
    return `En la llamada con ${contactName}, evita solo "dar seguimiento". Define una acción concreta como resultado.`
  return 'Mejora: termina esta tarea con un resultado medible. Ejemplo: "Confirmar compra de X unidades para [fecha]."'
}

interface CreateTaskFormProps {
  onSubmit: (input: CreateTaskInput) => void
  onClose: () => void
  isLoading?: boolean
  error?: unknown
}

export function CreateTaskForm({ onSubmit, onClose, isLoading = false, error }: CreateTaskFormProps) {
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(error)

  const [aiTips, setAiTips] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState('Llamada')
  const [contactId, setContactId] = useState('')
  const [objective, setObjective] = useState('')
  const [date, setDate] = useState(todayISO)
  const [time, setTime] = useState('09:00')

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId])
  const contacts = selectedClient?.contacts ?? []
  const selectedContact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId])

  const showOutlookReminder = OUTLOOK_TYPES.has(type)
  const aiComment = useMemo(
    () => getAiComment(type, objective, selectedContact?.name ?? '[contacto]'),
    [type, objective, selectedContact],
  )

  async function fetchAiSuggestions() {
    setAiLoading(true)
    try {
      const res = await coachingApi.getSuggestion({
        type,
        objective: objective || undefined,
        client: selectedClient?.name,
        contactName: selectedContact?.name,
      })
      setAiTips(res.tips)
    } catch {
      setAiTips([])
    } finally {
      setAiLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!objective.trim()) return
    const scheduledAt = new Date(`${date}T${time}`).toISOString()
    onSubmit({
      clientId: clientId || undefined,
      type,
      contactId: contactId || undefined,
      title: objective.trim(),
      scheduledAt,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-blur">
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 640, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="flex items-start justify-between mb-1">
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Crear tarea con objetivo</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, fontFamily: 'inherit' }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>
          El comercial debe escribir qué hará, con quién y para qué.
        </p>

        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <FormErrorSummary error={errorSummary} />

          {/* cliente */}
          <div>
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setContactId(''); clearField('clientId') }}
              className={fieldErrors.clientId ? 'input input-error' : 'input'}
              {...fieldErrorProps('clientId', fieldErrors.clientId)}
            >
              <option value="">Sin cliente / prospecto nuevo</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FieldError name="clientId" message={fieldErrors.clientId} />
          </div>

          {/* tipo | contacto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); clearField('type') }}
                className={fieldErrors.type ? 'input input-error' : 'input'}
                {...fieldErrorProps('type', fieldErrors.type)}
              >
                {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <FieldError name="type" message={fieldErrors.type} />
            </div>
            <div>
              <select
                value={contactId}
                onChange={(e) => { setContactId(e.target.value); clearField('contactId') }}
                className={fieldErrors.contactId ? 'input input-error' : 'input'}
                disabled={!selectedClient}
                {...fieldErrorProps('contactId', fieldErrors.contactId)}
              >
                <option value="">
                  {selectedClient ? 'Selecciona un contacto' : 'Selecciona primero una empresa'}
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.role ? ` · ${c.role}` : ''}
                  </option>
                ))}
              </select>
              <FieldError name="contactId" message={fieldErrors.contactId} />
            </div>
          </div>

          {/* objetivo */}
          <div>
            <textarea
              value={objective}
              onChange={(e) => { setObjective(e.target.value); clearField('title') }}
              required
              maxLength={200}
              style={{ height: 110 }}
              placeholder="¿Qué vas a hacer y para qué? Ej. Llamaré a Gerardo para validar si realizará la compra este mes..."
              className={`input resize-none${fieldErrors.title ? ' input-error' : ''}`}
              {...fieldErrorProps('title', fieldErrors.title)}
            />
            <FieldError name="title" message={fieldErrors.title} />
          </div>

          {/* fecha | hora */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); clearField('scheduledAt') }}
                required
                className={fieldErrors.scheduledAt ? 'input input-error' : 'input'}
                {...fieldErrorProps('scheduledAt', fieldErrors.scheduledAt)}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); clearField('scheduledAt') }}
                required
                className={fieldErrors.scheduledAt ? 'input input-error' : 'input'}
              />
            </div>
            <FieldError name="scheduledAt" message={fieldErrors.scheduledAt} />
          </div>

          {/* AI box */}
          <div className="ai-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>Coach IA</span>
              <button
                type="button"
                onClick={fetchAiSuggestions}
                disabled={aiLoading}
                style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: 'none', border: '1px solid #c4b5fd', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}
              >
                {aiLoading ? 'Cargando...' : 'Obtener sugerencias'}
              </button>
            </div>
            {aiTips.length > 0 ? (
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {aiTips.map((tip, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#6d28d9' }}>{tip}</li>
                ))}
              </ul>
            ) : (
              <span style={{ fontSize: 12, color: '#6d28d9' }}>{aiComment}</span>
            )}
          </div>

          {/* outlook reminder */}
          {showOutlookReminder && (
            <div style={{ padding: '11px 13px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
              Recordatorio: si es videoconferencia o cita, regístrala también en Outlook.
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 13px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !objective.trim()}
            className="btn-green"
            style={{ justifyContent: 'center', padding: '10px', fontSize: 13 }}
          >
            {isLoading ? 'Guardando...' : 'Guardar tarea'}
          </button>
        </form>
      </div>
    </div>
  )
}
