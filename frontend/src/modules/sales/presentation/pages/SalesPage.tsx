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

const SALE_TYPE_TAG: Record<string, string> = {
  seller: 'tag tag-navy',
  atc: 'tag tag-amber',
  direction: 'tag tag-purple',
};

const CLIENT_TYPE_TAG: Record<string, string> = {
  Nuevo: 'tag tag-navy',
  Existente: 'tag tag-gray',
};

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
    <div className="space-y-5">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Ventas</h1>
        <p style={{ marginTop: 2, fontSize: 12, color: '#94A3B8' }}>Registro de cierres por tipo</p>
      </div>

      {successMessage && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ background: '#EEFAD4', border: '1px solid #82bc00', fontSize: 13, fontWeight: 500, color: '#4a7c00' }}
        >
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-[#E2E8F0]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '11px 20px',
                fontSize: 13,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid #002B49' : '2px solid transparent',
                color: activeTab === tab.key ? '#002B49' : '#94A3B8',
                transition: 'color 0.12s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          <SaleFormBase
            key={activeTab}
            type={activeTab}
            sellerId={sellerId}
            onSubmit={handleSubmit}
            isLoading={createSale.isPending}
          />
          {createSale.isError && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#EF4444' }}>
              {createSale.error instanceof Error ? createSale.error.message : 'No se pudo registrar la venta'}
            </p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="kpi-strip">
          <div className="kpi-cell">
            <div className="kl">Total ventas</div>
            <div className="kv">{summary.total}</div>
          </div>
          <div className="kpi-cell">
            <div className="kl">Unidades</div>
            <div className="kv">{summary.totalUnits}</div>
          </div>
          <div className="kpi-cell">
            <div className="kl">Monto total</div>
            <div className="kv" style={{ fontSize: 18, color: '#82bc00' }}>{formatCurrency(summary.totalAmount)}</div>
          </div>
          <div className="kpi-cell">
            <div className="kl">Nuevos / Existentes</div>
            <div className="kv">{summary.unitsByClientType.Nuevo} / {summary.unitsByClientType.Existente}</div>
            <div className="ksb">unidades</div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="border-b border-[#E2E8F0] px-5 py-3">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#002B49' }}>Historial de ventas</h3>
        </div>
        {loadingList && (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        )}
        {isError && <p className="p-5" style={{ fontSize: 13, color: '#EF4444' }}>No se pudo cargar el historial.</p>}
        {!loadingList && !isError && data?.data.length === 0 && (
          <p className="p-5" style={{ fontSize: 13, color: '#94A3B8' }}>No hay ventas registradas.</p>
        )}
        {!loadingList && !isError && data && data.data.length > 0 && (
          <table className="dt">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th className="text-right">Unidades</th>
                <th>Tipo cliente</th>
                <th>Tipo venta</th>
                <th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{sale.clientName}</td>
                  <td style={{ color: '#64748B' }}>{sale.product}</td>
                  <td className="text-right">{sale.units}</td>
                  <td><span className={CLIENT_TYPE_TAG[sale.clientType] ?? 'tag tag-gray'}>{sale.clientType}</span></td>
                  <td><span className={SALE_TYPE_TAG[sale.type] ?? 'tag tag-gray'}>{sale.type}</span></td>
                  <td className="text-right" style={{ fontWeight: 700, color: '#82bc00' }}>{formatCurrency(sale.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
