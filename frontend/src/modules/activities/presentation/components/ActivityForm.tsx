import { useState, useEffect } from "react"
import {
  ACTIVITY_TYPES,
  TASK_POINTS,
  REQUIRES_NEXT_STEP,
  PIPELINE_STAGES,
  NON_COMMERCIAL_TYPES,
} from "@/shared/lib/constants"
import type { ActivityType, PipelineStage } from "@/shared/lib/constants"
import type {
  ActivityResult,
  CreateActivityInput,
} from "../../domain/activities.types"
import type { Client } from "@/modules/clients/domain/clients.types"
import { useAppStore } from "@/shared/store/app.store"
import { useCoachingSuggestion } from "@/modules/coaching/application/hooks/useCoachingSuggestion"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { UserRole } from "@/core/domain/types/common.types"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { STATUS_FILL_CLASS, type StatusTone } from "@/shared/lib/status"
import { cn } from "@/lib/utils"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { ClientCombobox } from "@/shared/components/forms/ClientCombobox"
import { DatePickerField } from "@/shared/components/forms/DatePickerField"
import { TimePickerField } from "@/shared/components/forms/TimePickerField"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTodayTasks } from "@/modules/tasks/application/hooks/useTodayTasks"
import { useClientDeals } from "@/modules/pipeline/application/hooks/useClientDeals"
import { usePipeline } from "@/modules/pipeline/application/hooks/usePipeline"

const ACTIVITY_RESULTS: ActivityResult[] = [
  "Interesado",
  "No contestó",
  "Solicita propuesta",
  "Solicita reunión",
  "Negociación",
  "Cierre ganado",
  "Cierre perdido",
  "Información enviada",
]

function calcQuality(data: {
  summary: string
  discovery: string
  agreement: string
  nextStep: string
  nextDate: string
  nextTime: string
}): number {
  let score = 0
  if (data.summary.length > 20) score += 20
  if (data.discovery.length > 15) score += 20
  if (data.agreement.length > 15) score += 20
  if (data.nextStep.length > 8) score += 20
  if (data.nextDate && data.nextTime) score += 20
  return score
}

interface Props {
  onSubmit: (data: CreateActivityInput) => void
  isLoading: boolean
  programmedTask?: string
  submitError?: unknown
  initialClientId?: string
  initialClientLabel?: string
  taskId?: string
  initialSellerId?: string
  onSellerChange?: (sellerId: string) => void
}

export function ActivityForm({
  onSubmit,
  isLoading,
  programmedTask,
  submitError,
  initialClientId,
  initialClientLabel,
  taskId,
  initialSellerId,
  onSellerChange,
}: Props) {
  const {
    summary: errorSummary,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(submitError)
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const currentUser = useAppStore((s) => s.currentUser)
  const isManager = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director
  const [selectedSellerId, setSelectedSellerId] = useState(initialSellerId ?? "")
  const [sellerError, setSellerError] = useState("")
  const { data: sellers = [] } = useSellers()
  const activeSellers = sellers.filter((seller) => seller.active)
  const sellerId = isManager ? selectedSellerId : currentUser?.sellerId ?? ""

  // form state
  const [aiTips, setAiTips] = useState<string[]>([])
  const { mutateAsync: getSuggestion, isPending: aiLoading } = useCoachingSuggestion()
  const [clientId, setClientId] = useState(initialClientId ?? "")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [contactId, setContactId] = useState("")
  const [type, setType] = useState<ActivityType>(ACTIVITY_TYPES[0])
  const [result, setResult] = useState<ActivityResult>(ACTIVITY_RESULTS[0])
  const [stage, setStage] = useState("")
  const [summary, setSummary] = useState("")
  const [discovery, setDiscovery] = useState("")
  const [agreement, setAgreement] = useState("")
  const [nextStep, setNextStep] = useState("")
  const [nextObjective, setNextObjective] = useState("")
  const [nextDate, setNextDate] = useState("")
  const [nextTime, setNextTime] = useState("")
  const [executedAt, setExecutedAt] = useState(localNow)
  const [programmedAt, setProgrammedAt] = useState(localNow)
  const [internalTaskId, setInternalTaskId] = useState(taskId ?? "")
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("")
  const [newOpportunityName, setNewOpportunityName] = useState("")

  // UI expand/collapse state
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [showAiCoach, setShowAiCoach] = useState(false)
  const [clientError, setClientError] = useState("")

  const { data: pipelineGrouped } = usePipeline(sellerId || null)
  const { data: todayTasks } = useTodayTasks(sellerId || null)
  const pendingTasks = (todayTasks ?? []).filter(
    (t) => t.status === "Pendiente"
  )
  const { data: clientDeals } = useClientDeals(
    clientId || null,
    sellerId || null
  )
  const isNewOpportunity = selectedOpportunityId === "__new__"
  const selectedDeal =
    clientDeals?.find((d) => d.id === selectedOpportunityId) ?? null

  const currentDeal =
    pipelineGrouped && clientId
      ? (Object.values(pipelineGrouped)
          .flat()
          .find((d) => d.clientId === clientId) ?? null)
      : null

  const contacts = selectedClient?.contacts ?? []
  const needsNextStep = REQUIRES_NEXT_STEP.includes(type)
  const isNonCommercial = NON_COMMERCIAL_TYPES.includes(type)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (currentDeal?.stage && !isNonCommercial) {
        setStage(currentDeal.stage)
      } else if (!currentDeal) {
        setStage("")
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [currentDeal, isNonCommercial])

  const quality = calcQuality({
    summary,
    discovery,
    agreement,
    nextStep,
    nextDate,
    nextTime,
  })
  const qualityTone: StatusTone =
    quality >= 80 ? "success" : quality >= 40 ? "pending" : "danger"

  function getCoachMessage(): string {
    if (needsNextStep) {
      if (
        [
          "Videoconferencia",
          "Reunión virtual",
          "Visita física",
          "Reunión presencial",
        ].includes(type)
      ) {
        return "Esta actividad requiere siguiente paso, fecha y hora. Recuerda registrar o validar la cita en Outlook."
      }
      return "Esta actividad requiere siguiente paso, fecha y hora."
    }
    return `Suma ${TASK_POINTS[type]} punto(s). ${needsNextStep ? "" : "No requiere siguiente paso obligatorio."}`
  }

  async function fetchAiSuggestions() {
    if (!sellerId) return
    try {
      const res = await getSuggestion({
        sellerId,
        type,
        objective: summary || undefined,
        client: selectedClient?.name,
        dealStage: stage || undefined,
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
      e.currentTarget.querySelector<HTMLElement>("#activity-seller")?.focus()
      return
    }
    setSellerError("")
    if (!isNonCommercial && !clientId) {
      setClientError("Selecciona un cliente para actividades comerciales.")
      return
    }
    setClientError("")
    const input: CreateActivityInput = {
      sellerId,
      ...(clientId ? { clientId } : {}),
      type,
      result,
      summary,
      executedAt: new Date(executedAt).toISOString(),
    }
    if (contactId) input.contactId = contactId
    if (discovery) input.discovery = discovery
    if (agreement) input.agreement = agreement
    if (nextStep) input.nextStep = nextStep
    if (nextObjective) input.nextObjective = nextObjective
    if (nextDate) input.nextDate = nextDate
    if (nextTime) input.nextTime = nextTime
    if (stage) input.stage = stage as PipelineStage
    if (internalTaskId) input.taskId = internalTaskId
    if (programmedAt) input.programmedAt = new Date(programmedAt).toISOString()
    const resolvedOpportunity = isNewOpportunity
      ? newOpportunityName.trim()
      : (selectedDeal?.opportunityName ?? undefined)
    if (resolvedOpportunity) input.opportunityName = resolvedOpportunity
    onSubmit(input)
  }

  const execDate = executedAt.split("T")[0]
  const execTime = executedAt.includes("T") ? executedAt.split("T")[1] : ""

  function handleExecDateChange(value: string) {
    clearField("executedAt")
    setExecutedAt(`${value}T${execTime || "00:00"}`)
  }

  function handleExecTimeChange(value: string) {
    clearField("executedAt")
    setExecutedAt(
      `${execDate || new Date().toISOString().split("T")[0]}T${value}`
    )
  }

  const progDate = programmedAt.split("T")[0]
  const progTime = programmedAt.includes("T") ? programmedAt.split("T")[1] : ""

  function handleProgDateChange(value: string) {
    setProgrammedAt(`${value}T${progTime || "00:00"}`)
  }

  function handleProgTimeChange(value: string) {
    setProgrammedAt(
      `${progDate || new Date().toISOString().split("T")[0]}T${value}`
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-background">
      <div className="border-b p-4 md:p-6">
        <h2 className="text-base font-semibold">
          Registrar actividad comercial
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Llamadas, videoconferencias, visitas y propuestas requieren siguiente
          paso.
        </p>
      </div>

      {errorSummary && (
        <div className="p-4 pb-0 md:px-6">
          <FormErrorSummary error={errorSummary} />
        </div>
      )}

      <div className="grid gap-px bg-border xl:grid-cols-2">
        {/* Sección 1 — Contexto */}
        <section className="bg-background p-4 md:p-6">
          <h5 className="text-base font-semibold">Contexto</h5>
          <div className="mt-6 flex flex-col gap-6">
            {isManager && (
              <div>
                <Label htmlFor="activity-seller">Vendedor *</Label>
                <Select
                  value={selectedSellerId}
                  disabled={!!taskId || isLoading || aiLoading}
                  onValueChange={(owner) => {
                    setSelectedSellerId(owner)
                    onSellerChange?.(owner)
                    setSellerError("")
                    clearField("sellerId")
                    setClientId("")
                    setSelectedClient(null)
                    setContactId("")
                    setInternalTaskId("")
                    setSelectedOpportunityId("")
                    setNewOpportunityName("")
                    setStage("")
                    setAiTips([])
                    setClientError("")
                  }}
                >
                  <SelectTrigger id="activity-seller" className="mt-2 w-full" {...fieldErrorProps("sellerId", sellerError || fieldErrors.sellerId)}>
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
              <Label htmlFor="clientId">Cliente *</Label>
              <div className="mt-2">
                <ClientCombobox
                  id="clientId"
                  sellerId={sellerId}
                  disabled={!sellerId || isLoading}
                  value={clientId}
                  onSelect={(client) => {
                    const changed = (client?.id ?? "") !== clientId
                    setClientId(client?.id ?? "")
                    setSelectedClient(client)
                    if (changed) {
                      setContactId("")
                      setSelectedOpportunityId("")
                      setNewOpportunityName("")
                    }
                    setClientError("")
                    clearField("clientId")
                  }}
                  onResolve={(client) => setSelectedClient(client)}
                  initialLabel={initialClientLabel}
                  placeholder="Sin cliente"
                  error={!!(clientError || fieldErrors.clientId)}
                  aria-describedby={
                    clientError || fieldErrors.clientId ? "clientId-error" : undefined
                  }
                />
              </div>
              <FieldError
                name="clientId"
                message={clientError || fieldErrors.clientId}
              />
            </div>

            <div>
              <Label htmlFor="activity-contact">Contacto</Label>
              <Select
                value={contactId}
                onValueChange={(v) => {
                  setContactId(v === "__none__" ? "" : v)
                  clearField("contactId")
                }}
                disabled={!clientId || contacts.length === 0}
              >
                <SelectTrigger
                  id="activity-contact"
                  className="mt-2 w-full"
                  {...fieldErrorProps("contactId", fieldErrors.contactId)}
                >
                  <SelectValue
                    placeholder={
                      !clientId
                        ? "Selecciona un cliente primero"
                        : contacts.length === 0
                          ? "Sin contactos"
                          : "Seleccionar contacto..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin contacto</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.role}
                      {c.isDecisionMaker ? " (Decisor)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="contactId" message={fieldErrors.contactId} />
            </div>

            {/* Oportunidad (solo si hay cliente y no es no-comercial) */}
            {clientId && !isNonCommercial && (
              <div>
                <Label htmlFor="activity-opportunity">
                  Oportunidad / Proyecto
                </Label>
                <Select
                  value={selectedOpportunityId}
                  onValueChange={(v) => {
                    const next = v === "__none__" ? "" : v
                    setSelectedOpportunityId(next)
                    const deal = clientDeals?.find((d) => d.id === next)
                    if (deal && !stage) setStage(deal.stage)
                  }}
                >
                  <SelectTrigger id="activity-opportunity" className="mt-2 w-full">
                    <SelectValue placeholder="Sin oportunidad vinculada (deal principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      Sin oportunidad vinculada (deal principal)
                    </SelectItem>
                    {(clientDeals ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.opportunityName ?? "Oportunidad principal"} —{" "}
                        {d.stage}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      + Nueva oportunidad...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isNewOpportunity && (
                  <Input
                    type="text"
                    className="mt-2"
                    aria-label="Nombre de la nueva oportunidad"
                    placeholder="Nombre de la nueva oportunidad (ej. Flotilla GPS, Proyecto Cámaras)"
                    value={newOpportunityName}
                    onChange={(e) => setNewOpportunityName(e.target.value)}
                    maxLength={200}
                  />
                )}
              </div>
            )}

            <div>
              <Label htmlFor="activity-stage">Etapa del pipeline</Label>
              {currentDeal && !isNonCommercial && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Actual:{" "}
                  <strong className="font-medium text-foreground">
                    {currentDeal.stage}
                  </strong>
                </p>
              )}
              <Select
                value={stage}
                onValueChange={(v) => setStage(v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="activity-stage" className="mt-2 w-full">
                  <SelectValue placeholder="Sin cambio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cambio</SelectItem>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-task">Tarea vinculada</Label>
              {programmedTask ? (
                <Input
                  id="activity-task"
                  type="text"
                  value={programmedTask}
                  readOnly
                  className="mt-2 bg-muted/50 text-muted-foreground"
                />
              ) : (
                <Select
                  value={internalTaskId}
                  onValueChange={(v) => {
                    const next = v === "__none__" ? "" : v
                    const task = pendingTasks.find((t) => t.id === next)
                    setInternalTaskId(next)
                    if (task?.scheduledAt) {
                      setProgrammedAt(task.scheduledAt.slice(0, 16))
                    }
                  }}
                >
                  <SelectTrigger id="activity-task" className="mt-2 w-full">
                    <SelectValue placeholder="Sin tarea vinculada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      Sin tarea vinculada
                    </SelectItem>
                    {pendingTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </section>

        {/* Sección 2 — Actividad */}
        <section className="bg-background p-4 md:p-6">
          <h5 className="text-base font-semibold">Actividad</h5>
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="activity-type">Tipo de actividad</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    const t = v as ActivityType
                    setType(t)
                    if (NON_COMMERCIAL_TYPES.includes(t)) setClientError("")
                    clearField("type")
                  }}
                >
                  <SelectTrigger
                    id="activity-type"
                    className="mt-2 w-full"
                    {...fieldErrorProps("type", fieldErrors.type)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t} · {TASK_POINTS[t]}pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="type" message={fieldErrors.type} />
              </div>

              <div>
                <Label htmlFor="activity-result">Resultado</Label>
                <Select
                  value={result}
                  onValueChange={(v) => {
                    setResult(v as ActivityResult)
                    clearField("result")
                  }}
                >
                  <SelectTrigger
                    id="activity-result"
                    className="mt-2 w-full"
                    {...fieldErrorProps("result", fieldErrors.result)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="result" message={fieldErrors.result} />
              </div>
            </div>

            <div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="activity-exec-date" id="activity-exec-date-label">Fecha de ejecución</Label>
                  <div className="mt-2">
                    <DatePickerField
                      id="activity-exec-date"
                      value={execDate}
                      onChange={handleExecDateChange}
                      {...fieldErrorProps("executedAt", fieldErrors.executedAt)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="activity-exec-time" id="activity-exec-time-label">Hora</Label>
                  <TimePickerField
                    id="activity-exec-time"
                    value={execTime}
                    onChange={handleExecTimeChange}
                    aria-invalid={!!fieldErrors.executedAt}
                    className="mt-2"
                  />
                </div>
              </div>
              <FieldError name="executedAt" message={fieldErrors.executedAt} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="activity-capture-date" id="activity-capture-date-label">Fecha de captura</Label>
                <div className="mt-2">
                  <DatePickerField
                    id="activity-capture-date"
                    value={progDate}
                    onChange={handleProgDateChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="activity-capture-time" id="activity-capture-time-label">Hora de captura</Label>
                <TimePickerField
                  id="activity-capture-time"
                  value={progTime}
                  onChange={handleProgTimeChange}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección 3 — ¿Qué pasó? (siempre visible) */}
        <section className="bg-background p-4 md:p-6 xl:col-span-2">
          <h5 className="text-base font-semibold">Resumen</h5>
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <Label htmlFor="activity-summary">¿Qué pasó? *</Label>
              <Textarea
                id="activity-summary"
                className="mt-2 h-24"
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value)
                  clearField("summary")
                }}
                required
                {...fieldErrorProps("summary", fieldErrors.summary)}
              />
              <FieldError name="summary" message={fieldErrors.summary} />
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className={cn(
                    "h-full w-full origin-left rounded-full transition-transform duration-400 motion-reduce:transition-none",
                    STATUS_FILL_CLASS[qualityTone]
                  )}
                  style={{ transform: `scaleX(${quality / 100})` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Calidad estimada:{" "}
                <span className="font-semibold text-foreground">
                  {quality}%
                </span>
              </p>
            </div>

            {!showDiscovery ? (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto w-fit p-0"
                onClick={() => setShowDiscovery(true)}
              >
                + Agregar descubrimiento
              </Button>
            ) : (
              <div>
                <Label htmlFor="activity-discovery">¿Qué descubrí?</Label>
                <Textarea
                  id="activity-discovery"
                  className="mt-2 h-20"
                  value={discovery}
                  onChange={(e) => {
                    setDiscovery(e.target.value)
                    if (e.target.value) setShowDiscovery(true)
                    clearField("discovery")
                  }}
                  {...fieldErrorProps("discovery", fieldErrors.discovery)}
                />
                <FieldError name="discovery" message={fieldErrors.discovery} />
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="mt-1 h-auto w-fit p-0"
                  onClick={() => setShowDiscovery(false)}
                >
                  - Ocultar
                </Button>
              </div>
            )}

            {!showAgreement ? (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto w-fit p-0"
                onClick={() => setShowAgreement(true)}
              >
                + Agregar acuerdo
              </Button>
            ) : (
              <div>
                <Label htmlFor="activity-agreement">¿Qué acordamos?</Label>
                <Textarea
                  id="activity-agreement"
                  className="mt-2 h-20"
                  value={agreement}
                  onChange={(e) => {
                    setAgreement(e.target.value)
                    clearField("agreement")
                  }}
                  {...fieldErrorProps("agreement", fieldErrors.agreement)}
                />
                <FieldError name="agreement" message={fieldErrors.agreement} />
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  className="mt-1 h-auto w-fit p-0"
                  onClick={() => setShowAgreement(false)}
                >
                  - Ocultar
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Sección 4 — Siguiente paso (condicional) */}
        {needsNextStep && (
          <section className="bg-background p-4 md:p-6 xl:col-span-2">
            <h5 className="text-base font-semibold">
              Siguiente paso requerido para {type}
            </h5>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="activity-next-step">
                  Siguiente paso concreto *
                </Label>
                <Input
                  id="activity-next-step"
                  type="text"
                  className="mt-2"
                  value={nextStep}
                  onChange={(e) => {
                    setNextStep(e.target.value)
                    clearField("nextStep")
                  }}
                  placeholder="Siguiente paso concreto"
                  required
                  {...fieldErrorProps("nextStep", fieldErrors.nextStep)}
                />
                <FieldError name="nextStep" message={fieldErrors.nextStep} />
              </div>
              <div>
                <Label htmlFor="activity-next-objective">
                  Objetivo del siguiente paso
                </Label>
                <Input
                  id="activity-next-objective"
                  type="text"
                  className="mt-2"
                  value={nextObjective}
                  onChange={(e) => {
                    setNextObjective(e.target.value)
                    clearField("nextObjective")
                  }}
                  placeholder="Objetivo del siguiente paso"
                  {...fieldErrorProps("nextObjective", fieldErrors.nextObjective)}
                />
                <FieldError
                  name="nextObjective"
                  message={fieldErrors.nextObjective}
                />
              </div>
              <div>
                <Label htmlFor="activity-next-date" id="activity-next-date-label">Fecha próxima *</Label>
                <div className="mt-2">
                  <DatePickerField
                    id="activity-next-date"
                    value={nextDate}
                    onChange={(v) => {
                      setNextDate(v)
                      clearField("nextDate")
                    }}
                    {...fieldErrorProps("nextDate", fieldErrors.nextDate)}
                  />
                </div>
                <FieldError name="nextDate" message={fieldErrors.nextDate} />
              </div>
              <div>
                <Label htmlFor="activity-next-time" id="activity-next-time-label">Hora próxima *</Label>
                <TimePickerField
                  id="activity-next-time"
                  value={nextTime}
                  onChange={(v) => {
                    setNextTime(v)
                    clearField("nextTime")
                  }}
                  aria-invalid={!!fieldErrors.nextTime}
                  aria-describedby={fieldErrors.nextTime ? "nextTime-error" : undefined}
                  className="mt-2"
                />
                <FieldError name="nextTime" message={fieldErrors.nextTime} />
              </div>
            </div>
          </section>
        )}

        {/* Sección 5 — AI Coach (colapsado por defecto) */}
        <section className="bg-background px-4 py-2 md:px-6 xl:col-span-2">
          <Accordion
            type="single"
            collapsible
            value={showAiCoach ? "coach" : ""}
            onValueChange={(value) => setShowAiCoach(value === "coach")}
          >
            <AccordionItem value="coach">
              <AccordionTrigger>Coach IA</AccordionTrigger>
              <AccordionContent>
                <div className="border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      Sugerencias IA
                    </p>
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
                    <ul className="mt-2 flex flex-col gap-1 pl-4">
                      {aiTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1">{getCoachMessage()}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      {/* Sección 6 — Submit */}
      <div className="flex justify-end border-t p-4 md:px-6">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? "Guardando..." : `Registrar · +${TASK_POINTS[type]}pts`}
        </Button>
      </div>
    </form>
  )
}
