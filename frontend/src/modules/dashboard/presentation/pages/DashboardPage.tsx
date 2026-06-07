import { useDashboardSummary } from '../../application/hooks/useDashboardSummary';
import { useSellersSemaphore } from '../../application/hooks/useSellersSemaphore';
import { useOverdueTasks } from '../../application/hooks/useOverdueTasks';
import { KPICard } from '../components/KPICard';
import { SellerSemaphoreTable } from '../components/SellerSemaphoreTable';
import { OverdueTasksList } from '../components/OverdueTasksList';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function DashboardPage() {
  const summary = useDashboardSummary();
  const sellers = useSellersSemaphore();
  const overdue = useOverdueTasks();

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-black text-[#002B49]">Dashboard</h2>

      {summary.isError && (
        <p className="text-sm text-red-600">No se pudo cargar el resumen del mes.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard
          title="Ventas del mes"
          value={summary.isLoading ? '...' : formatCurrency(summary.data?.totalSalesAmount ?? 0)}
          subtitle={`${summary.data?.totalSalesCount ?? 0} cierres`}
          color="#82bc00"
        />
        <KPICard
          title="Unidades"
          value={summary.isLoading ? '...' : (summary.data?.totalUnits ?? 0)}
        />
        <KPICard
          title="Puntos totales"
          value={summary.isLoading ? '...' : (summary.data?.totalPoints ?? 0)}
          color="#00A8E8"
        />
        <KPICard
          title="Calidad promedio"
          value={summary.isLoading ? '...' : `${summary.data?.avgQuality?.toFixed(1) ?? 0}%`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#002B49]">Semaforo Comercial</h3>
        </div>
        <SellerSemaphoreTable
          sellers={sellers.data ?? []}
          isLoading={sellers.isLoading}
        />
        {sellers.isError && (
          <p className="px-4 pb-4 text-sm text-red-600">No se pudo cargar el semaforo.</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#002B49]">Seguimientos Vencidos</h3>
        </div>
        <OverdueTasksList
          tasks={overdue.data ?? []}
          isLoading={overdue.isLoading}
        />
        {overdue.isError && (
          <p className="px-4 pb-4 text-sm text-red-600">No se pudo cargar los seguimientos.</p>
        )}
      </div>
    </div>
  );
}
