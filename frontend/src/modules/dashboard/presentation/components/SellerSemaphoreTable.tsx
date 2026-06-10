import { useNavigate } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="space-y-4 p-5" role="status" aria-label="Cargando desempeño del equipo">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100" style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
        ))}
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="p-5">
        <p className="text-sm text-slate-500">
          No hay vendedores activos en este momento.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Los vendedores aparecerán aquí una vez que tengan actividad registrada.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      {sellers.map((seller) => (
        <div
          key={seller.sellerId}
          className="seller-row"
          role="article"
          aria-label={`${seller.sellerName}: puntuación ${seller.score}, ${seller.overdueCount > 0 ? seller.overdueCount + ' seguimientos vencidos' : 'sin seguimientos vencidos'}`}
          onClick={() => navigate({ to: '/coaching' })}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}
              className="truncate"
              title={seller.sellerName}
            >
              {seller.sellerName}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0 ${getBadgeStyle(seller.score)}`}
              aria-label={`Puntuación ${seller.score} de 100`}
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
              role="progressbar"
              aria-valuenow={seller.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso: ${seller.score}%`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: '#94A3B8' }}>
            <span className="flex-shrink-0">{seller.pointsToday} pts hoy</span>
            <span className="flex-shrink-0">{seller.avgQualityToday}% calidad</span>
            <span className="flex-shrink-0">{seller.monthlyPoints} pts mes</span>
            {seller.overdueCount > 0 && (
              <span
                style={{ fontWeight: 600, color: '#EF4444' }}
                className="flex-shrink-0"
                role="status"
              >
                {seller.overdueCount} {seller.overdueCount === 1 ? 'vencida' : 'vencidas'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
