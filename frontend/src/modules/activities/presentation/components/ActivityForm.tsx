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
import { coachingApi } from "@/modules/coaching/infrastructure/coaching.api"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { ClientCombobox } from "@/shared/components/forms/ClientCombobox"
import { DatePickerField } from "@/shared/components/forms/DatePickerField"
import { TimePickerField } from "@/shared/components/forms/TimePickerField"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
}

export function ActivityForm({
  onSubmit,
  isLoading,
  programmedTask,
  submitError,
  initialClientId,
  initialClientLabel,
  taskId,
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
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ""

  // form state
  const [aiTips, setAiTips] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
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
  const { data: todayTasks } = useTodayTasks()
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
  const qualityColor =
    quality >= 80 ? "#82bc00" : quality >= 40 ? "#F59E0B" : "#EF4444"

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
    setAiLoading(true)
    try {
      const res = await coachingApi.getSuggestion({
        type,
        objective: summary || undefined,
        client: selectedClient?.name,
        dealStage: stage || undefined,
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
    if (!isNonCommercial && !clientId) {
      setClientError("Selecciona un cliente para actividades comerciales.")
      return
    }
    setClientError("")
    const input: CreateActivityInput = {
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
    <form ref={formRef} onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Registrar actividad comercial
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Llamadas, videoconferencias, visitas y propuestas requieren siguiente
          paso.
        </p>
      </div>

      <FormErrorSummary error={errorSummary} />

      {/* Sección 1 — Contexto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Cliente */}
        <div>
          <label className="slabel">Cliente *</label>
          <ClientCombobox
            id="clientId"
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
            error={!!fieldErrors.clientId}
          />
          {clientError && (
            <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>
              {clientError}
            </p>
          )}
          <FieldError name="clientId" message={fieldErrors.clientId} />
        </div>

        {/* Contacto */}
        <div>
          <label className="slabel">Contacto</label>
          <Select
            value={contactId}
            onValueChange={(v) => {
              setContactId(v === "__none__" ? "" : v)
              clearField("contactId")
            }}
            disabled={!clientId || contacts.length === 0}
          >
            <SelectTrigger
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

        {/* Oportunidad (span 2 cols, solo si hay cliente y no es no-comercial) */}
        {clientId && !isNonCommercial && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="slabel">Oportunidad / Proyecto</label>
            <Select
              value={selectedOpportunityId}
              onValueChange={(v) => {
                const next = v === "__none__" ? "" : v
                setSelectedOpportunityId(next)
                const deal = clientDeals?.find((d) => d.id === next)
                if (deal && !stage) setStage(deal.stage)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin oportunidad vinculada (deal principal)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  Sin oportunidad vinculada (deal principal)
                </SelectItem>
                {(clientDeals ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.opportunityName ?? "Oportunidad principal"} — {d.stage}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ Nueva oportunidad...</SelectItem>
              </SelectContent>
            </Select>
            {isNewOpportunity && (
              <Input
                type="text"
                className="mt-2"
                placeholder="Nombre de la nueva oportunidad (ej. Flotilla GPS, Proyecto Cámaras)"
                value={newOpportunityName}
                onChange={(e) => setNewOpportunityName(e.target.value)}
                maxLength={200}
              />
            )}
          </div>
        )}

        {/* Tipo de actividad */}
        <div>
          <label className="slabel">Tipo de actividad</label>
          <Select
            value={type}
            onValueChange={(v) => {
              const t = v as ActivityType
              setType(t)
              if (NON_COMMERCIAL_TYPES.includes(t)) setClientError("")
              clearField("type")
            }}
          >
            <SelectTrigger {...fieldErrorProps("type", fieldErrors.type)}>
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

        {/* Resultado */}
        <div>
          <label className="slabel">Resultado</label>
          <Select
            value={result}
            onValueChange={(v) => {
              setResult(v as ActivityResult)
              clearField("result")
            }}
          >
            <SelectTrigger {...fieldErrorProps("result", fieldErrors.result)}>
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

        {/* Fecha + hora ejecución */}
        <div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label className="slabel">Fecha de ejecución</label>
              <DatePickerField
                value={execDate}
                onChange={handleExecDateChange}
                {...fieldErrorProps("executedAt", fieldErrors.executedAt)}
              />
            </div>
            <div>
              <label className="slabel">Hora</label>
              <TimePickerField
                value={execTime}
                onChange={handleExecTimeChange}
                aria-invalid={!!fieldErrors.executedAt}
              />
            </div>
          </div>
          <FieldError name="executedAt" message={fieldErrors.executedAt} />
        </div>

        {/* Etapa pipeline */}
        <div>
          <label className="slabel">Etapa del pipeline</label>
          {currentDeal && !isNonCommercial && (
            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>
              Actual:{" "}
              <strong style={{ color: "#002B49" }}>{currentDeal.stage}</strong>
            </p>
          )}
          <Select
            value={stage}
            onValueChange={(v) => setStage(v === "__none__" ? "" : v)}
          >
            <SelectTrigger>
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

        {/* Tarea vinculada */}
        <div>
          <label className="slabel">Tarea vinculada</label>
          {programmedTask ? (
            <Input
              type="text"
              value={programmedTask}
              readOnly
              style={{ background: "#F8FAFC", color: "#94A3B8" }}
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
              <SelectTrigger>
                <SelectValue placeholder="Sin tarea vinculada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin tarea vinculada</SelectItem>
                {pendingTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Fecha + hora de captura */}
        <div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label className="slabel">Fecha de captura</label>
              <DatePickerField
                value={progDate}
                onChange={handleProgDateChange}
              />
            </div>
            <div>
              <label className="slabel">Hora de captura</label>
              <TimePickerField
                value={progTime}
                onChange={handleProgTimeChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2 — ¿Qué pasó? (siempre visible) */}
      <div>
        <label className="slabel">¿Qué pasó? *</label>
        <Textarea
          style={{ height: 100 }}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value)
            clearField("summary")
          }}
          required
          {...fieldErrorProps("summary", fieldErrors.summary)}
        />
        <FieldError name="summary" message={fieldErrors.summary} />
        <div className="prog" style={{ marginTop: 6 }}>
          <div
            className="prog-fill"
            style={{ width: `${quality}%`, backgroundColor: qualityColor }}
          />
        </div>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
          Calidad estimada:{" "}
          <span style={{ fontWeight: 600, color: qualityColor }}>
            {quality}%
          </span>
        </p>
      </div>

      {/* Sección 3 — Campos expandibles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!showDiscovery ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0 text-tracker-blue"
            onClick={() => setShowDiscovery(true)}
          >
            + Agregar descubrimiento
          </Button>
        ) : (
          <div>
            <label className="slabel">¿Qué descubrí?</label>
            <Textarea
              style={{ height: 80 }}
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
              className="h-auto p-0 text-tracker-blue"
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
            className="h-auto p-0 text-tracker-blue"
            onClick={() => setShowAgreement(true)}
          >
            + Agregar acuerdo
          </Button>
        ) : (
          <div>
            <label className="slabel">¿Qué acordamos?</label>
            <Textarea
              style={{ height: 80 }}
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
              className="h-auto p-0 text-tracker-blue"
              onClick={() => setShowAgreement(false)}
            >
              - Ocultar
            </Button>
          </div>
        )}
      </div>

      {/* Sección 4 — Siguiente paso (callout condicional) */}
      {needsNextStep && (
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1D4ED8",
              marginBottom: 12,
            }}
          >
            Siguiente paso requerido para {type}
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label className="slabel">Siguiente paso concreto *</label>
              <Input
                type="text"
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
              <label className="slabel">Objetivo del siguiente paso</label>
              <Input
                type="text"
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
              <label className="slabel">Fecha próxima *</label>
              <DatePickerField
                value={nextDate}
                onChange={(v) => {
                  setNextDate(v)
                  clearField("nextDate")
                }}
                {...fieldErrorProps("nextDate", fieldErrors.nextDate)}
              />
              <FieldError name="nextDate" message={fieldErrors.nextDate} />
            </div>
            <div>
              <label className="slabel">Hora próxima *</label>
              <TimePickerField
                value={nextTime}
                onChange={(v) => {
                  setNextTime(v)
                  clearField("nextTime")
                }}
                aria-invalid={!!fieldErrors.nextTime}
              />
              <FieldError name="nextTime" message={fieldErrors.nextTime} />
            </div>
          </div>
        </div>
      )}

      {/* Sección 5 — AI Coach (colapsado por defecto) */}
      <Accordion
        type="single"
        collapsible
        value={showAiCoach ? "coach" : ""}
        onValueChange={(value) => setShowAiCoach(value === "coach")}
      >
        <AccordionItem value="coach">
          <AccordionTrigger>Coach IA</AccordionTrigger>
          <AccordionContent>
            <div className="ai-box">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p className="text-sm font-medium text-purple-900">
                  Sugerencias IA
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={fetchAiSuggestions}
                  disabled={aiLoading}
                  className="border-[#c4b5fd] text-tracker-purple"
                >
                  {aiLoading ? "Cargando..." : "Obtener sugerencias"}
                </Button>
              </div>
              {aiTips.length > 0 ? (
                <ul
                  style={{
                    marginTop: 8,
                    paddingLeft: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {aiTips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#6d28d9" }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-purple-700">
                  {getCoachMessage()}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sección 6 — Submit */}
      <Button type="submit" disabled={isLoading} variant="success" className="w-full">
        {isLoading ? "Guardando..." : `Registrar · +${TASK_POINTS[type]}pts`}
      </Button>
    </form>
  )
}
