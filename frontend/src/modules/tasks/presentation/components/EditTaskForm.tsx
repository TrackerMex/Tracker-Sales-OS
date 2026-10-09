import { useState } from "react"
import type { Task, UpdateTaskInput } from "../../domain/tasks.types"
import type { Client } from "../../../clients/domain/clients.types"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { ClientCombobox } from "@/shared/components/forms/ClientCombobox"
import { DatePickerField } from "@/shared/components/forms/DatePickerField"
import { TimePickerField } from "@/shared/components/forms/TimePickerField"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

function toDateInput(iso: string): string {
  return iso.slice(0, 10)
}

function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EditTaskFormProps {
  task: Task
  onSubmit: (input: UpdateTaskInput) => void
  onClose: () => void
  isLoading?: boolean
  error?: unknown
}

export function EditTaskForm({
  task,
  onSubmit,
  onClose,
  isLoading = false,
  error,
}: EditTaskFormProps) {
  const {
    summary: errorSummary,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(error)

  const [clientId, setClientId] = useState(task.clientId ?? "")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [type, setType] = useState(task.type ?? "Llamada")
  const [contactId, setContactId] = useState(task.contactId ?? "")
  const [objective, setObjective] = useState(task.title)
  const [date, setDate] = useState(toDateInput(task.scheduledAt))
  const [time, setTime] = useState(toTimeInput(task.scheduledAt))
  const [description, setDescription] = useState(task.description ?? "")

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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto bg-background p-0 sm:max-w-5xl">
        <DialogHeader className="border-b p-4 md:p-6">
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>Modifica los datos de la tarea.</DialogDescription>
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
                <div>
                  <Label htmlFor="edit-task-client">Cliente</Label>
                  <div className="mt-2">
                    <ClientCombobox
                      id="edit-task-client"
                      value={clientId}
                      onSelect={(client) => {
                        const changed = (client?.id ?? "") !== clientId
                        setClientId(client?.id ?? "")
                        setSelectedClient(client)
                        if (changed) setContactId("")
                        clearField("clientId")
                      }}
                      onResolve={(client) => setSelectedClient(client)}
                      initialLabel={task.clientName}
                      placeholder="Sin cliente / prospecto nuevo"
                      error={!!fieldErrors.clientId}
                    />
                  </div>
                  <FieldError name="clientId" message={fieldErrors.clientId} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-task-type">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        setType(v)
                        clearField("type")
                      }}
                    >
                      <SelectTrigger
                        id="edit-task-type"
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
                    <Label htmlFor="edit-task-contact">Contacto</Label>
                    <Select
                      value={contactId}
                      onValueChange={(v) => {
                        setContactId(v === "__none__" ? "" : v)
                        clearField("contactId")
                      }}
                      disabled={!selectedClient}
                    >
                      <SelectTrigger
                        id="edit-task-contact"
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
                  <Label htmlFor="edit-task-objective">Objetivo</Label>
                  <Textarea
                    id="edit-task-objective"
                    value={objective}
                    onChange={(e) => {
                      setObjective(e.target.value)
                      clearField("title")
                    }}
                    required
                    placeholder="¿Qué vas a hacer y para qué?"
                    className="mt-2 h-28 resize-none"
                    {...fieldErrorProps("title", fieldErrors.title)}
                  />
                  <FieldError name="title" message={fieldErrors.title} />
                </div>

                <div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label>Fecha</Label>
                      <div className="mt-2">
                        <DatePickerField
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
                      <Label>Hora</Label>
                      <TimePickerField
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
              <h5 className="text-base font-semibold">Resultado</h5>
              <div className="mt-6 flex flex-col gap-6">
                {task.status === "Completado" ? (
                  <div>
                    <Label>Resultado esperado</Label>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {description || <em>Sin resultado registrado</em>}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="edit-task-description">
                      Resultado esperado
                    </Label>
                    <Textarea
                      id="edit-task-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="¿Cuál es el resultado esperado de esta tarea?"
                      className="mt-2 h-20 resize-none"
                    />
                  </div>
                )}

                {showOutlookReminder && (
                  <Accordion type="single" collapsible defaultValue="outlook">
                    <AccordionItem value="outlook">
                      <AccordionTrigger>Recordatorio Outlook</AccordionTrigger>
                      <AccordionContent>
                        <p className="border bg-muted/30 p-3 text-xs text-foreground">
                          Recordatorio: si es videoconferencia o cita,
                          actualízala también en Outlook.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-end border-t p-4 md:px-6">
            <Button
              type="submit"
              disabled={isLoading || !objective.trim()}
              size="lg"
            >
              {isLoading ? "Guardando..." : "Actualizar tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
