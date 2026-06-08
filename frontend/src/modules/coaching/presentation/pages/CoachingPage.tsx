import { useState } from "react"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCoachingDaily } from "../../application/hooks/useCoachingDaily"
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

interface SellerCoachingCardProps {
  seller: EquipoSeller
  minDaily: number
}

function SellerCoachingCard({ seller, minDaily }: SellerCoachingCardProps) {
  const { data, isLoading } = useCoachingDaily(seller.id)

  if (isLoading) {
    return (
      <div className="card p-5">
        <p style={{ fontSize: 12, color: "#94A3B8" }}>Cargando...</p>
      </div>
    )
  }

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
  const recommendedAction = getRecommendedAction(points, minDaily, overdue)

  return (
    <div className="card p-5">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>
            {seller.name}
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>
            {seller.profile ?? "Ejecutivo comercial"}
          </p>
        </div>
        <span
          className="tag"
          style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
        >
          {points}/{minDaily} pts
        </span>
      </div>

      {/* 4 main stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            {calls}
          </p>
          <p className="slabel">Llamadas</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            {meetings}
          </p>
          <p className="slabel">Reuniones</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            {proposals}
          </p>
          <p className="slabel">Propuestas</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            {closes}
          </p>
          <p className="slabel">Cierres</p>
        </div>
      </div>

      {/* 3 secondary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
          marginBottom: 12,
          borderTop: "1px solid #f1f5f9",
          paddingTop: 10,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: qualityColor }}>
            {quality}%
          </p>
          <p className="slabel">Calidad</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            {overdue}
          </p>
          <p className="slabel">Vencidos</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            {tomorrow}
          </p>
          <p className="slabel">Mañana</p>
        </div>
      </div>

      {/* Recommended action */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
        <p className="slabel" style={{ marginBottom: 4 }}>
          Acción recomendada
        </p>
        <p style={{ fontSize: 12, color: "#475569" }}>{recommendedAction}</p>
      </div>
    </div>
  )
}

export function CoachingPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role !== UserRole.Seller
  const [minDaily, setMinDaily] = useState(30)
  const [inputValue, setInputValue] = useState("30")

  const { data: sellers } = useSellers()

  const handleSave = () => {
    const val = parseInt(inputValue, 10)
    if (!isNaN(val) && val > 0) {
      setMinDaily(val)
    }
  }

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

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header card */}
      <div className="card p-6" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontWeight: 900,
                color: "#0F172A",
                fontSize: 20,
                marginBottom: 4,
              }}
            >
              Reporte diario de coaching
            </h2>
            <p style={{ fontSize: 13, color: "#64748B" }}>
              Termómetro exacto de actividad comercial por vendedor
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Mínimo diario
            </span>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="input"
              style={{ width: 64 }}
              min={1}
            />
            <button className="btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Seller cards grid */}
      {isAdmin ? (
        activeSellers.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
            }}
          >
            {activeSellers.map((seller) => (
              <SellerCoachingCard
                key={seller.id}
                seller={seller}
                minDaily={minDaily}
              />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#94A3B8" }}>
            No hay vendedores activos registrados.
          </p>
        )
      ) : (() => {
          const seller = currentSeller ?? sellerFallback
          if (!seller) return null
          return (
            <div style={{ maxWidth: 480 }}>
              <SellerCoachingCard seller={seller} minDaily={minDaily} />
            </div>
          )
        })()}
    </div>
  )
}
