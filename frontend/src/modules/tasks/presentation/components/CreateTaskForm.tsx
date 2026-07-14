import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CreateTaskInput } from '../../domain/tasks.types'
import type { Client } from '../../../clients/domain/clients.types'
import { coachingApi } from '../../../coaching/infrastructure/coaching.api'
import { tasksApi } from '../../infrastructure/tasks.api'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError } from '@/shared/components/forms/FieldError'
import { fieldErrorProps } from '@/shared/components/forms/field-error-props'
import { ClientCombobox } from '@/shared/components/forms/ClientCombobox'
import { DatePickerField } from '@/shared/components/forms/DatePickerField'
import { TimePickerField } from '@/shared/components/forms/TimePickerField'
import { useAppStore } from '@/shared/store/app.store'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  initialDate?: Date
}

export function CreateTaskForm({ onSubmit, onClose, isLoading = false, error, initialDate }: CreateTaskFormProps) {
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(error)

  const [aiTips, setAiTips] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [type, setType] = useState('Llamada')
  const [contactId, setContactId] = useState('')
  const [objective, setObjective] = useState('')
  const [date, setDate] = useState(() => {
    if (initialDate) {
      const d = initialDate
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    return todayISO()
  })
  const [time, setTime] = useState('09:00')

  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''

  const { data: dayTasks } = useQuery({
    queryKey: ['tasks-day', sellerId, date],
    queryFn: () => tasksApi.getTodayTasks(sellerId, date),
    enabled: !!sellerId && !!date,
  })

  const scheduledToday = (dayTasks ?? [])
    .filter((t) => t.status !== 'Completado')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  const contacts = useMemo(() => selectedClient?.contacts ?? [], [selectedClient?.contacts])
  const selectedContact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId])

  function formatScheduleTime(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

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
        clientId: clientId || undefined,
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[min(calc(100vw-2rem),780px)] max-w-none max-h-[92vh] overflow-y-auto sm:max-w-none">
        <DialogHeader>
          <DialogTitle>Crear tarea con objetivo</DialogTitle>
          <DialogDescription>
            El comercial debe escribir qué hará, con quién y para qué.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-[11px]">
          <FormErrorSummary error={errorSummary} />

          {/* cliente */}
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
              placeholder="Sin cliente / prospecto nuevo"
              error={!!fieldErrors.clientId}
            />
            <FieldError name="clientId" message={fieldErrors.clientId} />
          </div>

          {/* tipo | contacto */}
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

          {/* objetivo */}
          <div>
            <Textarea
              value={objective}
              onChange={(e) => { setObjective(e.target.value); clearField('title') }}
              required
              placeholder="¿Qué vas a hacer y para qué? Ej. Llamaré a Gerardo para validar si realizará la compra este mes..."
              className="h-[110px] resize-none"
              {...fieldErrorProps('title', fieldErrors.title)}
            />
            <FieldError name="title" message={fieldErrors.title} />
          </div>

          <div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <DatePickerField
                value={date}
                onChange={(v) => { setDate(v); clearField('scheduledAt') }}
                {...fieldErrorProps('scheduledAt', fieldErrors.scheduledAt)}
              />
              <TimePickerField
                value={time}
                onChange={(v) => { setTime(v); clearField('scheduledAt') }}
                aria-invalid={!!fieldErrors.scheduledAt}
              />
            </div>
            <FieldError name="scheduledAt" message={fieldErrors.scheduledAt} />
          </div>

          <Accordion
            key={`${scheduledToday.length}-${showOutlookReminder}`}
            type="multiple"
            defaultValue={[
              ...(scheduledToday.length > 0 ? ['busy'] : []),
              'coach',
              ...(showOutlookReminder ? ['outlook'] : []),
            ]}
          >
            {scheduledToday.length > 0 && (
              <AccordionItem value="busy">
                <AccordionTrigger>Ocupado ese día ({scheduledToday.length})</AccordionTrigger>
                <AccordionContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {scheduledToday.map((t) => {
                      const clientName = t.clientName ?? null
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: '#0F172A', minWidth: 42 }}>{formatScheduleTime(t.scheduledAt)}</span>
                          {t.type && <Badge variant="gray">{t.type}</Badge>}
                          {clientName && <span style={{ color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</span>}
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="coach">
              <AccordionTrigger>Coach IA</AccordionTrigger>
              <AccordionContent>
                <div className="ai-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>Sugerencias IA</span>
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
              </AccordionContent>
            </AccordionItem>

            {showOutlookReminder && (
              <AccordionItem value="outlook">
                <AccordionTrigger>Recordatorio Outlook</AccordionTrigger>
                <AccordionContent>
                  <div style={{ padding: '11px 13px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
                    Recordatorio: si es videoconferencia o cita, regístrala también en Outlook.
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <Button
            type="submit"
            disabled={isLoading || !objective.trim()}
            variant="success"
            size="lg"
            className="justify-center"
          >
            {isLoading ? 'Guardando...' : 'Guardar tarea'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
