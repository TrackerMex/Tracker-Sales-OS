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
  if (delta > 0) return { label: `+${delta.toLocaleString('es-MX')}`, color: '#82bc00' };
  if (delta < 0) return { label: delta.toLocaleString('es-MX'), color: '#EF4444' };
  return { label: '0', color: '#94A3B8' };
}

export function LeaderboardTable({ entries, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-5" role="status" aria-label="Cargando leaderboard">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-slate-100"
            style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-5">
        <p className="text-sm text-slate-500">Sin datos del mes</p>
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
            <th style={{ textAlign: 'right' }}>Puntos mes</th>
            <th style={{ textAlign: 'right' }}>Delta</th>
            <th style={{ textAlign: 'right' }}>Racha</th>
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
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>{entry.rank}</span>
                  )}
                </td>
                <td style={{ color: '#002B49', fontWeight: 600 }}>{entry.sellerName}</td>
                <td style={{ textAlign: 'right', color: '#475569' }}>
                  {entry.monthlyPoints.toLocaleString('es-MX')}
                </td>
                <td style={{ textAlign: 'right', color: delta.color, fontWeight: 600 }}>
                  {delta.label}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {entry.streakDays > 0 ? (
                    <span className="tag tag-green">{entry.streakDays} d</span>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>0 d</span>
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
