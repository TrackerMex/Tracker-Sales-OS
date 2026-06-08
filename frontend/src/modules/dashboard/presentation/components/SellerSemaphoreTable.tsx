import type { SellerScore } from '../../domain/dashboard.types';

interface SellerSemaphoreTableProps {
  sellers: SellerScore[];
  isLoading: boolean;
}

function getBarColor(score: number): string {
  if (score >= 75) return '#82bc00';
  if (score >= 45) return '#F59E0B';
  return '#EF4444';
}

function getBadgeStyle(score: number): string {
  if (score >= 75) return 'bg-[#82bc00]/10 text-[#82bc00]';
  if (score >= 45) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-600';
}

export function SellerSemaphoreTable({ sellers, isLoading }: SellerSemaphoreTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (sellers.length === 0) {
    return <p className="p-5 text-sm text-slate-500">No hay vendedores activos.</p>;
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      {sellers.map((seller) => (
        <div key={seller.sellerId} className="seller-row">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
              {seller.sellerName}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getBadgeStyle(seller.score)}`}
            >
              {seller.score}
            </span>
          </div>
          <div className="prog mt-2">
            <div
              className="prog-fill"
              style={{
                width: `${Math.min(seller.score, 100)}%`,
                backgroundColor: getBarColor(seller.score),
              }}
            />
          </div>
          <div className="mt-2 flex items-center gap-4" style={{ fontSize: 11, color: '#94A3B8' }}>
            <span>{seller.pointsToday} pts hoy</span>
            <span>{seller.avgQualityToday}% calidad</span>
            <span>{seller.monthlyPoints} pts mes</span>
            {seller.overdueCount > 0 && (
              <span style={{ fontWeight: 600, color: '#EF4444' }}>
                {seller.overdueCount} vencidas
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
