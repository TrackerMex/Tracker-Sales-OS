import { useState, useEffect } from "react"
import { ACTIVITY_TYPES, TASK_POINTS, REQUIRES_NEXT_STEP, PIPELINE_STAGES, NON_COMMERCIAL_TYPES } from "@/shared/lib/constants"
import type { ActivityType, PipelineStage } from "@/shared/lib/constants"
import type { ActivityResult, CreateActivityInput } from "../../domain/activities.types"
import type { Client } from "@/modules/clients/domain/clients.types"
import { useClients } from "@/modules/clients/application/hooks/useClients"
import { usePipeline } from "@/modules/pipeline/application/hooks/usePipeline"
import { useAppStore } from "@/shared/store/app.store"
import { coachingApi } from '@/modules/coaching/infrastructure/coaching.api'
import { useApiFormErrors } from '@/shared/lib/api-errors'
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary'
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError'
import { useTodayTasks } from "@/modules/tasks/application/hooks/useTodayTasks"
import { useClientDeals } from "@/modules/pipeline/application/hooks/useClientDeals"

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
  taskId?: string
}

export function ActivityForm({ onSubmit, isLoading, programmedTask, submitError, initialClientId, taskId }: Props) {
  const { summary: errorSummary, fieldErrors, clearField, formRef } = useApiFormErrors(submitError)
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  const { data: clientsResponse } = useClients({ limit: 100 })
  const clients: Client[] = clientsResponse?.data ?? []

  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ''

  const [aiTips, setAiTips] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [clientId, setClientId] = useState(initialClientId ?? "")
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

  const { data: pipelineGrouped } = usePipeline(sellerId || null)
  const { data: todayTasks } = useTodayTasks()
  const pendingTasks = (todayTasks ?? []).filter((t) => t.status === 'Pendiente')
  const { data: clientDeals } = useClientDeals(clientId || null, sellerId || null)
  const isNewOpportunity = selectedOpportunityId === "__new__"
  const selectedDeal = clientDeals?.find((d) => d.id === selectedOpportunityId) ?? null

  const currentDeal = pipelineGrouped && clientId
    ? Object.values(pipelineGrouped).flat().find((d) => d.clientId === clientId) ?? null
    : null

  const selectedClient = clients.find((c) => c.id === clientId)
  const contacts = selectedClient?.contacts ?? []
  const needsNextStep = REQUIRES_NEXT_STEP.includes(type)
  const isNonCommercial = NON_COMMERCIAL_TYPES.includes(type)

  useEffect(() => {
    if (currentDeal?.stage && !isNonCommercial) {
      setStage(currentDeal.stage)
    } else if (!currentDeal) {
      setStage("")
    }
  }, [currentDeal?.stage, isNonCommercial])
  const quality = calcQuality({ summary, discovery, agreement, nextStep, nextDate, nextTime })

  function getCoachMessage(): string {
    if (needsNextStep) {
      if (["Videoconferencia", "Reunión virtual", "Visita física", "Reunión presencial"].includes(type)) {
        return "Esta actividad requiere siguiente paso, fecha y hora. Recuerda registrar o validar la cita en Outlook."
      }
      return "Esta actividad requiere siguiente paso, fecha y hora."
    }
    return "Suma 1 punto. No requiere siguiente paso obligatorio."
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
    const resolvedOpportunity = isNewOpportunity ? newOpportunityName.trim() : selectedDeal?.opportunityName ?? undefined
    if (resolvedOpportunity) input.opportunityName = resolvedOpportunity
    onSubmit(input)
  }

  const execDate = executedAt.split("T")[0]
  const execTime = executedAt.includes("T") ? executedAt.split("T")[1] : ""

  function handleExecDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearField("executedAt")
    setExecutedAt(`${e.target.value}T${execTime || "00:00"}`)
  }

  function handleExecTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearField("executedAt")
    setExecutedAt(`${execDate || new Date().toISOString().split("T")[0]}T${e.target.value}`)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Registrar actividad comercial</h2>
        <p className="text-sm text-slate-500 mt-1">Vincula una tarea pendiente o ajusta la hora de captura. Llamadas, videoconferencias, visitas y propuestas requieren siguiente paso.</p>
      </div>

      <FormErrorSummary error={errorSummary} />

      {/* Task + capture time row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="slabel">Tarea programada</label>
          {programmedTask ? (
            <input
              type="text"
              className="input"
              value={programmedTask}
              readOnly
              style={{ background: '#F8FAFC', color: '#94A3B8' }}
            />
          ) : (
            <select
              className="input"
              value={internalTaskId}
              onChange={(e) => {
                const task = pendingTasks.find((t) => t.id === e.target.value)
                setInternalTaskId(e.target.value)
                if (task?.scheduledAt) {
                  setProgrammedAt(task.scheduledAt.slice(0, 16))
                }
              }}
            >
              <option value="">Sin tarea vinculada</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="slabel">Hora de captura</label>
          <input
            type="datetime-local"
            className="input"
            value={programmedAt}
            onChange={(e) => setProgrammedAt(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client dropdown */}
        <div>
          <label className="slabel">Cliente *</label>
          <select
            className={fieldErrors.clientId ? "input input-error" : "input"}
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value)
              setContactId("")
              setSelectedOpportunityId("")
              setNewOpportunityName("")
              clearField("clientId")
            }}
            required={!isNonCommercial}
            {...fieldErrorProps("clientId", fieldErrors.clientId)}
          >
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <FieldError name="clientId" message={fieldErrors.clientId} />
        </div>

        {/* Opportunity selector */}
        {clientId && !isNonCommercial && (
          <div className="sm:col-span-2">
            <label className="slabel">Oportunidad / Proyecto</label>
            <select
              className="input"
              value={selectedOpportunityId}
              onChange={(e) => {
                setSelectedOpportunityId(e.target.value)
                const deal = clientDeals?.find((d) => d.id === e.target.value)
                if (deal && !stage) setStage(deal.stage)
              }}
            >
              <option value="">Sin oportunidad vinculada (deal principal)</option>
              {(clientDeals ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.opportunityName ?? "Oportunidad principal"} — {d.stage}
                </option>
              ))}
              <option value="__new__">+ Nueva oportunidad...</option>
            </select>
            {isNewOpportunity && (
              <input
                type="text"
                className="input mt-2"
                placeholder="Nombre de la nueva oportunidad (ej. Flotilla GPS, Proyecto Cámaras)"
                value={newOpportunityName}
                onChange={(e) => setNewOpportunityName(e.target.value)}
                maxLength={200}
              />
            )}
          </div>
        )}

        {/* Contact dropdown */}
        <div>
          <label className="slabel">Contacto</label>
          <select
            className={fieldErrors.contactId ? "input input-error" : "input"}
            value={contactId}
            onChange={(e) => { setContactId(e.target.value); clearField("contactId") }}
            disabled={!clientId || contacts.length === 0}
            {...fieldErrorProps("contactId", fieldErrors.contactId)}
          >
            <option value="">
              {!clientId ? "Selecciona un cliente primero" : contacts.length === 0 ? "Sin contactos registrados" : "Seleccionar contacto..."}
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}{c.isDecisionMaker ? " (Decisor)" : ""}
              </option>
            ))}
          </select>
          <FieldError name="contactId" message={fieldErrors.contactId} />
        </div>

        {/* Activity type */}
        <div>
          <label className="slabel">Tipo de actividad</label>
          <select
            className={fieldErrors.type ? "input input-error" : "input"}
            value={type}
            onChange={(e) => { setType(e.target.value as ActivityType); clearField("type") }}
            {...fieldErrorProps("type", fieldErrors.type)}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t} ({TASK_POINTS[t]} pts)</option>
            ))}
          </select>
          <FieldError name="type" message={fieldErrors.type} />
        </div>

        {/* Result */}
        <div>
          <label className="slabel">Resultado</label>
          <select
            className={fieldErrors.result ? "input input-error" : "input"}
            value={result}
            onChange={(e) => { setResult(e.target.value as ActivityResult); clearField("result") }}
            {...fieldErrorProps("result", fieldErrors.result)}
          >
            {ACTIVITY_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <FieldError name="result" message={fieldErrors.result} />
        </div>

        {/* Stage */}
        <div>
          <label className="slabel">Etapa del pipeline</label>
          {currentDeal && !isNonCommercial && (
            <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>
              Deal actual en: <strong style={{ color: '#002B49' }}>{currentDeal.stage}</strong>
              {' — cambia el stage aquí para avanzar el deal'}
            </p>
          )}
          <select
            className="input"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">Sin cambio</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Execution date + time */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="slabel">Fecha de ejecución</label>
              <input
                type="date"
                className={fieldErrors.executedAt ? "input input-error" : "input"}
                value={execDate}
                onChange={handleExecDateChange}
                required
                {...fieldErrorProps("executedAt", fieldErrors.executedAt)}
              />
            </div>
            <div>
              <label className="slabel">Hora</label>
              <input
                type="time"
                className={fieldErrors.executedAt ? "input input-error" : "input"}
                value={execTime}
                onChange={handleExecTimeChange}
                required
              />
            </div>
          </div>
          <FieldError name="executedAt" message={fieldErrors.executedAt} />
        </div>

        {/* Summary */}
        <div className="sm:col-span-2">
          <label className="slabel">Resumen *</label>
          <textarea
            className={fieldErrors.summary ? "input input-error" : "input"}
            style={{ height: 90 }}
            value={summary}
            onChange={(e) => { setSummary(e.target.value); clearField("summary") }}
            required
            {...fieldErrorProps("summary", fieldErrors.summary)}
          />
          <FieldError name="summary" message={fieldErrors.summary} />
        </div>

        {/* Discovery */}
        <div className="sm:col-span-2">
          <label className="slabel">Descubrimiento</label>
          <textarea
            className={fieldErrors.discovery ? "input input-error" : "input"}
            style={{ height: 80 }}
            value={discovery}
            onChange={(e) => { setDiscovery(e.target.value); clearField("discovery") }}
            {...fieldErrorProps("discovery", fieldErrors.discovery)}
          />
          <FieldError name="discovery" message={fieldErrors.discovery} />
        </div>

        {/* Agreement */}
        <div className="sm:col-span-2">
          <label className="slabel">Acuerdo</label>
          <textarea
            className={fieldErrors.agreement ? "input input-error" : "input"}
            style={{ height: 80 }}
            value={agreement}
            onChange={(e) => { setAgreement(e.target.value); clearField("agreement") }}
            {...fieldErrorProps("agreement", fieldErrors.agreement)}
          />
          <FieldError name="agreement" message={fieldErrors.agreement} />
        </div>

        {/* Next step fields */}
        {needsNextStep && (
          <div className="sm:col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="slabel">Siguiente paso concreto *</label>
                <input
                  type="text"
                  className={fieldErrors.nextStep ? "input input-error" : "input"}
                  value={nextStep}
                  onChange={(e) => { setNextStep(e.target.value); clearField("nextStep") }}
                  placeholder="Siguiente paso concreto"
                  required
                  {...fieldErrorProps("nextStep", fieldErrors.nextStep)}
                />
                <FieldError name="nextStep" message={fieldErrors.nextStep} />
              </div>
              <div>
                <label className="slabel">Objetivo del siguiente paso</label>
                <input
                  type="text"
                  className={fieldErrors.nextObjective ? "input input-error" : "input"}
                  value={nextObjective}
                  onChange={(e) => { setNextObjective(e.target.value); clearField("nextObjective") }}
                  placeholder="Objetivo del siguiente paso"
                  {...fieldErrorProps("nextObjective", fieldErrors.nextObjective)}
                />
                <FieldError name="nextObjective" message={fieldErrors.nextObjective} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="slabel">Fecha próxima *</label>
                <input
                  type="date"
                  className={fieldErrors.nextDate ? "input input-error" : "input"}
                  value={nextDate}
                  onChange={(e) => { setNextDate(e.target.value); clearField("nextDate") }}
                  required
                  {...fieldErrorProps("nextDate", fieldErrors.nextDate)}
                />
                <FieldError name="nextDate" message={fieldErrors.nextDate} />
              </div>
              <div>
                <label className="slabel">Hora próxima *</label>
                <input
                  type="time"
                  className={fieldErrors.nextTime ? "input input-error" : "input"}
                  value={nextTime}
                  onChange={(e) => { setNextTime(e.target.value); clearField("nextTime") }}
                  required
                  {...fieldErrorProps("nextTime", fieldErrors.nextTime)}
                />
                <FieldError name="nextTime" message={fieldErrors.nextTime} />
              </div>
            </div>
          </div>
        )}

        {/* AI Coach */}
        <div className="sm:col-span-2 ai-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="text-sm font-medium text-purple-900">Coach IA</p>
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
            <ul style={{ marginTop: 8, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {aiTips.map((tip, i) => (
                <li key={i} style={{ fontSize: 12, color: '#6d28d9' }}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-purple-700 mt-1">{getCoachMessage()}</p>
          )}
          <p className="text-xs text-purple-500 mt-2">
            Calidad estimada:{" "}
            <span className={quality >= 80 ? "font-semibold text-green-600" : quality >= 40 ? "font-semibold text-amber-600" : "font-semibold text-red-500"}>
              {quality}%
            </span>
          </p>
        </div>

        {/* Save button */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-green w-full"
          >
            {isLoading ? "Guardando..." : "Registrar actividad"}
          </button>
        </div>
      </div>
    </form>
  )
}
