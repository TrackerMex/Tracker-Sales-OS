import type { LeaderboardEntry } from '../../domain/dashboard.types';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

function rankBadgeVariant(rank: number): BadgeVariant | null {
  if (rank === 1) return 'amber';
  if (rank === 2) return 'gray';
  if (rank === 3) return 'navy';
  return null;
}

function formatDelta(delta: number): { label: string; color: string } {
  if (delta > 0) return { label: `+${delta.toLocaleString('es-MX')}`, color: 'var(--tracker-green)' };
  if (delta < 0) return { label: delta.toLocaleString('es-MX'), color: 'var(--tracker-danger)' };
  return { label: '0', color: 'var(--tracker-text-secondary)' };
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-5" role="status" aria-label="Cargando leaderboard">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-slate-100 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-5">
        <div className="empty-state">Sin datos del mes</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 56 }}>#</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Puntos mes</TableHead>
            <TableHead className="text-right">Delta</TableHead>
            <TableHead className="text-right">Racha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const delta = formatDelta(entry.pointsDelta);
            const badgeVariant = rankBadgeVariant(entry.rank);
            return (
              <TableRow key={entry.sellerId}>
                <TableCell>
                  {badgeVariant ? (
                    <Badge variant={badgeVariant}>{entry.rank}</Badge>
                  ) : (
                    <span className="font-semibold" style={{ color: 'var(--tracker-text-secondary)' }}>
                      {entry.rank}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-semibold" style={{ color: 'var(--tracker-blue)' }}>
                  {entry.sellerName}
                </TableCell>
                <TableCell className="text-right" style={{ color: 'var(--tracker-text-dim)' }}>
                  {entry.monthlyPoints.toLocaleString('es-MX')}
                </TableCell>
                <TableCell className="text-right font-semibold" style={{ color: delta.color }}>
                  {delta.label}
                </TableCell>
                <TableCell className="text-right">
                  {entry.streakDays > 0 ? (
                    <Badge variant="green">{entry.streakDays} d</Badge>
                  ) : (
                    <span style={{ color: 'var(--tracker-text-secondary)' }}>0 d</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
