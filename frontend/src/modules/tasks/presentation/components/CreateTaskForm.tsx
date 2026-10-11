import { useState, useMemo } from "react"
import type { CreateTaskInput } from "../../domain/tasks.types"
import type { Client } from "../../../clients/domain/clients.types"
import { useCoachingSuggestion } from "../../../coaching/application/hooks/useCoachingSuggestion"
import { useTodayTasks } from "../../application/hooks/useTodayTasks"
import { useSellers } from "../../../equipo/application/hooks/useSellers"
import { UserRole } from "@/core/domain/types/common.types"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { ClientCombobox } from "@/shared/components/forms/ClientCombobox"
import { DatePickerField } from "@/shared/components/forms/DatePickerField"
import { TimePickerField } from "@/shared/components/forms/TimePickerField"
import { useAppStore } from "@/shared/store/app.store"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TASK_TYPES = [
  "Chat",
  "WhatsApp",
  "Correo",
  "Llamada",
  "Videoconferencia",
  "Reunión virtual",
  "Visita física",
  "Reunión presencial",
  "Propuesta",
  "Seguimiento",
  "Cierre",
  "Solicitud de factura/servicio",
  "Junta interna",
  "Prospección",
]

const OUTLOOK_TYPES = new Set([
  "Videoconferencia",
  "Reunión virtual",
  "Visita física",
  "Reunión presencial",
])

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getAiComment(
  type: string,
  objective: string,
  contactName: string
): string {
  const lower = objective.toLowerCase()
  if (objective.length < 10)
    return "Escribe el objetivo de la tarea y te daré una sugerencia antes de guardar."
  if (lower.includes("compra") || lower.includes("cierre"))
    return `Buena tarea de cierre. Con ${contactName}: confirma 1) unidades, 2) fecha de compra, 3) presupuesto final.`
  if (lower.includes("propuesta") || type === "Propuesta")
    return `Antes de enviar propuesta, valida con ${contactName}: dolor principal, presupuesto y timeline de decisión.`
  if (
    type === "Reunión presencial" ||
    type === "Reunión virtual" ||
    type === "Videoconferencia" ||
    type === "Visita física"
  )
    return `Para la cita con ${contactName}, lleva agenda: 1) situación actual, 2) propuesta, 3) próximos pasos.`
  if (type === "Llamada")
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

export function CreateTaskForm({
  onSubmit,
  onClose,
  isLoading = false,
  error,
  initialDate,
}: CreateTaskFormProps) {
  const {
    summary: errorSummary,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(error)

  const [aiTips, setAiTips] = useState<string[]>([])
  const { mutateAsync: getSuggestion, isPending: aiLoading } = useCoachingSuggestion()
  const [clientId, setClientId] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [type, setType] = useState("Llamada")
  const [contactId, setContactId] = useState("")
  const [objective, setObjective] = useState("")
  const [date, setDate] = useState(() => {
    if (initialDate) {
      const d = initialDate
      const pad = (n: number) => String(n).padStart(2, "0")
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    return todayISO()
  })
  const [time, setTime] = useState("09:00")

  const currentUser = useAppStore((s) => s.currentUser)
  const isManager = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director
  const [selectedSellerId, setSelectedSellerId] = useState("")
  const [sellerError, setSellerError] = useState("")
  const { data: sellers = [] } = useSellers()
  const activeSellers = sellers.filter((seller) => seller.active)
  const sellerId = isManager ? selectedSellerId : currentUser?.sellerId ?? ""

  const { data: dayTasks } = useTodayTasks(sellerId || null, date)

  const scheduledToday = (dayTasks ?? [])
    .filter((t) => t.status !== "Completado")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  const contacts = useMemo(
    () => selectedClient?.contacts ?? [],
    [selectedClient?.contacts]
  )
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === contactId),
    [contacts, contactId]
  )

  function formatScheduleTime(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const showOutlookReminder = OUTLOOK_TYPES.has(type)
  const aiComment = useMemo(
    () => getAiComment(type, objective, selectedContact?.name ?? "[contacto]"),
    [type, objective, selectedContact]
  )

  async function fetchAiSuggestions() {
    if (!sellerId) return
    try {
      const res = await getSuggestion({
        sellerId,
        type,
        objective: objective || undefined,
        client: selectedClient?.name,
        contactName: selectedContact?.name,
        clientId: clientId || undefined,
      })
      setAiTips(res.tips)
    } catch {
      setAiTips([])
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sellerId || (isManager && !activeSellers.some((seller) => seller.id === sellerId))) {
      setSellerError("Selecciona un vendedor activo.")
      e.currentTarget.querySelector<HTMLElement>("#task-seller")?.focus()
      return
    }
    setSellerError("")
    if (!objective.trim()) return
    const scheduledAt = new Date(`${date}T${time}`).toISOString()
    onSubmit({
      sellerId,
      clientId: clientId || undefined,
      type,
      contactId: contactId || undefined,
      title: objective.trim(),
      scheduledAt,
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto bg-background p-0 sm:max-w-5xl">
        <DialogHeader className="border-b p-4 md:p-6">
          <DialogTitle>Crear tarea con objetivo</DialogTitle>
          <DialogDescription>
            El comercial debe escribir qué hará, con quién y para qué.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit}>
          {errorSummary && (
            <div className="p-4 pb-0 md:px-6">
              <FormErrorSummary error={errorSummary} />
            </div>
          )}

          <div className="grid gap-px bg-border xl:grid-cols-2">
            <section className="bg-background p-4 md:p-6">
              <h5 className="text-base font-semibold">Tarea</h5>
              <div className="mt-6 flex flex-col gap-6">
                {isManager && (
                  <div>
                    <Label htmlFor="task-seller">Vendedor *</Label>
                    <Select
                      value={selectedSellerId}
                      disabled={isLoading || aiLoading}
                      onValueChange={(owner) => {
                        setSelectedSellerId(owner)
                        setSellerError("")
                        clearField("sellerId")
                        setClientId("")
                        setSelectedClient(null)
                        setContactId("")
                        setAiTips([])
                      }}
                    >
                      <SelectTrigger id="task-seller" className="mt-2 w-full" {...fieldErrorProps("sellerId", sellerError || fieldErrors.sellerId)}>
                        <SelectValue placeholder="Selecciona un vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSellers.map((seller) => <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError name="sellerId" message={sellerError || fieldErrors.sellerId} />
                  </div>
                )}
                <div>
                  <Label htmlFor="task-client">Cliente</Label>
                  <div className="mt-2">
                    <ClientCombobox
                      id="task-client"
                      sellerId={sellerId}
                      disabled={!sellerId || isLoading}
                      value={clientId}
                      onSelect={(client) => {
                        const changed = (client?.id ?? "") !== clientId
                        setClientId(client?.id ?? "")
                        setSelectedClient(client)
                        if (changed) setContactId("")
                        clearField("clientId")
                      }}
                      placeholder="Sin cliente / prospecto nuevo"
                      error={!!fieldErrors.clientId}
                      aria-describedby={fieldErrors.clientId ? "clientId-error" : undefined}
                    />
                  </div>
                  <FieldError name="clientId" message={fieldErrors.clientId} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="task-type">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        setType(v)
                        clearField("type")
                      }}
                    >
                      <SelectTrigger
                        id="task-type"
                        className="mt-2 w-full"
                        {...fieldErrorProps("type", fieldErrors.type)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError name="type" message={fieldErrors.type} />
                  </div>
                  <div>
                    <Label htmlFor="task-contact">Contacto</Label>
                    <Select
                      value={contactId}
                      onValueChange={(v) => {
                        setContactId(v === "__none__" ? "" : v)
                        clearField("contactId")
                      }}
                      disabled={!selectedClient}
                    >
                      <SelectTrigger
                        id="task-contact"
                        className="mt-2 w-full"
                        {...fieldErrorProps("contactId", fieldErrors.contactId)}
                      >
                        <SelectValue
                          placeholder={
                            selectedClient
                              ? "Selecciona un contacto"
                              : "Selecciona primero una empresa"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin contacto</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.role ? ` · ${c.role}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      name="contactId"
                      message={fieldErrors.contactId}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="task-objective">Objetivo</Label>
                  <Textarea
                    id="task-objective"
                    value={objective}
                    onChange={(e) => {
                      setObjective(e.target.value)
                      clearField("title")
                    }}
                    required
                    placeholder="¿Qué vas a hacer y para qué? Ej. Llamaré a Gerardo para validar si realizará la compra este mes..."
                    className="mt-2 h-28 resize-none"
                    {...fieldErrorProps("title", fieldErrors.title)}
                  />
                  <FieldError name="title" message={fieldErrors.title} />
                </div>

                <div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="task-date" id="task-date-label">Fecha</Label>
                      <div className="mt-2">
                        <DatePickerField
                          id="task-date"
                          value={date}
                          onChange={(v) => {
                            setDate(v)
                            clearField("scheduledAt")
                          }}
                          {...fieldErrorProps(
                            "scheduledAt",
                            fieldErrors.scheduledAt
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="task-time" id="task-time-label">Hora</Label>
                      <TimePickerField
                        id="task-time"
                        value={time}
                        onChange={(v) => {
                          setTime(v)
                          clearField("scheduledAt")
                        }}
                        aria-invalid={!!fieldErrors.scheduledAt}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <FieldError
                    name="scheduledAt"
                    message={fieldErrors.scheduledAt}
                  />
                </div>
              </div>
            </section>

            <section className="bg-background p-4 md:p-6">
              <h5 className="text-base font-semibold">Apoyo</h5>
              <Accordion
                key={`${scheduledToday.length}-${showOutlookReminder}`}
                type="multiple"
                className="mt-2"
                defaultValue={[
                  ...(scheduledToday.length > 0 ? ["busy"] : []),
                  "coach",
                  ...(showOutlookReminder ? ["outlook"] : []),
                ]}
              >
                {scheduledToday.length > 0 && (
                  <AccordionItem value="busy">
                    <AccordionTrigger>
                      Ocupado ese día ({scheduledToday.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1">
                        {scheduledToday.map((t) => {
                          const clientName = t.clientName ?? null
                          return (
                            <div
                              key={t.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="min-w-10 font-medium text-foreground tabular-nums">
                                {formatScheduleTime(t.scheduledAt)}
                              </span>
                              {t.type && (
                                <Badge variant="outline">{t.type}</Badge>
                              )}
                              {clientName && (
                                <span className="truncate text-muted-foreground">
                                  {clientName}
                                </span>
                              )}
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
                    <div className="border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          Sugerencias IA
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={fetchAiSuggestions}
                          disabled={aiLoading || !sellerId}
                        >
                          {aiLoading ? "Cargando..." : "Obtener sugerencias"}
                        </Button>
                      </div>
                      {aiTips.length > 0 ? (
                        <ul className="flex flex-col gap-1 pl-4">
                          {aiTips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{aiComment}</span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {showOutlookReminder && (
                  <AccordionItem value="outlook">
                    <AccordionTrigger>Recordatorio Outlook</AccordionTrigger>
                    <AccordionContent>
                      <p className="border bg-muted/30 p-3 text-xs text-foreground">
                        Recordatorio: si es videoconferencia o cita, regístrala
                        también en Outlook.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </section>
          </div>

          <div className="flex justify-end border-t p-4 md:px-6">
            <Button
              type="submit"
              disabled={isLoading || !objective.trim()}
              size="lg"
            >
              {isLoading ? "Guardando..." : "Guardar tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
