import { useState } from 'react';
import { useAppStore } from '@/shared/store/app.store';
import { useCreateSale } from '../../application/hooks/useCreateSale';
import { useSales } from '../../application/hooks/useSales';
import { SaleFormBase } from '../components/SaleFormBase';
import type { SaleType, CreateSaleInput } from '../../domain/sales.types';

type Tab = SaleType;

const TABS: { key: Tab; label: string }[] = [
  { key: 'seller', label: 'Vendedor' },
  { key: 'atc', label: 'ATC' },
  { key: 'direction', label: 'Dirección' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function SalesPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('seller');
  const [successMessage, setSuccessMessage] = useState('');

  const createSale = useCreateSale();
  const { data, isLoading: loadingList, isError } = useSales({});

  function handleSubmit(input: CreateSaleInput) {
    createSale.mutate(input, {
      onSuccess: () => {
        setSuccessMessage('Venta registrada correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      },
    });
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-black text-[#002B49]">Ventas</h2>
        <p className="mt-1 text-sm text-slate-500">Registro de cierres por tipo</p>
      </div>

      {successMessage && (
        <div className="rounded-md border border-[#82bc00] bg-[#82bc00]/10 px-4 py-3 text-sm font-medium text-[#5a8500]">
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#002B49] text-[#002B49]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          <SaleFormBase
            key={activeTab}
            type={activeTab}
            sellerId={sellerId}
            onSubmit={handleSubmit}
            isLoading={createSale.isPending}
          />
          {createSale.isError && (
            <p className="mt-2 text-sm text-red-600">
              {createSale.error instanceof Error
                ? createSale.error.message
                : 'No se pudo registrar la venta'}
            </p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total ventas</p>
            <p className="mt-1 text-2xl font-black text-[#002B49]">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unidades</p>
            <p className="mt-1 text-2xl font-black text-[#002B49]">{summary.totalUnits}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Monto total</p>
            <p className="mt-1 text-lg font-black text-[#82bc00]">{formatCurrency(summary.totalAmount)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nuevos / Existentes</p>
            <p className="mt-1 text-base font-bold text-[#002B49]">
              {summary.unitsByClientType.Nuevo} / {summary.unitsByClientType.Existente}
            </p>
            <p className="text-xs text-slate-400">unidades</p>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-[#002B49]">Historial de ventas</h3>
        </div>
        {loadingList && (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        )}
        {isError && (
          <p className="p-6 text-sm text-red-600">No se pudo cargar el historial.</p>
        )}
        {!loadingList && !isError && data && data.data.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No hay ventas registradas.</p>
        )}
        {!loadingList && !isError && data && data.data.length > 0 && (
          <div className="divide-y divide-slate-100">
            {data.data.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{sale.clientName}</p>
                  <p className="text-xs text-slate-500">
                    {sale.product} · {sale.units} ud. · {sale.date}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sale.clientType === 'Nuevo'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sale.clientType}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sale.type === 'seller'
                        ? 'bg-[#002B49]/10 text-[#002B49]'
                        : sale.type === 'atc'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {sale.type}
                  </span>
                  <span className="text-sm font-bold text-[#82bc00]">
                    {formatCurrency(sale.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
