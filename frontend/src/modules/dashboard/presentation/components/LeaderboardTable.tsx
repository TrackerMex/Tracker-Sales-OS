import type { LeaderboardEntry } from '../../domain/dashboard.types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'tag tag-amber';
  if (rank === 2) return 'tag tag-gray';
  if (rank === 3) return 'tag tag-navy';
  return '';
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
      <table className="dt">
        <thead>
          <tr>
            <th style={{ width: 56 }}>#</th>
            <th>Vendedor</th>
            <th className="text-right">Puntos mes</th>
            <th className="text-right">Delta</th>
            <th className="text-right">Racha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const delta = formatDelta(entry.pointsDelta);
            const badgeClass = rankBadgeClass(entry.rank);
            return (
              <tr key={entry.sellerId}>
                <td>
                  {badgeClass ? (
                    <span className={badgeClass}>{entry.rank}</span>
                  ) : (
                    <span className="font-semibold" style={{ color: 'var(--tracker-text-secondary)' }}>
                      {entry.rank}
                    </span>
                  )}
                </td>
                <td className="font-semibold" style={{ color: 'var(--tracker-blue)' }}>
                  {entry.sellerName}
                </td>
                <td className="text-right" style={{ color: 'var(--tracker-text-dim)' }}>
                  {entry.monthlyPoints.toLocaleString('es-MX')}
                </td>
                <td className="text-right font-semibold" style={{ color: delta.color }}>
                  {delta.label}
                </td>
                <td className="text-right">
                  {entry.streakDays > 0 ? (
                    <span className="tag tag-green">{entry.streakDays} d</span>
                  ) : (
                    <span style={{ color: 'var(--tracker-text-secondary)' }}>0 d</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
