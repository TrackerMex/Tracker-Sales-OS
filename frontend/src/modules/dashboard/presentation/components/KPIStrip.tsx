import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/shared/components/data/StatCard"
import {
  BarChartIcon,
  CheckCircleIcon,
  DollarIcon,
  KanbanIcon,
  PulseIcon,
} from "@/shared/components/Icon"

interface KPIStripProps {
  salesValue: string
  salesCount: number
  unitsValue: number
  unitsGoal: number
  pointsValue: number
  qualityValue: number
  forecastValue: string
  forecastSubtitle: string
  isLoading: boolean
}

// Bento cells: render as direct children of the dashboard bento grid.
// 3 + 2 per row on xl, 2 per row on md, stacked on mobile.
const TOP = "col-span-12 md:col-span-6 xl:col-span-4"

export function KPIStrip({
  salesValue,
  salesCount,
  unitsValue,
  unitsGoal,
  pointsValue,
  qualityValue,
  forecastValue,
  forecastSubtitle,
  isLoading,
}: KPIStripProps) {
  const show = (value: string) =>
    isLoading ? <Skeleton className="h-8 w-28" /> : value

  return (
    <>
      <div className={TOP}>
        <StatCard
          label="Venta del mes"
          value={show(salesValue)}
          icon={<DollarIcon size={16} />}
          description={isLoading ? undefined : `${salesCount} cierres este mes`}
        />
      </div>
      <div className={TOP}>
        <StatCard
          label="Unidades"
          value={show(`${unitsValue} / ${unitsGoal}`)}
          icon={<BarChartIcon size={16} />}
          description="meta mensual"
        />
      </div>
      <div className={TOP}>
        <StatCard
          label="Puntos totales"
          hint="Actividad acumulada: llamadas, emails y reuniones registradas por el equipo este mes"
          value={show(pointsValue.toLocaleString("es-MX"))}
          icon={<PulseIcon size={16} />}
          description="acumulados mes"
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <StatCard
          label="Calidad promedio"
          hint="% de seguimientos completados a tiempo. Mayor % = mejor cumplimiento"
          value={show(`${qualityValue.toFixed(1)}%`)}
          icon={<CheckCircleIcon size={16} />}
          description="promedio del equipo"
        />
      </div>
      <div className="col-span-12 xl:col-span-6">
        <StatCard
          label="Forecast del mes"
          hint="Forecast ponderado del pipeline: suma de cada deal por su probabilidad de cierre, excluyendo Perdido"
          value={show(forecastValue)}
          icon={<KanbanIcon size={16} />}
          description={isLoading ? undefined : forecastSubtitle}
        />
      </div>
    </>
  )
}
