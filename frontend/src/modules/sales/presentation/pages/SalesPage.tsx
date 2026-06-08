import { useState, type FormEvent } from 'react';
import { useAppStore } from '@/shared/store/app.store';
import { useCreateSale } from '../../application/hooks/useCreateSale';
import { useSales } from '../../application/hooks/useSales';
import { useClients } from '../../../clients/application/hooks/useClients';
import type { CreateSaleInput, PaymentMethod, SaleSource } from '../../domain/sales.types';

const PAYMENT_METHODS: PaymentMethod[] = ['Pagado', 'Crédito', '50% anticipo', 'Pendiente'];
const SALE_SOURCES: SaleSource[] = [
  'Prospección propia',
  'Cliente existente',
  'Referido',
  'Expo',
  'Marketing',
  'LinkedIn',
  'Web',
  'Dirección Comercial',
];

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function SalesPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? '';

  // Seller form state
  const [sellerClientId, setSellerClientId] = useState('');
  const [sellerClientName, setSellerClientName] = useState('');
  const [sellerClientType, setSellerClientType] = useState<'Nuevo' | 'Existente'>('Existente');
  const [sellerProduct, setSellerProduct] = useState('');
  const [sellerUnits, setSellerUnits] = useState(1);
  const [sellerAmount, setSellerAmount] = useState(0);
  const [sellerDate, setSellerDate] = useState(today());
  const [sellerPay, setSellerPay] = useState<PaymentMethod>('Pagado');
  const [sellerSource, setSellerSource] = useState<SaleSource>('Cliente existente');
  const [sellerNotes, setSellerNotes] = useState('');

  // Direction form state
  const [dirProject, setDirProject] = useState('');
  const [dirUnits, setDirUnits] = useState(1);
  const [dirAmount, setDirAmount] = useState(0);
  const [dirDate, setDirDate] = useState(today());
  const [dirNotes, setDirNotes] = useState('');

  // ATC form state
  const [atcUnits, setAtcUnits] = useState(1);
  const [atcAmount, setAtcAmount] = useState(0);
  const [atcDate, setAtcDate] = useState(today());
  const [atcNotes, setAtcNotes] = useState('');

  const createSellerSale = useCreateSale();
  const createDirSale = useCreateSale();
  const createAtcSale = useCreateSale();

  const { data: clientsData } = useClients({ limit: 200 });
  const { data, isLoading: loadingList, isError } = useSales({});

  function handleSellerSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: sellerClientId,
      clientName: sellerClientName,
      clientType: sellerClientType,
      product: sellerProduct,
      units: sellerUnits,
      amount: sellerAmount,
      pay: sellerPay,
      source: sellerSource,
      date: sellerDate,
      notes: sellerNotes || undefined,
      type: 'seller',
    };
    createSellerSale.mutate(input, {
      onSuccess: () => {
        setSellerClientId('');
        setSellerClientName('');
        setSellerClientType('Existente');
        setSellerProduct('');
        setSellerUnits(1);
        setSellerAmount(0);
        setSellerDate(today());
        setSellerNotes('');
      },
    });
  }

  function handleDirSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: '',
      clientName: dirProject,
      clientType: 'Existente',
      product: dirProject,
      units: dirUnits,
      amount: dirAmount,
      pay: 'Pagado',
      source: 'Dirección Comercial',
      date: dirDate,
      notes: dirNotes || undefined,
      type: 'direction',
    };
    createDirSale.mutate(input, {
      onSuccess: () => {
        setDirProject('');
        setDirUnits(1);
        setDirAmount(0);
        setDirDate(today());
        setDirNotes('');
      },
    });
  }

  function handleAtcSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: '',
      clientName: 'ATC',
      clientType: 'Existente',
      product: 'ATC',
      units: atcUnits,
      amount: atcAmount,
      pay: 'Pagado',
      source: 'Cliente existente',
      date: atcDate,
      notes: atcNotes || undefined,
      type: 'atc',
    };
    createAtcSale.mutate(input, {
      onSuccess: () => {
        setAtcUnits(1);
        setAtcAmount(0);
        setAtcDate(today());
        setAtcNotes('');
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

      {/* 3 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Columna izquierda: Vendedor */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-black text-[#002B49]">Registrar venta del día</h3>
          <form onSubmit={handleSellerSubmit} className="space-y-3">
            <div>
              <label className="slabel mb-1">Cliente</label>
              <select
                className="input"
                value={sellerClientId}
                onChange={(e) => {
                  const client = clientsData?.data.find((c) => c.id === e.target.value);
                  setSellerClientId(e.target.value);
                  setSellerClientName(client?.name ?? '');
                  setSellerClientType(
                    client?.type === 'Nuevo' ? 'Nuevo' : 'Existente',
                  );
                }}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clientsData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="slabel mb-1">Producto</label>
              <input
                type="text"
                className="input"
                value={sellerProduct}
                onChange={(e) => setSellerProduct(e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="slabel mb-1">Unidades</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={sellerUnits}
                  onChange={(e) => setSellerUnits(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="slabel mb-1">Monto factura</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={sellerAmount}
                  onChange={(e) => setSellerAmount(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="slabel mb-1">Fecha</label>
                <input
                  type="date"
                  className="input"
                  value={sellerDate}
                  onChange={(e) => setSellerDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="slabel mb-1">Forma de pago</label>
                <select
                  className="input"
                  value={sellerPay}
                  onChange={(e) => setSellerPay(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="slabel mb-1">Fuente</label>
              <select
                className="input"
                value={sellerSource}
                onChange={(e) => setSellerSource(e.target.value as SaleSource)}
              >
                {SALE_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="slabel mb-1">Notas de venta</label>
              <textarea
                className="input"
                rows={2}
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder="Observaciones adicionales"
              />
            </div>

            {createSellerSale.isError && (
              <p className="text-xs text-red-600">No se pudo registrar la venta</p>
            )}

            <button
              type="submit"
              className="btn-green w-full"
              disabled={createSellerSale.isPending}
            >
              {createSellerSale.isPending ? 'Guardando...' : 'Guardar venta vendedor'}
            </button>
          </form>
        </div>

        {/* Columna central: Dirección */}
        <div style={{ background: '#001524', borderRadius: 12, padding: 20 }}>
          <h3 className="mb-1 text-sm font-black text-white">Ventas Dirección</h3>
          <p className="mb-4 text-xs text-slate-400">
            Cuentas cerradas directamente por Dirección Comercial
          </p>
          <form onSubmit={handleDirSubmit} className="space-y-3">
            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Fecha
              </label>
              <input
                type="date"
                className="input"
                value={dirDate}
                onChange={(e) => setDirDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Cuenta / Proyecto
              </label>
              <input
                type="text"
                className="input"
                value={dirProject}
                onChange={(e) => setDirProject(e.target.value)}
                placeholder="Nombre de la cuenta o proyecto"
                required
              />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Unidades Dirección
              </label>
              <input
                type="number"
                min="1"
                className="input"
                value={dirUnits}
                onChange={(e) => setDirUnits(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Monto Dirección
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={dirAmount}
                onChange={(e) => setDirAmount(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Notas Dirección
              </label>
              <textarea
                className="input"
                rows={2}
                value={dirNotes}
                onChange={(e) => setDirNotes(e.target.value)}
                placeholder="Observaciones adicionales"
              />
            </div>

            {createDirSale.isError && (
              <p className="text-xs text-red-400">No se pudo registrar la venta</p>
            )}

            <button
              type="submit"
              className="btn-green w-full"
              disabled={createDirSale.isPending}
            >
              {createDirSale.isPending ? 'Guardando...' : 'Guardar Venta Dirección'}
            </button>
          </form>
        </div>

        {/* Columna derecha: ATC */}
        <div className="card p-5">
          <h3 className="mb-1 text-sm font-black text-[#002B49]">Registrar ATC</h3>
          <p className="mb-4 text-xs text-slate-500">ATC solo registra clientes existentes</p>
          <form onSubmit={handleAtcSubmit} className="space-y-3">
            <div>
              <label className="slabel mb-1">Fecha</label>
              <input
                type="date"
                className="input"
                value={atcDate}
                onChange={(e) => setAtcDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1">Unidades ATC</label>
              <input
                type="number"
                min="1"
                className="input"
                value={atcUnits}
                onChange={(e) => setAtcUnits(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1">Monto pagado ATC</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={atcAmount}
                onChange={(e) => setAtcAmount(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="slabel mb-1">Notas ATC</label>
              <textarea
                className="input"
                rows={2}
                value={atcNotes}
                onChange={(e) => setAtcNotes(e.target.value)}
                placeholder="Observaciones adicionales"
              />
            </div>

            {createAtcSale.isError && (
              <p className="text-xs text-red-600">No se pudo registrar la venta</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={createAtcSale.isPending}
            >
              {createAtcSale.isPending ? 'Guardando...' : 'Guardar ATC'}
            </button>
          </form>
        </div>
      </div>

      {/* VENTAS REGISTRADAS */}
      <div>
        <p className="slabel mb-4">VENTAS REGISTRADAS</p>

        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4">
              <p className="slabel mb-1">Total ventas</p>
              <p className="text-2xl font-black text-[#002B49]">{summary.total}</p>
            </div>
            <div className="card p-4">
              <p className="slabel mb-1">Unidades</p>
              <p className="text-2xl font-black text-[#002B49]">{summary.totalUnits}</p>
            </div>
            <div className="card p-4">
              <p className="slabel mb-1">Monto total</p>
              <p className="text-lg font-black text-[#82bc00]">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="card p-4">
              <p className="slabel mb-1">Nuevos / Existentes</p>
              <p className="text-base font-bold text-[#002B49]">
                {summary.unitsByClientType.Nuevo} / {summary.unitsByClientType.Existente}
              </p>
              <p className="text-xs text-slate-400">unidades</p>
            </div>
          </div>
        )}

        <div className="card">
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
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {sale.clientName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.product} · {sale.units} ud. · {sale.date}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`tag ${
                        sale.clientType === 'Nuevo'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sale.clientType}
                    </span>
                    <span
                      className={`tag ${
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
    </div>
  );
}
