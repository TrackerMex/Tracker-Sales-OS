import { useState, useMemo } from 'react'
import { useClients } from '../../../clients/application/hooks/useClients'
import type { CreateTaskInput } from '../../domain/tasks.types'

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
}

export function CreateTaskForm({ onSubmit, onClose, isLoading = false }: CreateTaskFormProps) {
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {/* cliente */}
          <select
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setContactId('') }}
            className="input"
          >
            <option value="">Sin cliente / prospecto nuevo</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* tipo | contacto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="input"
              disabled={!selectedClient}
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
          </div>

          {/* objetivo */}
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            required
            maxLength={500}
            style={{ height: 110 }}
            placeholder="¿Qué vas a hacer y para qué? Ej. Llamaré a Gerardo para validar si realizará la compra este mes..."
            className="input resize-none"
          />

          {/* fecha | hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="input" />
          </div>

          {/* AI box */}
          <div className="ai-box">{aiComment}</div>

          {/* outlook reminder */}
          {showOutlookReminder && (
            <div style={{ padding: '11px 13px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
              Recordatorio: si es videoconferencia o cita, regístrala también en Outlook.
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
