import { useState, useMemo } from 'react'
import { useClients } from '../../../clients/application/hooks/useClients'
import type { CreateTaskInput } from '../../domain/tasks.types'

type ActivityType = 'llamada' | 'videoconferencia' | 'reunion' | 'visita'

interface CreateTaskFormProps {
  onSubmit: (input: CreateTaskInput) => void
  onCancel: () => void
  isLoading?: boolean
}

function defaultDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
}

function defaultTime(): string {
  return '09:00'
}

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'llamada', label: 'Llamada' },
  { value: 'videoconferencia', label: 'Videoconferencia' },
  { value: 'reunion', label: 'Reunión presencial' },
  { value: 'visita', label: 'Visita' },
]

function getAiComment(
  objective: string,
  activityType: ActivityType,
  contactName: string,
): string {
  const lower = objective.toLowerCase()
  if (objective.length < 10) {
    return 'La tarea está muy abierta. Escribe: a quién contactarás, para qué y cuál es el resultado esperado.'
  }
  if (lower.includes('compra') || lower.includes('cierre')) {
    return `Buena tarea de cierre. Con ${contactName}: confirma 1) unidades, 2) fecha de compra, 3) presupuesto final.`
  }
  if (lower.includes('propuesta')) {
    return `Antes de enviar propuesta, valida con ${contactName}: dolor principal, presupuesto y timeline de decisión.`
  }
  if (activityType === 'reunion' || activityType === 'videoconferencia') {
    return `Para la cita con ${contactName}, lleva agenda: 1) situación actual, 2) propuesta, 3) próximos pasos.`
  }
  if (activityType === 'llamada') {
    return `En la llamada con ${contactName}, evita solo "dar seguimiento". Define una acción concreta como resultado.`
  }
  return 'Mejora: termina esta tarea con un resultado medible. Ejemplo: "Confirmar compra de X unidades para [fecha]."'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CreateTaskForm({ onSubmit, onCancel, isLoading = false }: CreateTaskFormProps) {
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []

  const [clientId, setClientId] = useState('')
  const [contactId, setContactId] = useState('')
  const [activityType, setActivityType] = useState<ActivityType>('llamada')
  const [objective, setObjective] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState(defaultTime)

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId])
  const contacts = selectedClient?.contacts ?? []
  const selectedContact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId])

  const showOutlookReminder = activityType === 'videoconferencia' || activityType === 'reunion' || activityType === 'visita'

  const aiComment = useMemo(
    () => getAiComment(objective, activityType, selectedContact?.name ?? '[contacto]'),
    [objective, activityType, selectedContact],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!objective.trim()) return
    const scheduledAt = new Date(`${date}T${time}`).toISOString()
    onSubmit({
      clientId: clientId || undefined,
      title: objective.trim(),
      scheduledAt,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--tracker-text)' }}>
          Crear tarea con objetivo
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--tracker-text-secondary)' }}>
          Escribe qué vas a hacer, con quién y para qué.
        </p>
      </div>

      <div>
        <label className="text-tracker-label mb-1 block">Cliente</label>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value)
            setContactId('')
          }}
          className="input"
        >
          <option value="">Sin cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-tracker-label mb-1 block">Tipo de actividad</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="input"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-tracker-label mb-1 block">Contacto</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="input"
            disabled={!selectedClient}
          >
            <option value="">
              {selectedClient ? 'Seleccionar contacto' : 'Primero selecciona cliente'}
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-tracker-label mb-1 block">Objetivo</label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="¿Qué vas a hacer y para qué?"
          className="input resize-none"
          style={{ height: 110 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-tracker-label mb-1 block">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="input"
          />
        </div>
        <div>
          <label className="text-tracker-label mb-1 block">Hora</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="input"
          />
        </div>
      </div>

      <div className="ai-box">
        <span className="mr-1 text-[10px] font-bold uppercase" style={{ color: 'var(--tracker-purple)' }}>
          AI Coach
        </span>
        {aiComment}
      </div>

      {showOutlookReminder && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: '#F5F3FF', color: 'var(--tracker-purple)' }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Se creará recordatorio en Outlook para esta actividad.
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !objective.trim()}
          className="btn-green w-full justify-center py-2.5 text-sm"
        >
          {isLoading ? 'Guardando...' : 'Crear tarea'}
        </button>
      </div>
    </form>
  )
}
