import { useState, useMemo } from 'react'
import { useClients } from '../../../clients/application/hooks/useClients'
import type { Task, UpdateTaskInput } from '../../domain/tasks.types'
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

function toDateInput(iso: string): string {
  return iso.slice(0, 10)
}

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EditTaskFormProps {
  task: Task
  onSubmit: (input: UpdateTaskInput) => void
  onClose: () => void
  isLoading?: boolean
  error?: unknown
}

export function EditTaskForm({ task, onSubmit, onClose, isLoading = false, error }: EditTaskFormProps) {
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = clientsData?.data ?? []
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(error)

  const [clientId, setClientId] = useState(task.clientId ?? '')
  const [type, setType] = useState(task.type ?? 'Llamada')
  const [contactId, setContactId] = useState(task.contactId ?? '')
  const [objective, setObjective] = useState(task.title)
  const [date, setDate] = useState(toDateInput(task.scheduledAt))
  const [time, setTime] = useState(toTimeInput(task.scheduledAt))

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId])
  const contacts = selectedClient?.contacts ?? []
  const showOutlookReminder = OUTLOOK_TYPES.has(type)

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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Editar tarea</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1, fontFamily: 'inherit' }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>
          Modifica los datos de la tarea.
        </p>

        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <FormErrorSummary error={errorSummary} />

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

          <div>
            <textarea
              value={objective}
              onChange={(e) => { setObjective(e.target.value); clearField('title') }}
              required
              style={{ height: 110 }}
              placeholder="¿Qué vas a hacer y para qué?"
              className={`input resize-none${fieldErrors.title ? ' input-error' : ''}`}
              {...fieldErrorProps('title', fieldErrors.title)}
            />
            <FieldError name="title" message={fieldErrors.title} />
          </div>

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

          {showOutlookReminder && (
            <div style={{ padding: '11px 13px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
              Recordatorio: si es videoconferencia o cita, actualízala también en Outlook.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !objective.trim()}
            className="btn-green"
            style={{ justifyContent: 'center', padding: '10px', fontSize: 13 }}
          >
            {isLoading ? 'Guardando...' : 'Actualizar tarea'}
          </button>
        </form>
      </div>
    </div>
  )
}
