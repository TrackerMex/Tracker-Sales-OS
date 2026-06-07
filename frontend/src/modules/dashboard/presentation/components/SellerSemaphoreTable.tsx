import type { SellerScore } from '../../domain/dashboard.types';

interface SellerSemaphoreTableProps {
  sellers: SellerScore[];
  isLoading: boolean;
}

const SEMAPHORE_CLASSES: Record<SellerScore['semaphore'], string> = {
  verde: 'bg-green-100 text-green-700',
  ambar: 'bg-amber-100 text-amber-700',
  rojo: 'bg-red-100 text-red-700',
};

const SEMAPHORE_BAR_CLASSES: Record<SellerScore['semaphore'], string> = {
  verde: 'bg-green-500',
  ambar: 'bg-amber-400',
  rojo: 'bg-red-500',
};

export function SellerSemaphoreTable({ sellers, isLoading }: SellerSemaphoreTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>
    );
  }

  if (sellers.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No hay vendedores activos.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Vendedor</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Semaforo</th>
            <th className="px-4 py-3">Puntos hoy</th>
            <th className="px-4 py-3">Calidad</th>
            <th className="px-4 py-3">Vencidas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sellers.map((seller) => (
            <tr key={seller.sellerId} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{seller.sellerName}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${SEMAPHORE_BAR_CLASSES[seller.semaphore]}`}
                      style={{ width: `${seller.score}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-700">{seller.score}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${SEMAPHORE_CLASSES[seller.semaphore]}`}
                >
                  {seller.semaphore}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{seller.pointsToday}</td>
              <td className="px-4 py-3 text-slate-700">{seller.avgQualityToday}%</td>
              <td className="px-4 py-3">
                {seller.overdueCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {seller.overdueCount}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
