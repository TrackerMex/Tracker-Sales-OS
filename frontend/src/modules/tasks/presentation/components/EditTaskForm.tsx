import { useState } from 'react'
import type { Task, UpdateTaskInput } from '../../domain/tasks.types'
import type { Client } from '../../../clients/domain/clients.types'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError'
import { ClientCombobox } from '@/shared/components/forms/ClientCombobox'
import { DatePickerField } from '@/shared/components/forms/DatePickerField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  'Solicitud de factura/servicio',
  'Junta interna',
  'Prospección',
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
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(error)

  const [clientId, setClientId] = useState(task.clientId ?? '')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [type, setType] = useState(task.type ?? 'Llamada')
  const [contactId, setContactId] = useState(task.contactId ?? '')
  const [objective, setObjective] = useState(task.title)
  const [date, setDate] = useState(toDateInput(task.scheduledAt))
  const [time, setTime] = useState(toTimeInput(task.scheduledAt))
  const [description, setDescription] = useState(task.description ?? '')

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
      description: description.trim() || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[min(calc(100vw-2rem),780px)] max-w-none max-h-[92vh] overflow-y-auto sm:max-w-none">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            Modifica los datos de la tarea.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-[11px]">
          <FormErrorSummary error={errorSummary} />

          <div>
            <ClientCombobox
              value={clientId}
              onSelect={(client) => {
                const changed = (client?.id ?? '') !== clientId
                setClientId(client?.id ?? '')
                setSelectedClient(client)
                if (changed) setContactId('')
                clearField('clientId')
              }}
              onResolve={(client) => setSelectedClient(client)}
              initialLabel={task.clientName}
              placeholder="Sin cliente / prospecto nuevo"
              error={!!fieldErrors.clientId}
            />
            <FieldError name="clientId" message={fieldErrors.clientId} />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <Select
                value={type}
                onValueChange={(v) => { setType(v); clearField('type') }}
              >
                <SelectTrigger {...fieldErrorProps('type', fieldErrors.type)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError name="type" message={fieldErrors.type} />
            </div>
            <div>
              <Select
                value={contactId}
                onValueChange={(v) => { setContactId(v === '__none__' ? '' : v); clearField('contactId') }}
                disabled={!selectedClient}
              >
                <SelectTrigger {...fieldErrorProps('contactId', fieldErrors.contactId)}>
                  <SelectValue
                    placeholder={selectedClient ? 'Selecciona un contacto' : 'Selecciona primero una empresa'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin contacto</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.role ? ` · ${c.role}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="contactId" message={fieldErrors.contactId} />
            </div>
          </div>

          <div>
            <Textarea
              value={objective}
              onChange={(e) => { setObjective(e.target.value); clearField('title') }}
              required
              placeholder="¿Qué vas a hacer y para qué?"
              className="h-[110px] resize-none"
              {...fieldErrorProps('title', fieldErrors.title)}
            />
            <FieldError name="title" message={fieldErrors.title} />
          </div>

          <div>
            {task.status === 'Completado' ? (
              <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#64748B' }}>
                <span style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>Resultado esperado</span>
                {description || <em style={{ color: '#94A3B8' }}>Sin resultado registrado</em>}
              </div>
            ) : (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Cuál es el resultado esperado de esta tarea?"
                className="h-[72px] resize-none"
              />
            )}
          </div>

          <div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <DatePickerField
                value={date}
                onChange={(v) => { setDate(v); clearField('scheduledAt') }}
                {...fieldErrorProps('scheduledAt', fieldErrors.scheduledAt)}
              />
              <Input
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); clearField('scheduledAt') }}
                required
                aria-invalid={!!fieldErrors.scheduledAt}
              />
            </div>
            <FieldError name="scheduledAt" message={fieldErrors.scheduledAt} />
          </div>

          {showOutlookReminder && (
            <div style={{ padding: '11px 13px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
              Recordatorio: si es videoconferencia o cita, actualízala también en Outlook.
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !objective.trim()}
            variant="success"
            size="lg"
            className="justify-center"
          >
            {isLoading ? 'Guardando...' : 'Actualizar tarea'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
