import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/shared/store/app.store';
import { useCreateSale } from '../../application/hooks/useCreateSale';
import { useSales } from '../../application/hooks/useSales';
import { useClients } from '../../../clients/application/hooks/useClients';
import type { CreateSaleInput, PaymentMethod, SaleSource } from '../../domain/sales.types';
import { UserRole } from '@/core/domain/types/common.types';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError';

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
  const isAdminOrDirector = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director;

  // Seller form state
  const [sellerClientId, setSellerClientId] = useState('');
  const [sellerClientName, setSellerClientName] = useState('');
  const [sellerClientType, setSellerClientType] = useState<'Nuevo' | 'Existente'>('Existente');
  const [sellerProduct, setSellerProduct] = useState('');
  const [sellerUnits, setSellerUnits] = useState<number | ''>('');
  const [sellerAmount, setSellerAmount] = useState<number | ''>('');
  const [sellerDate, setSellerDate] = useState(today());
  const [sellerPay, setSellerPay] = useState<PaymentMethod>('Pagado');
  const [sellerSource, setSellerSource] = useState<SaleSource>('Cliente existente');
  const [sellerNotes, setSellerNotes] = useState('');

  // Direction form state
  const [dirProject, setDirProject] = useState('');
  const [dirUnits, setDirUnits] = useState<number | ''>('');
  const [dirAmount, setDirAmount] = useState<number | ''>('');
  const [dirDate, setDirDate] = useState(today());
  const [dirNotes, setDirNotes] = useState('');

  // ATC form state
  const [atcUnits, setAtcUnits] = useState<number | ''>('');
  const [atcAmount, setAtcAmount] = useState<number | ''>('');
  const [atcDate, setAtcDate] = useState(today());
  const [atcNotes, setAtcNotes] = useState('');

  const createSellerSale = useCreateSale();
  const createDirSale = useCreateSale();
  const createAtcSale = useCreateSale();

  const sellerErrors = useApiFormErrors(createSellerSale.error);
  const dirErrors = useApiFormErrors(createDirSale.error);
  const atcErrors = useApiFormErrors(createAtcSale.error);

  const { data: clientsData } = useClients({ limit: 200 });
  const { data, isLoading: loadingList, isError } = useSales(
    !isAdminOrDirector ? { sellerId } : {},
  );

  function handleSellerSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: sellerClientId,
      clientName: sellerClientName,
      clientType: sellerClientType,
      product: sellerProduct,
      units: Number(sellerUnits),
      amount: Number(sellerAmount),
      pay: sellerPay,
      source: sellerSource,
      date: sellerDate,
      notes: sellerNotes || undefined,
      type: 'seller',
    };
    createSellerSale.mutate(input, {
      onSuccess: () => {
        toast.success('Venta registrada');
        setSellerClientId('');
        setSellerClientName('');
        setSellerClientType('Existente');
        setSellerProduct('');
        setSellerUnits('');
        setSellerAmount('');
        setSellerDate(today());
        setSellerNotes('');
      },
      onError: () => toast.error('No se pudo registrar la venta'),
    });
  }

  function handleDirSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: undefined,
      clientName: dirProject,
      clientType: 'Existente',
      product: dirProject,
      units: Number(dirUnits),
      amount: Number(dirAmount),
      pay: 'Pagado',
      source: 'Dirección Comercial',
      date: dirDate,
      notes: dirNotes || undefined,
      type: 'direction',
    };
    createDirSale.mutate(input, {
      onSuccess: () => {
        toast.success('Venta registrada');
        setDirProject('');
        setDirUnits('');
        setDirAmount('');
        setDirDate(today());
        setDirNotes('');
      },
      onError: () => toast.error('No se pudo registrar la venta'),
    });
  }

  function handleAtcSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateSaleInput = {
      sellerId,
      clientId: undefined,
      clientName: 'ATC',
      clientType: 'Existente',
      product: 'ATC',
      units: Number(atcUnits),
      amount: Number(atcAmount),
      pay: 'Pagado',
      source: 'Cliente existente',
      date: atcDate,
      notes: atcNotes || undefined,
      type: 'atc',
    };
    createAtcSale.mutate(input, {
      onSuccess: () => {
        toast.success('Venta registrada');
        setAtcUnits('');
        setAtcAmount('');
        setAtcDate(today());
        setAtcNotes('');
      },
      onError: () => toast.error('No se pudo registrar la venta'),
    });
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-black text-[#002B49]">Ventas</h2>
        <p className="mt-1 text-sm text-slate-500">Registro de cierres por tipo</p>
      </div>

      {/* columnas según rol */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdminOrDirector ? '1fr 1fr' : '1fr', gap: 16 }}>

        {/* Columna vendedor — solo Seller */}
        {!isAdminOrDirector && <div className="card p-5">
          <h3 className="mb-4 text-sm font-black text-[#002B49]">Registrar venta del día</h3>
          <form ref={sellerErrors.formRef} onSubmit={handleSellerSubmit} className="space-y-3">
            <FormErrorSummary error={sellerErrors.summary} />

            <div>
              <label className="slabel mb-1">Cliente</label>
              <select
                className={sellerErrors.fieldErrors.clientId ? 'input input-error' : 'input'}
                value={sellerClientId}
                onChange={(e) => {
                  const client = clientsData?.data.find((c) => c.id === e.target.value);
                  setSellerClientId(e.target.value);
                  setSellerClientName(client?.name ?? '');
                  setSellerClientType(
                    client?.type === 'Nuevo' ? 'Nuevo' : 'Existente',
                  );
                  sellerErrors.clearField('clientId');
                }}
                required
                {...fieldErrorProps('clientId', sellerErrors.fieldErrors.clientId)}
              >
                <option value="">Seleccionar cliente</option>
                {clientsData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError name="clientId" message={sellerErrors.fieldErrors.clientId} />
            </div>

            <div>
              <label className="slabel mb-1">Producto</label>
              <input
                type="text"
                className={sellerErrors.fieldErrors.product ? 'input input-error' : 'input'}
                value={sellerProduct}
                onChange={(e) => { setSellerProduct(e.target.value); sellerErrors.clearField('product'); }}
                placeholder="Nombre del producto"
                required
                {...fieldErrorProps('product', sellerErrors.fieldErrors.product)}
              />
              <FieldError name="product" message={sellerErrors.fieldErrors.product} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="slabel mb-1">Unidades</label>
                <input
                  type="number"
                  min="1"
                  className={sellerErrors.fieldErrors.units ? 'input input-error' : 'input'}
                  value={sellerUnits}
                  onChange={(e) => { setSellerUnits(e.target.value === '' ? '' : Number(e.target.value)); sellerErrors.clearField('units'); }}
                  required
                  {...fieldErrorProps('units', sellerErrors.fieldErrors.units)}
                />
                <FieldError name="units" message={sellerErrors.fieldErrors.units} />
              </div>
              <div>
                <label className="slabel mb-1">Monto factura</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={sellerErrors.fieldErrors.amount ? 'input input-error' : 'input'}
                  value={sellerAmount}
                  onChange={(e) => { setSellerAmount(e.target.value === '' ? '' : Number(e.target.value)); sellerErrors.clearField('amount'); }}
                  required
                  {...fieldErrorProps('amount', sellerErrors.fieldErrors.amount)}
                />
                <FieldError name="amount" message={sellerErrors.fieldErrors.amount} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="slabel mb-1">Fecha</label>
                <input
                  type="date"
                  className={sellerErrors.fieldErrors.date ? 'input input-error' : 'input'}
                  value={sellerDate}
                  onChange={(e) => { setSellerDate(e.target.value); sellerErrors.clearField('date'); }}
                  required
                  {...fieldErrorProps('date', sellerErrors.fieldErrors.date)}
                />
                <FieldError name="date" message={sellerErrors.fieldErrors.date} />
              </div>
              <div>
                <label className="slabel mb-1">Forma de pago</label>
                <select
                  className={sellerErrors.fieldErrors.pay ? 'input input-error' : 'input'}
                  value={sellerPay}
                  onChange={(e) => { setSellerPay(e.target.value as PaymentMethod); sellerErrors.clearField('pay'); }}
                  {...fieldErrorProps('pay', sellerErrors.fieldErrors.pay)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <FieldError name="pay" message={sellerErrors.fieldErrors.pay} />
              </div>
            </div>

            <div>
              <label className="slabel mb-1">Fuente</label>
              <select
                className={sellerErrors.fieldErrors.source ? 'input input-error' : 'input'}
                value={sellerSource}
                onChange={(e) => { setSellerSource(e.target.value as SaleSource); sellerErrors.clearField('source'); }}
                {...fieldErrorProps('source', sellerErrors.fieldErrors.source)}
              >
                {SALE_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <FieldError name="source" message={sellerErrors.fieldErrors.source} />
            </div>

            <div>
              <label className="slabel mb-1">Notas de venta</label>
              <textarea
                className={sellerErrors.fieldErrors.notes ? 'input input-error' : 'input'}
                rows={2}
                value={sellerNotes}
                onChange={(e) => { setSellerNotes(e.target.value); sellerErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', sellerErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={sellerErrors.fieldErrors.notes} />
            </div>

            <button
              type="submit"
              className="btn-green w-full"
              disabled={createSellerSale.isPending}
            >
              {createSellerSale.isPending ? 'Guardando...' : 'Guardar venta vendedor'}
            </button>
          </form>
        </div>}

        {/* Columna central: Dirección — solo Admin/Director */}
        {isAdminOrDirector && <div style={{ background: '#001524', borderRadius: 12, padding: 20 }}>
          <h3 className="mb-1 text-sm font-black text-white">Ventas Dirección</h3>
          <p className="mb-4 text-xs text-slate-400">
            Cuentas cerradas directamente por Dirección Comercial
          </p>
          <form ref={dirErrors.formRef} onSubmit={handleDirSubmit} className="space-y-3">
            <FormErrorSummary error={dirErrors.summary} />

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Fecha
              </label>
              <input
                type="date"
                className={dirErrors.fieldErrors.date ? 'input input-error' : 'input'}
                value={dirDate}
                onChange={(e) => { setDirDate(e.target.value); dirErrors.clearField('date'); }}
                required
                {...fieldErrorProps('date', dirErrors.fieldErrors.date)}
              />
              <FieldError name="date" message={dirErrors.fieldErrors.date} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Cuenta / Proyecto
              </label>
              <input
                type="text"
                className={dirErrors.fieldErrors.product || dirErrors.fieldErrors.clientName ? 'input input-error' : 'input'}
                value={dirProject}
                onChange={(e) => {
                  setDirProject(e.target.value);
                  dirErrors.clearField('product');
                  dirErrors.clearField('clientName');
                }}
                placeholder="Nombre de la cuenta o proyecto"
                required
                {...fieldErrorProps('product', dirErrors.fieldErrors.product ?? dirErrors.fieldErrors.clientName)}
              />
              <FieldError name="product" message={dirErrors.fieldErrors.product ?? dirErrors.fieldErrors.clientName} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Unidades Dirección
              </label>
              <input
                type="number"
                min="1"
                className={dirErrors.fieldErrors.units ? 'input input-error' : 'input'}
                value={dirUnits}
                onChange={(e) => { setDirUnits(e.target.value === '' ? '' : Number(e.target.value)); dirErrors.clearField('units'); }}
                required
                {...fieldErrorProps('units', dirErrors.fieldErrors.units)}
              />
              <FieldError name="units" message={dirErrors.fieldErrors.units} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Monto Dirección
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={dirErrors.fieldErrors.amount ? 'input input-error' : 'input'}
                value={dirAmount}
                onChange={(e) => { setDirAmount(e.target.value === '' ? '' : Number(e.target.value)); dirErrors.clearField('amount'); }}
                required
                {...fieldErrorProps('amount', dirErrors.fieldErrors.amount)}
              />
              <FieldError name="amount" message={dirErrors.fieldErrors.amount} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Notas Dirección
              </label>
              <textarea
                className={dirErrors.fieldErrors.notes ? 'input input-error' : 'input'}
                rows={2}
                value={dirNotes}
                onChange={(e) => { setDirNotes(e.target.value); dirErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', dirErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={dirErrors.fieldErrors.notes} />
            </div>

            <button
              type="submit"
              className="btn-green w-full"
              disabled={createDirSale.isPending}
            >
              {createDirSale.isPending ? 'Guardando...' : 'Guardar Venta Dirección'}
            </button>
          </form>
        </div>}

        {/* Columna derecha: ATC — solo Admin/Director */}
        {isAdminOrDirector && <div className="card p-5">
          <h3 className="mb-1 text-sm font-black text-[#002B49]">Registrar ATC</h3>
          <p className="mb-4 text-xs text-slate-500">ATC solo registra clientes existentes</p>
          <form ref={atcErrors.formRef} onSubmit={handleAtcSubmit} className="space-y-3">
            <FormErrorSummary error={atcErrors.summary} />

            <div>
              <label className="slabel mb-1">Fecha</label>
              <input
                type="date"
                className={atcErrors.fieldErrors.date ? 'input input-error' : 'input'}
                value={atcDate}
                onChange={(e) => { setAtcDate(e.target.value); atcErrors.clearField('date'); }}
                required
                {...fieldErrorProps('date', atcErrors.fieldErrors.date)}
              />
              <FieldError name="date" message={atcErrors.fieldErrors.date} />
            </div>

            <div>
              <label className="slabel mb-1">Unidades ATC</label>
              <input
                type="number"
                min="1"
                className={atcErrors.fieldErrors.units ? 'input input-error' : 'input'}
                value={atcUnits}
                onChange={(e) => { setAtcUnits(e.target.value === '' ? '' : Number(e.target.value)); atcErrors.clearField('units'); }}
                required
                {...fieldErrorProps('units', atcErrors.fieldErrors.units)}
              />
              <FieldError name="units" message={atcErrors.fieldErrors.units} />
            </div>

            <div>
              <label className="slabel mb-1">Monto pagado ATC</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={atcErrors.fieldErrors.amount ? 'input input-error' : 'input'}
                value={atcAmount}
                onChange={(e) => { setAtcAmount(e.target.value === '' ? '' : Number(e.target.value)); atcErrors.clearField('amount'); }}
                required
                {...fieldErrorProps('amount', atcErrors.fieldErrors.amount)}
              />
              <FieldError name="amount" message={atcErrors.fieldErrors.amount} />
            </div>

            <div>
              <label className="slabel mb-1">Notas ATC</label>
              <textarea
                className={atcErrors.fieldErrors.notes ? 'input input-error' : 'input'}
                rows={2}
                value={atcNotes}
                onChange={(e) => { setAtcNotes(e.target.value); atcErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', atcErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={atcErrors.fieldErrors.notes} />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={createAtcSale.isPending}
            >
              {createAtcSale.isPending ? 'Guardando...' : 'Guardar ATC'}
            </button>
          </form>
        </div>}
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
