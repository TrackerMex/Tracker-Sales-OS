import { useNavigate } from '@tanstack/react-router';
import type { SellerScore } from '../../domain/dashboard.types';

interface SellerSemaphoreTableProps {
  sellers: SellerScore[];
  isLoading: boolean;
}

function getBarColor(score: number): string {
  if (score >= 75) return 'var(--tracker-green)';
  if (score >= 45) return 'var(--tracker-warning)';
  return 'var(--tracker-danger)';
}

function getSemaphoreTag(score: number): string {
  if (score >= 75) return 'tag tag-green';
  if (score >= 45) return 'tag tag-amber';
  return 'tag tag-red';
}

export function SellerSemaphoreTable({ sellers, isLoading }: SellerSemaphoreTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4 p-5" role="status" aria-label="Cargando desempeño del equipo">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-slate-100 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="p-5">
        <div className="empty-state">
          No hay vendedores activos. Los vendedores aparecerán aquí una vez que tengan actividad registrada.
        </div>
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
          onClick={() => void navigate({ to: '/coaching' })}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              className="truncate text-[13px] font-semibold"
              style={{ color: 'var(--tracker-text)' }}
              title={seller.sellerName}
            >
              {seller.sellerName}
            </span>
            <span
              className={`${getSemaphoreTag(seller.score)} flex-shrink-0`}
              aria-label={`Puntuación ${seller.score} de 100`}
            >
              {seller.score}
            </span>
          </div>
          <div className="prog mt-2">
            <div
              className="prog-fill"
              style={{ width: `${Math.min(seller.score, 100)}%`, backgroundColor: getBarColor(seller.score) }}
              role="progressbar"
              aria-valuenow={seller.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso: ${seller.score}%`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--tracker-text-muted)' }}>
            <span className="flex-shrink-0">{seller.pointsToday} pts hoy</span>
            <span className="flex-shrink-0">{seller.avgQualityToday}% calidad</span>
            <span className="flex-shrink-0">{seller.monthlyPoints} pts mes</span>
            {seller.overdueCount > 0 && (
              <span
                className="flex-shrink-0 font-semibold"
                style={{ color: 'var(--tracker-danger)' }}
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
