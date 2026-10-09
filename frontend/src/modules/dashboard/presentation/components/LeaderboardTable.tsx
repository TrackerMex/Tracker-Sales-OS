import type { ColumnDef } from "@tanstack/react-table"
import type { LeaderboardEntry } from "../../domain/dashboard.types"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { BarChartIcon } from "@/shared/components/Icon"
import type { StatusTone } from "@/shared/lib/status"
import { cn } from "@/lib/utils"

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  isLoading: boolean
}

// Podium: gold, silver, bronze.
const RANK_TONE: Record<number, StatusTone> = {
  1: "pending",
  2: "neutral",
  3: "progress",
}

function formatDelta(delta: number): { label: string; className: string } {
  if (delta > 0)
    return {
      label: `+${delta.toLocaleString("es-MX")}`,
      className: "text-status-success",
    }
  if (delta < 0)
    return {
      label: delta.toLocaleString("es-MX"),
      className: "text-status-danger",
    }
  return { label: "0", className: "text-muted-foreground" }
}

const columns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "rank",
    header: "#",
    meta: { className: "w-14" },
    cell: ({ row }) => {
      const { rank } = row.original
      const tone = RANK_TONE[rank]
      return tone ? (
        <StatusBadge tone={tone} className="min-w-6 font-medium">
          {rank}
        </StatusBadge>
      ) : (
        <span className="text-muted-foreground">{rank}</span>
      )
    },
  },
  {
    accessorKey: "sellerName",
    header: "Vendedor",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.sellerName}
      </span>
    ),
  },
  {
    accessorKey: "monthlyPoints",
    header: "Puntos mes",
    meta: { className: "text-right" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.monthlyPoints.toLocaleString("es-MX")}
      </span>
    ),
  },
  {
    accessorKey: "pointsDelta",
    header: "Delta",
    meta: { className: "text-right" },
    cell: ({ row }) => {
      const delta = formatDelta(row.original.pointsDelta)
      return (
        <span className={cn("font-medium", delta.className)}>
          {delta.label}
        </span>
      )
    },
  },
  {
    accessorKey: "streakDays",
    header: "Racha",
    meta: { className: "text-right" },
    cell: ({ row }) =>
      row.original.streakDays > 0 ? (
        <StatusBadge tone="success">{row.original.streakDays} d</StatusBadge>
      ) : (
        <span className="text-muted-foreground">0 d</span>
      ),
  },
]

export function LeaderboardTable({
  entries,
  isLoading,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-3 p-4"
        role="status"
        aria-label="Cargando leaderboard"
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState icon={<BarChartIcon size={20} />} title="Sin datos del mes" />
    )
  }

  return (
    <DataTable columns={columns} data={entries} getRowId={(e) => e.sellerId} />
  )
}
