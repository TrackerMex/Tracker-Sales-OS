import type { MonthlyReport } from "../../domain/reports.types"

export function money(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function buildAnalysis(
  data: MonthlyReport,
  goalAmount: number,
  goalUnits: number,
  goalPerSeller: number
) {
  const amtPct = goalAmount > 0 ? (data.total.amount / goalAmount) * 100 : 0
  const unitPct = goalUnits > 0 ? (data.total.units / goalUnits) * 100 : 0
  const sellerRows = data.sellers
  const topSeller = [...sellerRows].sort((a, b) => b.amount - a.amount)[0]
  const lowSellers = sellerRows.filter((r) => r.amount < goalPerSeller * 0.5)

  const strengths: string[] = []
  const opportunities: string[] = []
  const redFlags: string[] = []
  const recommendations: string[] = []

  if (amtPct >= 80)
    strengths.push(`Ventas en ${amtPct.toFixed(1)}% de la meta mensual.`)
  if (topSeller && topSeller.amount > 0)
    strengths.push(
      `${topSeller.sellerName} lidera ventas con ${money(topSeller.amount)}.`
    )
  if (amtPct < 50)
    opportunities.push(
      "Ventas por debajo del 50% de la meta. Revisar calidad de pipeline."
    )
  if (unitPct < 50)
    opportunities.push(
      `Unidades en ${unitPct.toFixed(0)}% de meta. Revisar estrategia de volumen.`
    )
  if (lowSellers.length > 0)
    opportunities.push(
      `${lowSellers.map((s) => s.sellerName).join(", ")} por debajo del 50% de meta individual.`
    )
  if (unitPct < 30) redFlags.push("Unidades muy por debajo de la meta.")
  if (data.total.count < 5)
    redFlags.push("Volumen de actividad comercial muy bajo para el período.")
  if (amtPct < 80)
    recommendations.push(
      "Revisión semanal de pipeline: identificar oportunidades en fase Propuesta/Negociación para cierre."
    )
  recommendations.push(
    "Priorizar conversión de llamada a reunión y de reunión a propuesta."
  )

  const health = data.commercialHealth
  const hasRedFlags = redFlags.length > 0
  const status =
    health >= 80
      ? hasRedFlags
        ? "Salud alta, pero con alertas activas. Revisar focos rojos."
        : "Equipo en zona verde. Mantener ritmo."
      : health >= 50
        ? "Atención requerida en actividad o calidad."
        : "Intervención urgente necesaria."

  return { strengths, opportunities, redFlags, recommendations, health, status }
}
