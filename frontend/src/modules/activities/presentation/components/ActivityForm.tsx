import { useState } from "react"
import { ACTIVITY_TYPES, TASK_POINTS, REQUIRES_NEXT_STEP, PIPELINE_STAGES } from "@/shared/lib/constants"
import type { ActivityType } from "@/shared/lib/constants"
import type { ActivityResult, CreateActivityInput } from "../../domain/activities.types"
import type { Client } from "@/modules/clients/domain/clients.types"
import { useClients } from "@/modules/clients/application/hooks/useClients"

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
}

function nowStamp(): string {
  return new Date().toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
}

export function ActivityForm({ onSubmit, isLoading, programmedTask }: Props) {
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  const capturedStamp = nowStamp()

  const { data: clientsResponse } = useClients({ limit: 100 })
  const clients: Client[] = clientsResponse?.data ?? []

  const [clientId, setClientId] = useState("")
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

  const selectedClient = clients.find((c) => c.id === clientId)
  const contacts = selectedClient?.contacts ?? []
  const needsNextStep = REQUIRES_NEXT_STEP.includes(type)
  const points = TASK_POINTS[type]
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: CreateActivityInput = {
      clientId,
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
    onSubmit(input)
  }

  const execDate = executedAt.split("T")[0]
  const execTime = executedAt.includes("T") ? executedAt.split("T")[1] : ""

  function handleExecDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setExecutedAt(`${e.target.value}T${execTime || "00:00"}`)
  }

  function handleExecTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setExecutedAt(`${execDate || new Date().toISOString().split("T")[0]}T${e.target.value}`)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Registrar actividad comercial</h2>
        <p className="text-sm text-slate-500 mt-1">La hora de captura queda registrada automáticamente. Llamadas, videoconferencias, visitas y propuestas requieren siguiente paso.</p>
      </div>

      {/* Info readonly row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="slabel">Tarea programada</label>
          <input
            type="text"
            className="input"
            value={programmedTask ?? 'Sin tarea vinculada'}
            readOnly
            style={{ background: '#F8FAFC', color: '#94A3B8' }}
          />
        </div>
        <div>
          <label className="slabel">Hora de captura</label>
          <input
            type="text"
            className="input"
            value={`Captura: ${capturedStamp}`}
            readOnly
            style={{ background: '#F8FAFC', color: '#94A3B8' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client dropdown */}
        <div>
          <label className="slabel">Cliente *</label>
          <select
            className="input"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setContactId("") }}
            required
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Contact dropdown */}
        <div>
          <label className="slabel">Contacto</label>
          <select
            className="input"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={!clientId || contacts.length === 0}
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
        </div>

        {/* Activity type */}
        <div>
          <label className="slabel">Tipo de actividad</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t} ({TASK_POINTS[t]} pts)</option>
            ))}
          </select>
        </div>

        {/* Result */}
        <div>
          <label className="slabel">Resultado</label>
          <select
            className="input"
            value={result}
            onChange={(e) => setResult(e.target.value as ActivityResult)}
          >
            {ACTIVITY_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="slabel">Etapa del pipeline</label>
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="slabel">Fecha de ejecución</label>
            <input
              type="date"
              className="input"
              value={execDate}
              onChange={handleExecDateChange}
              required
            />
          </div>
          <div>
            <label className="slabel">Hora</label>
            <input
              type="time"
              className="input"
              value={execTime}
              onChange={handleExecTimeChange}
              required
            />
          </div>
        </div>

        {/* Summary */}
        <div className="sm:col-span-2">
          <label className="slabel">Resumen *</label>
          <textarea
            className="input"
            style={{ height: 90 }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </div>

        {/* Discovery */}
        <div className="sm:col-span-2">
          <label className="slabel">Descubrimiento</label>
          <textarea
            className="input"
            style={{ height: 80 }}
            value={discovery}
            onChange={(e) => setDiscovery(e.target.value)}
          />
        </div>

        {/* Agreement */}
        <div className="sm:col-span-2">
          <label className="slabel">Acuerdo</label>
          <textarea
            className="input"
            style={{ height: 80 }}
            value={agreement}
            onChange={(e) => setAgreement(e.target.value)}
          />
        </div>

        {/* Next step fields */}
        {needsNextStep && (
          <div className="sm:col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="slabel">Siguiente paso concreto *</label>
                <input
                  type="text"
                  className="input"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="Siguiente paso concreto"
                  required
                />
              </div>
              <div>
                <label className="slabel">Objetivo del siguiente paso</label>
                <input
                  type="text"
                  className="input"
                  value={nextObjective}
                  onChange={(e) => setNextObjective(e.target.value)}
                  placeholder="Objetivo del siguiente paso"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="slabel">Fecha próxima *</label>
                <input
                  type="date"
                  className="input"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="slabel">Hora próxima *</label>
                <input
                  type="time"
                  className="input"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Coach */}
        <div className="sm:col-span-2 ai-box">
          <p className="text-sm font-medium text-purple-900">Coach IA</p>
          <p className="text-sm text-purple-700 mt-1">{getCoachMessage()}</p>
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
