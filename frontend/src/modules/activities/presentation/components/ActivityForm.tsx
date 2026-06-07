import { useState } from "react"
import { ACTIVITY_TYPES, TASK_POINTS, REQUIRES_NEXT_STEP } from "@/shared/lib/constants"
import type { ActivityType } from "@/shared/lib/constants"
import type { ActivityResult, CreateActivityInput } from "../../domain/activities.types"

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
}

export function ActivityForm({ onSubmit, isLoading }: Props) {
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const [type, setType] = useState<ActivityType>(ACTIVITY_TYPES[0])
  const [result, setResult] = useState<ActivityResult>(ACTIVITY_RESULTS[0])
  const [clientId, setClientId] = useState("")
  const [summary, setSummary] = useState("")
  const [discovery, setDiscovery] = useState("")
  const [agreement, setAgreement] = useState("")
  const [nextStep, setNextStep] = useState("")
  const [nextDate, setNextDate] = useState("")
  const [nextTime, setNextTime] = useState("")
  const [executedAt, setExecutedAt] = useState(localNow)

  const needsNextStep = REQUIRES_NEXT_STEP.includes(type)
  const points = TASK_POINTS[type]
  const quality = calcQuality({ summary, discovery, agreement, nextStep, nextDate, nextTime })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: CreateActivityInput = {
      clientId,
      type,
      result,
      summary,
      executedAt: new Date(executedAt).toISOString(),
    }
    if (discovery) input.discovery = discovery
    if (agreement) input.agreement = agreement
    if (nextStep) input.nextStep = nextStep
    if (nextDate) input.nextDate = nextDate
    if (nextTime) input.nextTime = nextTime
    onSubmit(input)
  }

  const labelClass = "block text-sm font-medium text-slate-700 mb-1"
  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49]/30 focus:border-[#002B49]"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo de actividad</label>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Puntos: {points}</p>
        </div>

        <div>
          <label className={labelClass}>Resultado</label>
          <select
            className={inputClass}
            value={result}
            onChange={(e) => setResult(e.target.value as ActivityResult)}
          >
            {ACTIVITY_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>ID del cliente</label>
        <input
          type="text"
          className={inputClass}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="UUID del cliente"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Resumen *</label>
        <textarea
          className={inputClass}
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Descubrimiento</label>
        <textarea
          className={inputClass}
          rows={2}
          value={discovery}
          onChange={(e) => setDiscovery(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Acuerdo</label>
        <textarea
          className={inputClass}
          rows={2}
          value={agreement}
          onChange={(e) => setAgreement(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Fecha de ejecución</label>
        <input
          type="datetime-local"
          className={inputClass}
          value={executedAt}
          onChange={(e) => setExecutedAt(e.target.value)}
          required
        />
      </div>

      {needsNextStep && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-xs font-medium text-amber-700">Este tipo requiere próximo paso</p>
          <div>
            <label className={labelClass}>Próximo paso *</label>
            <textarea
              className={inputClass}
              rows={2}
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha próxima *</label>
              <input
                type="date"
                className={inputClass}
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Hora próxima *</label>
              <input
                type="time"
                className={inputClass}
                value={nextTime}
                onChange={(e) => setNextTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-600">
          Calidad estimada:{" "}
          <span
            className={
              quality >= 80
                ? "font-semibold text-[#82bc00]"
                : quality >= 40
                ? "font-semibold text-amber-600"
                : "font-semibold text-red-500"
            }
          >
            {quality}%
          </span>
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#002B49]/90 disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Registrar actividad"}
        </button>
      </div>
    </form>
  )
}
