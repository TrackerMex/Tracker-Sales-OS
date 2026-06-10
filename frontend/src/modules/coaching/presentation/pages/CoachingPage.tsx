import { useState } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCoachingDaily } from "../../application/hooks/useCoachingDaily"
import { useSettings } from "@/modules/settings/application/hooks/useSettings"
import type { EquipoSeller } from "@/modules/equipo/domain/equipo.types"
import type { ActivityMixItem } from "../../domain/coaching.types"

function getActivityCount(mix: ActivityMixItem[], types: string[]): number {
  return mix
    .filter((m) => types.includes(m.type))
    .reduce((sum, m) => sum + m.count, 0)
}

function getRecommendedAction(
  points: number,
  minDaily: number,
  overdueCount: number
): string {
  if (points < minDaily) return `Alcanzar mínimo de ${minDaily} puntos`
  if (overdueCount > 0) return `Atender ${overdueCount} seguimientos vencidos`
  return "Mantener ritmo de actividad"
}

interface StatCellProps {
  value: string | number
  label: string
  valueClassName?: string
  valueColor?: string
  children?: React.ReactNode
}

function StatCell({ value, label, valueClassName, valueColor, children }: StatCellProps) {
  return (
    <div className="bg-[#F8FAFC] rounded-[7px] px-2 py-[6px] text-center">
      <p
        className={valueClassName ?? "text-[22px] font-bold text-[#0F172A]"}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {children}
      <p className="slabel">{label}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse motion-reduce:animate-none">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
        <div className="h-5 w-16 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 rounded-[7px] h-14" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 border-t border-slate-100 pt-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-slate-100 rounded-[7px] h-12" />
        ))}
      </div>
      <div className="border-t border-slate-100 pt-2.5 space-y-2">
        <div className="h-3 w-28 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded-lg" />
      </div>
    </div>
  )
}

interface SellerCoachingCardProps {
  seller: EquipoSeller
  minDaily: number
}

function SellerCoachingCard({ seller, minDaily }: SellerCoachingCardProps) {
  const { data, isLoading } = useCoachingDaily(seller.id)

  if (isLoading) return <SkeletonCard />

  const mix: ActivityMixItem[] = data?.activityMix ?? []
  const calls = getActivityCount(mix, ["Llamada"])
  const meetings = getActivityCount(mix, [
    "Reunión virtual",
    "Reunión presencial",
    "Visita física",
  ])
  const proposals = getActivityCount(mix, ["Propuesta"])
  const closes = getActivityCount(mix, ["Cierre"])
  const points = data?.pointsToday ?? 0
  const quality = data?.avgQuality ?? 0
  const overdue = data?.overdueCount ?? 0
  const tomorrow = data?.tomorrowTasksCount ?? 0

  const qualityColor =
    quality >= 80 ? "#16a34a" : quality >= 50 ? "#d97706" : "#dc2626"
  const qualityBarColor =
    quality >= 75 ? "#82bc00" : quality >= 45 ? "#F59E0B" : "#EF4444"
  const recommendedAction = getRecommendedAction(points, minDaily, overdue)
  const meetsMinimum = points >= minDaily

  return (
    <div className="card p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-bold text-[#0F172A] text-[15px]">{seller.name}</p>
          <p className="text-[12px] text-[#94A3B8]">
            {seller.profile ?? "Ejecutivo comercial"}
          </p>
        </div>
        <span className={`tag ${meetsMinimum ? "tag-green" : "tag-red"}`}>
          {points}/{minDaily} pts
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <StatCell value={calls} label="Llamadas" />
        <StatCell value={meetings} label="Reuniones" />
        <StatCell value={proposals} label="Propuestas" />
        <StatCell value={closes} label="Cierres" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 border-t border-slate-100 pt-2.5">
        <StatCell
          value={`${quality}%`}
          label="Calidad"
          valueClassName="text-[18px] font-bold"
          valueColor={qualityColor}
        >
          <div className="prog mt-1">
            <div
              className="prog-fill"
              style={{ width: `${quality}%`, background: qualityBarColor }}
            />
          </div>
        </StatCell>
        <StatCell
          value={overdue}
          label="Vencidos"
          valueClassName={`text-[18px] font-bold ${overdue > 0 ? "text-red-600" : "text-[#0F172A]"}`}
        />
        <StatCell
          value={tomorrow}
          label="Mañana"
          valueClassName={`text-[18px] font-bold ${tomorrow > 0 ? "text-[#002B49]" : "text-[#0F172A]"}`}
        />
      </div>

      <div className="border-t border-slate-100 pt-2.5">
        <p className="slabel mb-1">Acción recomendada</p>
        <div className="ai-box">{recommendedAction}</div>
      </div>
    </div>
  )
}

export function CoachingPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role !== UserRole.Seller

  const { data: settingsData } = useSettings()
  const minDaily = settingsData?.dailyMinPoints ?? 30

  const { data: sellers } = useSellers()

  const currentSellerId = currentUser?.sellerId
  const currentSeller = sellers?.find((s) => s.id === currentSellerId)

  const sellerFallback: EquipoSeller | null = currentSellerId
    ? {
        id: currentSellerId,
        name: currentUser?.name ?? "",
        profile: null,
        userId: currentUser?.id ?? null,
        active: true,
        createdAt: "",
      }
    : null

  const activeSellers = sellers?.filter((s) => s.active) ?? []
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const displayedSellers = selectedSellerId
    ? activeSellers.filter((s) => s.id === selectedSellerId)
    : activeSellers

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="font-black text-[20px] text-[#0F172A] mb-1">
              Reporte diario de coaching
            </h2>
            <p className="text-[13px] text-[#64748B]">
              Termómetro exacto de actividad comercial por vendedor
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="slabel">Mínimo diario</span>
            <span className="text-[18px] font-black text-[#002B49]">
              {minDaily} pts
            </span>
          </div>
        </div>
      </div>

      {isAdmin ? (
        activeSellers.length > 0 ? (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-[12px] font-semibold text-[#64748B]">
                Vendedor:
              </span>
              <select
                className="input"
                style={{ width: 220 }}
                value={selectedSellerId ?? ""}
                onChange={(e) => setSelectedSellerId(e.target.value || null)}
              >
                <option value="">Todos los vendedores</option>
                {activeSellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={
                displayedSellers.length === 1
                  ? "grid grid-cols-1 max-w-[480px]"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              }
            >
              {displayedSellers.map((seller) => (
                <SellerCoachingCard
                  key={seller.id}
                  seller={seller}
                  minDaily={minDaily}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-[14px] font-semibold text-[#0F172A] mb-1">
              Sin vendedores activos
            </p>
            <p className="text-[12px] text-[#94A3B8]">
              Registra vendedores en la sección Equipo para ver el reporte.
            </p>
          </div>
        )
      ) : (() => {
          const seller = currentSeller ?? sellerFallback
          if (!seller) return null
          return (
            <div className="max-w-[480px]">
              <SellerCoachingCard seller={seller} minDaily={minDaily} />
            </div>
          )
        })()}
    </div>
  )
}
