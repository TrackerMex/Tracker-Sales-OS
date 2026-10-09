import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import {
  AlertCircleIcon,
  DocumentTextIcon,
  MoreHorizontalIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import { useMonthlyReport } from "../../application/hooks/useMonthlyReport"
import { useWinLoss } from "../../application/hooks/useWinLoss"
import type { SellerSalesReport } from "../../domain/reports.types"
import { ExecutiveSlide } from "../components/ExecutiveSlide"
import { buildAnalysis, money } from "../components/executive-slide.utils"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"

const STORAGE_KEY = "tracker-report-goals"

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw)
      return JSON.parse(raw) as {
        amount: number
        units: number
        perSeller: number
      }
  } catch {
    // Ignore malformed or unavailable persisted preferences and use defaults.
  }
  return null
}

export function ReportsPage() {
  const search = useSearch({ strict: false }) as {
    month?: string
    goalAmount?: number
    goalUnits?: number
    goalPerSeller?: number
  }

  const [month, setMonth] = useState<string>(search.month ?? currentMonth())
  const { data, isLoading, error, refetch, dataUpdatedAt } =
    useMonthlyReport(month)
  const { data: winLoss, isLoading: winLossLoading } = useWinLoss()

  const [goalAmount, setGoalAmount] = useState<number>(
    search.goalAmount ?? loadGoals()?.amount ?? 600000
  )
  const [goalUnits, setGoalUnits] = useState<number>(
    search.goalUnits ?? loadGoals()?.units ?? 150
  )
  const [goalPerSeller, setGoalPerSeller] = useState<number>(
    search.goalPerSeller ?? loadGoals()?.perSeller ?? 150000
  )
  const [savedMsg, setSavedMsg] = useState(false)
  const [copyMsg, setCopyMsg] = useState<"idle" | "ok" | "fail">("idle")
  const [shareLinkMsg, setShareLinkMsg] = useState<"idle" | "ok" | "fail">(
    "idle"
  )
  const updatedAt =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null

  function saveGoals() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        amount: goalAmount,
        units: goalUnits,
        perSeller: goalPerSeller,
      })
    )
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  function copyReportText() {
    if (!data) return
    const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller)
    const sellerSummary = data.sellers
      .map((r) => `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`)
      .join(" · ")
    const sourceSummary = data.bySource
      .slice(0, 5)
      .map((s) => `${s.source}: ${s.count} cuentas, ${money(s.amount)}`)
      .join(" · ")
    const lines = [
      `Meta vs Logro ${month}: Ventas globales: ${money(data.total.amount)} contra meta de ${money(goalAmount)} (${((data.total.amount / goalAmount) * 100).toFixed(2)}%). Unidades: ${data.total.units} contra meta de ${goalUnits} (${((data.total.units / goalUnits) * 100).toFixed(2)}%).`,
      `Dirección Comercial: ${data.direction.units} unidades por ${money(data.direction.amount)}.`,
      `ATC (Atención a Clientes): ${data.atc.existingUnits} unidades existentes por ${money(data.atc.existingAmount)}.`,
      `Equipo: ${sellerSummary || "Sin ventas del equipo."}.`,
      `Origen de cuentas: ${sourceSummary || "Sin datos."}.`,
      `Análisis IA: Salud comercial ${ai.health}/100 — ${ai.status}`,
    ]
    navigator.clipboard
      ?.writeText(lines.join("\n"))
      .then(() => {
        setCopyMsg("ok")
        setTimeout(() => setCopyMsg("idle"), 2000)
      })
      .catch(() => {
        setCopyMsg("fail")
        setTimeout(() => setCopyMsg("idle"), 3000)
      })
  }

  function shareLink() {
    const params = new URLSearchParams({
      month,
      goalAmount: String(goalAmount),
      goalUnits: String(goalUnits),
      goalPerSeller: String(goalPerSeller),
    })
    const url = `${window.location.origin}/lamina?${params.toString()}`
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setShareLinkMsg("ok")
        setTimeout(() => setShareLinkMsg("idle"), 2000)
      })
      .catch(() => {
        setShareLinkMsg("fail")
        setTimeout(() => setShareLinkMsg("idle"), 3000)
      })
  }

  const sellerColumns: ColumnDef<SellerSalesReport>[] = [
    {
      accessorKey: "sellerName",
      header: "Vendedor",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">
            {row.original.sellerName}
          </p>
          <p className="text-muted-foreground tabular-nums sm:hidden">
            {row.original.units} unidades · {money(row.original.amount)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "units",
      header: "Unidades",
      meta: { className: "hidden text-right sm:table-cell" },
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.units}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      meta: { className: "hidden text-right sm:table-cell" },
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-foreground tabular-nums">
          {money(row.original.amount)}
        </span>
      ),
    },
    {
      id: "metaPct",
      header: "% Meta",
      accessorFn: (r) =>
        goalPerSeller > 0 ? (r.amount / goalPerSeller) * 100 : 0,
      meta: { className: "text-right" },
      cell: ({ getValue }) => {
        const metaPct = getValue<number>()
        return (
          <StatusBadge tone={metaPct >= 100 ? "success" : "pending"}>
            {metaPct.toFixed(1)}%
          </StatusBadge>
        )
      },
    },
  ]

  function openLamina() {
    const node = document.getElementById("executive-slide")
    if (!node) {
      window.print()
      return
    }
    const win = window.open("", "_blank")
    if (!win) {
      window.print()
      return
    }
    // The slide is styled with Tailwind classes, so the popup needs the app
    // stylesheets to resolve them (<style> tags in dev, <link> assets in prod).
    const appStyles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((el) => el.outerHTML)
      .join("")
    win.document.write(
      `<html><head><title>Reporte Ejecutivo — Tracker Sales OS</title>` +
        `<link rel="preconnect" href="https://fonts.googleapis.com">` +
        `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">` +
        appStyles +
        `<style>
        body{font-family:'Montserrat','Inter',sans-serif;background:#EEF2F7;padding:32px;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        #executive-slide{max-width:1080px;margin:0 auto}
        @media print{body{background:#fff;padding:0}#executive-slide{border-radius:0!important;border:none!important;box-shadow:none!important}}
      </style>` +
        `</head><body>${node.outerHTML}` +
        `<p style="font-size:11px;color:#94A3B8;margin-top:16px;text-align:center;font-family:sans-serif">Tip: imprime como PDF (Ctrl+P) para compartir o pegar en PowerPoint.</p>` +
        `</body></html>`
    )
    win.document.close()
  }

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Informe ejecutivo mensual"
        actions={
          <>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Acciones del informe"
                    >
                      <MoreHorizontalIcon size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Acciones del informe</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onSelect={saveGoals}>
                  {savedMsg ? "Guardado" : "Guardar metas"}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!data} onSelect={copyReportText}>
                  {copyMsg === "ok"
                    ? "Copiado"
                    : copyMsg === "fail"
                      ? "Error al copiar"
                      : "Copiar informe"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={shareLink}>
                  {shareLinkMsg === "ok"
                    ? "Enlace copiado"
                    : shareLinkMsg === "fail"
                      ? "Error al copiar"
                      : "Compartir informe"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={openLamina}>
              <DocumentTextIcon size={16} />
              Abrir lámina
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <section
          className="col-span-12 bg-background"
          aria-labelledby="report-params-title"
        >
          <div className="border-b p-4 md:p-6">
            <h2 id="report-params-title" className="text-base font-semibold">
              Periodo y metas
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Separado por Dirección Comercial, ATC y Equipo de Vendedores.
            </p>
          </div>
          <div className="grid gap-6 p-4 sm:grid-cols-2 md:p-6 xl:grid-cols-4">
            <div>
              <Label htmlFor="report-month">Mes</Label>
              <Input
                id="report-month"
                type="month"
                className="mt-2"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="report-goal-amount">Meta $ equipo</Label>
              <Input
                id="report-goal-amount"
                type="number"
                className="mt-2"
                min={1}
                value={goalAmount || ""}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="report-goal-units">Meta unidades</Label>
              <Input
                id="report-goal-units"
                type="number"
                className="mt-2"
                min={1}
                value={goalUnits || ""}
                onChange={(e) => setGoalUnits(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="report-goal-per-seller">Meta $ x vendedor</Label>
              <Input
                id="report-goal-per-seller"
                type="number"
                className="mt-2"
                min={1}
                value={goalPerSeller || ""}
                onChange={(e) => setGoalPerSeller(Number(e.target.value))}
              />
            </div>
          </div>
        </section>
      </div>

      {isLoading && (
        <div className="mt-4" role="status" aria-label="Cargando reporte">
          <Skeleton className="h-96 w-full" />
        </div>
      )}
      {error && (
        <div className="mt-4 border border-border bg-background">
          <EmptyState
            icon={<AlertCircleIcon size={20} />}
            title="Error al cargar el reporte."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          />
        </div>
      )}

      {data &&
        (() => {
          const ai = buildAnalysis(data, goalAmount, goalUnits, goalPerSeller)
          const hasSellers = data.sellers.length > 0

          return (
            <>
              <div className="mt-4">
                <ExecutiveSlide
                  data={data}
                  winLoss={winLoss}
                  winLossLoading={winLossLoading}
                  goalAmount={goalAmount}
                  goalUnits={goalUnits}
                  goalPerSeller={goalPerSeller}
                  month={month}
                  updatedAt={updatedAt}
                />
              </div>

              <div className="mt-4 grid grid-cols-12 gap-px bg-border p-px">
                {hasSellers && (
                  <SectionCard
                    title="Detalle top vendedores"
                    icon={<UsersIcon size={16} />}
                    className="xl:col-span-6"
                  >
                    <DataTable
                      columns={sellerColumns}
                      data={data.sellers}
                      getRowId={(r) => r.sellerId}
                    />
                  </SectionCard>
                )}

                <div
                  id="executive-report-text"
                  className={cn(
                    "col-span-12 bg-background",
                    hasSellers && "xl:col-span-6"
                  )}
                >
                  <SectionCard
                    title="Resumen para Dirección"
                    icon={<DocumentTextIcon size={16} />}
                  >
                    <p className="p-4 text-sm/relaxed text-muted-foreground">
                      <b className="font-semibold text-foreground">
                        Meta vs Logro {month}:
                      </b>{" "}
                      Ventas globales: {money(data.total.amount)} contra meta de{" "}
                      {money(goalAmount)} (
                      {((data.total.amount / goalAmount) * 100).toFixed(2)}%).
                      Unidades: {data.total.units} contra meta de {goalUnits} (
                      {((data.total.units / goalUnits) * 100).toFixed(2)}%).
                      <br />
                      <br />
                      <b className="font-semibold text-foreground">
                        Dirección Comercial:
                      </b>{" "}
                      {data.direction.units} unidades por{" "}
                      {money(data.direction.amount)}.
                      <br />
                      <b className="font-semibold text-foreground">ATC:</b>{" "}
                      {data.atc.existingUnits} unidades existentes por{" "}
                      {money(data.atc.existingAmount)}.
                      {hasSellers && (
                        <>
                          <br />
                          <b className="font-semibold text-foreground">
                            Equipo:
                          </b>{" "}
                          {data.sellers
                            .slice(0, 5)
                            .map(
                              (r) =>
                                `${r.sellerName}: ${r.units} unidades, ${money(r.amount)}`
                            )
                            .join(" · ")}
                          .
                        </>
                      )}
                      {data.bySource.length > 0 && (
                        <>
                          <br />
                          <b className="font-semibold text-foreground">
                            Origen de cuentas:
                          </b>{" "}
                          {data.bySource
                            .slice(0, 5)
                            .map(
                              (s) =>
                                `${s.source}: ${s.count} cuentas, ${money(s.amount)}`
                            )
                            .join(" · ")}
                          .
                        </>
                      )}
                      <br />
                      <b className="font-semibold text-foreground">
                        Análisis IA:
                      </b>{" "}
                      Salud comercial {ai.health}/100 — {ai.status}
                    </p>
                  </SectionCard>
                </div>
              </div>
            </>
          )
        })()}
    </div>
  )
}
