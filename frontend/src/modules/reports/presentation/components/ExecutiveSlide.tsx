import type { MonthlyReport, WinLossReport } from "../../domain/reports.types"
import { buildAnalysis, money } from "./executive-slide.utils"
import { cn } from "@/lib/utils"

const LOSS_REASON_LABELS: Record<string, string> = {
  precio: "Precio",
  competencia: "Competencia",
  sin_respuesta: "Sin respuesta",
  timing: "Timing",
  otro: "Otro",
  "sin especificar": "Sin especificar",
}

const LABEL_CLASS = "text-[9px] font-bold uppercase tracking-[0.13em]"

function pct(value: number, goal: number): string {
  if (!goal) return "0.0"
  return ((value / goal) * 100).toFixed(1)
}

function healthColor(h: number): string {
  if (h >= 65) return "#82bc00"
  if (h >= 45) return "#F59E0B"
  return "#EF4444"
}

function AnalysisList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <li className="text-tracker-text-muted">
        Sin hallazgos para este periodo.
      </li>
    )
  }
  return (
    <>
      {items.map((x, i) => (
        <li key={i} className="mb-1">
          {x}
        </li>
      ))}
    </>
  )
}

function Bar({ pctVal, dark }: { pctVal: number; dark?: boolean }) {
  const clamped = Math.min(100, Math.max(0, pctVal))
  return (
    <div
      className={cn(
        "mb-1 h-[3px] overflow-hidden rounded-full",
        dark ? "bg-white/10" : "bg-tracker-border"
      )}
    >
      <div
        className="h-full origin-left rounded-full bg-tracker-green transition-transform duration-400"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  )
}

export interface ExecutiveSlideProps {
  data: MonthlyReport
  winLoss?: WinLossReport | null
  winLossLoading?: boolean
  goalAmount: number
  goalUnits: number
  goalPerSeller: number
  month: string
  updatedAt?: string | null
}

export function ExecutiveSlide({
  data,
  winLoss,
  winLossLoading,
  goalAmount,
  goalUnits,
  goalPerSeller,
  month,
  updatedAt,
}: ExecutiveSlideProps) {
  const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller)
  const amtFill =
    goalAmount > 0 ? Math.min(100, (data.total.amount / goalAmount) * 100) : 0
  const unitFill =
    goalUnits > 0 ? Math.min(100, (data.total.units / goalUnits) * 100) : 0

  return (
    <div
      id="executive-slide"
      className="overflow-hidden rounded-[14px] border border-tracker-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      style={{
        fontFamily: "'Montserrat Variable','Montserrat','Inter',sans-serif",
      }}
    >
      {/* ── HEADER BAND ── */}
      <div className="flex items-center justify-between gap-4 bg-tracker-dark px-7 py-[22px]">
        <div className="flex items-center gap-3.5">
          <div className="h-[46px] w-[3px] shrink-0 rounded-[2px] bg-tracker-green" />
          <div>
            <div
              className={cn(
                LABEL_CLASS,
                "mb-1 tracking-[0.2em] text-tracker-green"
              )}
            >
              Tracker Sales OS
            </div>
            <div className="text-[21px] leading-[1.1] font-extrabold tracking-[-0.025em] text-white">
              Reporte Ejecutivo
            </div>
            <div className="mt-[3px] text-xs font-medium tracking-[0.07em] text-white/38 uppercase">
              {month}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              LABEL_CLASS,
              "mb-[5px] tracking-[0.12em] text-white/28"
            )}
          >
            Venta Global
          </div>
          <div className="text-[32px] leading-none font-black tracking-[-0.035em] text-white">
            {money(data.total.amount)}
          </div>
          <div className="mt-[5px] text-[13px] font-semibold text-tracker-green">
            {data.total.units} unidades
          </div>
          {updatedAt && (
            <div className="mt-1.5 text-[10px] text-white/20">
              Datos al {updatedAt}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col gap-[18px] px-7 py-[22px]">
        {/* KPI ROW */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Primary: Ventas $ — navy */}
          <div className="rounded-[10px] bg-tracker-dark px-[18px] py-4">
            <div className={cn(LABEL_CLASS, "mb-[9px] text-tracker-green")}>
              Ventas $
            </div>
            <div className="mb-2.5 text-xl font-extrabold tracking-[-0.02em] text-white">
              {money(data.total.amount)}
            </div>
            <Bar pctVal={amtFill} dark />
            <div className="text-[10px] font-semibold text-white/38">
              {pct(data.total.amount, goalAmount)}% · Meta {money(goalAmount)}
            </div>
          </div>
          {/* Unidades */}
          <div className="rounded-[10px] border border-tracker-border bg-tracker-surface-alt px-[18px] py-4">
            <div
              className={cn(
                LABEL_CLASS,
                "mb-[9px] text-tracker-text-secondary"
              )}
            >
              Unidades
            </div>
            <div className="mb-2.5 text-[26px] font-extrabold tracking-[-0.02em] text-tracker-dark">
              {data.total.units}
            </div>
            <Bar pctVal={unitFill} />
            <div className="text-[10px] font-semibold text-tracker-text-muted">
              {pct(data.total.units, goalUnits)}% · Meta {goalUnits}
            </div>
          </div>
          {/* Dir. Comercial */}
          <div className="rounded-[10px] border border-tracker-border bg-tracker-surface-alt px-[18px] py-4">
            <div
              className={cn(
                LABEL_CLASS,
                "mb-[9px] text-tracker-text-secondary"
              )}
            >
              Dir. Comercial
            </div>
            <div className="mb-[5px] text-xl font-extrabold tracking-[-0.02em] text-tracker-dark">
              {money(data.direction.amount)}
            </div>
            <div className="text-[11px] font-medium text-tracker-text-muted">
              {data.direction.units} unidades · {data.direction.count} cierres
            </div>
          </div>
          {/* ATC */}
          <div className="rounded-[10px] border border-tracker-border bg-tracker-surface-alt px-[18px] py-4">
            <div
              className={cn(
                LABEL_CLASS,
                "mb-[9px] text-tracker-text-secondary"
              )}
            >
              ATC Existentes
            </div>
            <div className="mb-[5px] text-xl font-extrabold tracking-[-0.02em] text-tracker-dark">
              {money(data.atc.existingAmount)}
            </div>
            <div className="text-[11px] font-medium text-tracker-text-muted">
              {data.atc.existingUnits} unidades
            </div>
          </div>
        </div>

        {/* DIRECCIÓN + EQUIPO */}
        <div className="grid grid-cols-[190px_1fr] gap-3">
          {/* Dirección */}
          <div className="rounded-[10px] border border-violet-200 bg-violet-50 p-4">
            <div className={cn(LABEL_CLASS, "mb-3 text-tracker-purple")}>
              Dirección Comercial
            </div>
            {data.direction.count === 0 ? (
              <p className="m-0 text-xs text-violet-400">
                Sin registros este mes.
              </p>
            ) : (
              <div className="rounded-[7px] bg-white px-[14px] py-3">
                <div className="text-[22px] leading-none font-black tracking-[-0.025em] text-violet-900">
                  {data.direction.count}
                </div>
                <div className="mt-[3px] mb-2.5 text-[10px] font-semibold text-tracker-purple">
                  cierres · {data.direction.units} uds
                </div>
                <div className="text-sm font-extrabold tracking-[-0.01em] text-tracker-dark">
                  {money(data.direction.amount)}
                </div>
              </div>
            )}
          </div>
          {/* Equipo */}
          <div className="rounded-[10px] border border-tracker-border bg-tracker-surface-alt p-4">
            <div
              className={cn(LABEL_CLASS, "mb-3 text-tracker-text-secondary")}
            >
              Equipo de Vendedores
            </div>
            {data.sellers.length === 0 ? (
              <p className="m-0 text-xs text-tracker-text-muted">
                Sin ventas del equipo este mes.
              </p>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {[
                      "Vendedor",
                      "Unidades",
                      "Monto",
                      ...(goalPerSeller > 0 ? ["% Meta"] : []),
                    ].map((h) => (
                      <th
                        key={h}
                        className="pt-0 pr-3 pb-2 pl-0 text-left text-[9px] font-bold tracking-[0.09em] text-tracker-text-muted uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sellers.map((r, i) => {
                    const mp =
                      goalPerSeller > 0 ? (r.amount / goalPerSeller) * 100 : 0
                    return (
                      <tr
                        key={r.sellerId}
                        className={cn(i > 0 && "border-t border-slate-100")}
                      >
                        <td className="py-[7px] pr-3 pl-0 font-semibold text-tracker-text">
                          {r.sellerName}
                        </td>
                        <td className="py-[7px] pr-3 pl-0 text-tracker-text-dim">
                          {r.units}
                        </td>
                        <td className="py-[7px] pr-3 pl-0 font-bold text-tracker-dark">
                          {money(r.amount)}
                        </td>
                        {goalPerSeller > 0 && (
                          <td
                            className={cn(
                              "py-[7px] text-[11px] font-bold",
                              mp >= 100
                                ? "text-tracker-success-dark"
                                : "text-tracker-warning-dark"
                            )}
                          >
                            {mp.toFixed(1)}%
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ATC + ORIGEN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-emerald-100 bg-green-50 p-4">
            <div className={cn(LABEL_CLASS, "mb-2.5 text-green-700")}>
              ATC — Atención a Clientes
            </div>
            <div className="text-xl font-extrabold tracking-[-0.02em] text-green-900">
              {money(data.atc.existingAmount)}
            </div>
            <div className="mt-[5px] text-[11px] font-medium text-tracker-success">
              {data.atc.existingUnits} unidades de clientes existentes
            </div>
          </div>
          <div className="rounded-[10px] border border-tracker-border bg-tracker-surface-alt p-4">
            <div
              className={cn(LABEL_CLASS, "mb-2.5 text-tracker-text-secondary")}
            >
              Origen de Cuentas
            </div>
            {data.bySource.length === 0 ? (
              <p className="m-0 text-xs text-tracker-text-muted">
                Sin datos de origen.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-1.5">
                {data.bySource.slice(0, 6).map((s) => (
                  <div
                    key={s.source}
                    className="rounded-[7px] border border-tracker-border bg-white px-2.5 py-2"
                  >
                    <div className="text-[11px] font-semibold text-tracker-text">
                      {s.source}
                    </div>
                    <div className="mt-0.5 text-[10px] text-tracker-text-secondary">
                      {s.count} ctas · {money(s.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WIN / LOSS */}
        {!winLossLoading && winLoss && winLoss.totalDeals > 0 && (
          <div className="border-t border-slate-100 pt-[18px]">
            <div
              className={cn(LABEL_CLASS, "mb-3.5 text-tracker-text-secondary")}
            >
              Win / Loss — Conversión por Etapa
            </div>
            <div className="mb-3.5 grid grid-cols-4 gap-2">
              <div className="rounded-[9px] bg-tracker-dark px-[14px] py-3">
                <div className={cn(LABEL_CLASS, "mb-1.5 text-tracker-green")}>
                  Win Rate
                </div>
                <div className="text-2xl font-black tracking-[-0.03em] text-white">
                  {winLoss.winRate}%
                </div>
                <div className="mt-[3px] text-[10px] text-white/32">
                  {winLoss.totalDeals} oportunidades
                </div>
              </div>
              {[
                { label: "Ganados", value: winLoss.won },
                { label: "Perdidos", value: winLoss.lost },
                { label: "Abiertos", value: winLoss.open },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-[9px] border border-tracker-border bg-tracker-surface-alt px-[14px] py-3"
                >
                  <div
                    className={cn(
                      LABEL_CLASS,
                      "mb-1.5 text-tracker-text-secondary"
                    )}
                  >
                    {k.label}
                  </div>
                  <div className="text-2xl font-black tracking-[-0.03em] text-tracker-dark">
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {winLoss.funnel.length > 0 && (
              <div className="mb-3.5 overflow-x-auto">
                <div
                  className={cn(LABEL_CLASS, "mb-2 text-tracker-text-muted")}
                >
                  Embudo de Conversión
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {[
                        "Etapa",
                        "Alcanzados",
                        "Conversión %",
                        "Días prom.",
                      ].map((h) => (
                        <th
                          key={h}
                          className="pt-0 pr-3 pb-[7px] pl-0 text-left text-[9px] font-bold tracking-[0.08em] text-tracker-text-muted uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {winLoss.funnel.map((f, i) => (
                      <tr key={f.stage} className="border-t border-slate-100">
                        <td className="py-[7px] pr-3 pl-0 font-semibold text-tracker-text">
                          {f.stage}
                        </td>
                        <td className="py-[7px] pr-3 pl-0 text-tracker-text-dim">
                          {f.reached}
                        </td>
                        <td className="py-[7px] pr-3 pl-0 text-tracker-text-dim">
                          {i === 0 ? "—" : `${f.conversionFromPrevious}%`}
                        </td>
                        <td className="py-[7px] text-tracker-text-dim">
                          {f.avgDaysInStage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(winLoss.lossesByOrigin.length > 0 ||
              winLoss.lossReasons.length > 0) && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div
                    className={cn(LABEL_CLASS, "mb-2 text-tracker-text-muted")}
                  >
                    Perdidos por etapa de origen
                  </div>
                  {winLoss.lossesByOrigin.length === 0 ? (
                    <p className="text-xs text-tracker-text-muted">
                      Sin pérdidas registradas.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          {["Etapa", "Pérdidas", "%"].map((h) => (
                            <th
                              key={h}
                              className="pt-0 pr-2.5 pb-[7px] pl-0 text-left text-[9px] font-bold tracking-[0.08em] text-tracker-text-muted uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {winLoss.lossesByOrigin.map((l, i) => (
                          <tr
                            key={l.originStage}
                            className={cn(i > 0 && "border-t border-slate-100")}
                          >
                            <td className="py-[7px] pr-2.5 pl-0 font-semibold text-tracker-text">
                              {l.originStage}
                            </td>
                            <td className="py-[7px] pr-2.5 pl-0 text-tracker-text-dim">
                              {l.count}
                            </td>
                            <td className="py-[7px] text-tracker-text-dim">
                              {l.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <div
                    className={cn(LABEL_CLASS, "mb-2 text-tracker-text-muted")}
                  >
                    Motivos de pérdida
                  </div>
                  {winLoss.lossReasons.length === 0 ? (
                    <p className="text-xs text-tracker-text-muted">
                      Sin pérdidas registradas.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          {["Motivo", "Pérdidas"].map((h) => (
                            <th
                              key={h}
                              className="pt-0 pr-2.5 pb-[7px] pl-0 text-left text-[9px] font-bold tracking-[0.08em] text-tracker-text-muted uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {winLoss.lossReasons.map((r, i) => (
                          <tr
                            key={r.reason}
                            className={cn(i > 0 && "border-t border-slate-100")}
                          >
                            <td className="py-[7px] pr-2.5 pl-0 font-semibold text-tracker-text">
                              {LOSS_REASON_LABELS[r.reason] ?? r.reason}
                            </td>
                            <td className="py-[7px] text-tracker-text-dim">
                              {r.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANÁLISIS EJECUTIVO IA */}
        <div className="border-t border-slate-100 pt-[18px]">
          <div
            className={cn(LABEL_CLASS, "mb-3.5 text-tracker-text-secondary")}
          >
            Análisis Ejecutivo IA
          </div>
          <div className="mb-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-[9px] border border-emerald-100 bg-green-50 p-3.5">
              <div className="mb-2 text-[10px] font-bold text-green-700">
                Fortalezas
              </div>
              <ul className="m-0 pl-3.5 text-xs leading-[1.65] text-green-800">
                <AnalysisList items={ai.strengths} />
              </ul>
            </div>
            <div className="rounded-[9px] border border-amber-200 bg-amber-50 p-3.5">
              <div className="mb-2 text-[10px] font-bold text-tracker-warning-dark">
                Áreas de Oportunidad
              </div>
              <ul className="m-0 pl-3.5 text-xs leading-[1.65] text-amber-800">
                <AnalysisList items={ai.opportunities} />
              </ul>
            </div>
            <div className="rounded-[9px] border border-red-200 bg-red-50 p-3.5">
              <div className="mb-2 text-[10px] font-bold text-tracker-danger-dark">
                Focos Rojos
              </div>
              <ul className="m-0 pl-3.5 text-xs leading-[1.65] text-red-800">
                <AnalysisList items={ai.redFlags} />
              </ul>
            </div>
            <div className="rounded-[9px] border border-indigo-200 bg-indigo-50 p-3.5">
              <div className="mb-2 text-[10px] font-bold text-indigo-800">
                Recomendaciones para Dirección
              </div>
              <ul className="m-0 pl-3.5 text-xs leading-[1.65] text-indigo-900">
                <AnalysisList items={ai.recommendations} />
              </ul>
            </div>
          </div>

          {/* HEALTH SCORE */}
          <div className="flex items-center justify-between gap-4 rounded-[10px] bg-tracker-dark px-6 py-[18px]">
            <div>
              <div
                className={cn(
                  LABEL_CLASS,
                  "mb-[7px] tracking-[0.15em] text-white/28"
                )}
              >
                Salud Comercial General
              </div>
              <div className="max-w-[380px] text-sm leading-[1.5] font-medium text-white/58">
                {ai.status}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className="text-[54px] leading-none font-black tracking-[-0.04em]"
                style={{ color: healthColor(ai.health) }}
              >
                {ai.health}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/22">
                / 100
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /body */}
    </div>
  )
}
