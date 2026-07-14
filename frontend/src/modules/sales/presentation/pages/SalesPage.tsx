import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalCircle01Icon } from '@hugeicons/core-free-icons';
import { useAppStore } from '@/shared/store/app.store';
import { useSellers } from '@/modules/equipo/application/hooks/useSellers';
import { useCreateSale } from '../../application/hooks/useCreateSale';
import { useSales } from '../../application/hooks/useSales';
import { useDeleteSale } from '../../application/hooks/useDeleteSale';
import type { CreateSaleInput, PaymentMethod, SaleSource, Sale } from '../../domain/sales.types';
import { UserRole } from '@/core/domain/types/common.types';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import { FieldError } from '@/shared/components/forms/FieldError';
import { fieldErrorProps } from '@/shared/components/forms/field-error-props';
import { ClientCombobox } from '@/shared/components/forms/ClientCombobox';
import { DatePickerField } from '@/shared/components/forms/DatePickerField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditSaleModal } from '../components/EditSaleModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const sellerId = currentUser?.sellerId ?? '';
  const isAdminOrDirector = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.Director;

  // Sellers list for Admin/Director forms (hook is self-gated to Admin/Director)
  const { data: sellersData } = useSellers();
  const activeSellers = (sellersData ?? []).filter((s) => s.active);

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
  const [dirSellerId, setDirSellerId] = useState('');
  const [dirProject, setDirProject] = useState('');
  const [dirUnits, setDirUnits] = useState<number | ''>('');
  const [dirAmount, setDirAmount] = useState<number | ''>('');
  const [dirDate, setDirDate] = useState(today());
  const [dirNotes, setDirNotes] = useState('');

  // ATC form state
  const [atcSellerId, setAtcSellerId] = useState('');
  const [atcUnits, setAtcUnits] = useState<number | ''>('');
  const [atcAmount, setAtcAmount] = useState<number | ''>('');
  const [atcDate, setAtcDate] = useState(today());
  const [atcNotes, setAtcNotes] = useState('');

  // Default both dropdowns to the "Dirección Comercial" seller when the list loads
  useEffect(() => {
    const direccion = sellersData?.find((s) => s.active && s.name === 'Dirección Comercial');
    if (!direccion) return;
    const frame = requestAnimationFrame(() => {
      setDirSellerId((prev) => prev || direccion.id);
      setAtcSellerId((prev) => prev || direccion.id);
    });
    return () => cancelAnimationFrame(frame);
  }, [sellersData]);

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);

  const createSellerSale = useCreateSale();
  const createDirSale = useCreateSale();
  const createAtcSale = useCreateSale();
  const { mutate: deleteSale } = useDeleteSale();

  const { formRef: sellerFormRef, ...sellerErrors } = useApiFormErrors(createSellerSale.error);
  const { formRef: dirFormRef, ...dirErrors } = useApiFormErrors(createDirSale.error);
  const { formRef: atcFormRef, ...atcErrors } = useApiFormErrors(createAtcSale.error);

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
      sellerId: dirSellerId,
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
      sellerId: atcSellerId,
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
        {!isAdminOrDirector && <Card className="p-5">
          <h3 className="mb-4 text-sm font-black text-[#002B49]">Registrar venta del día</h3>
          <form ref={sellerFormRef} onSubmit={handleSellerSubmit} className="space-y-3">
            <FormErrorSummary error={sellerErrors.summary} />

            <div>
              <label className="slabel mb-1">Cliente</label>
              <ClientCombobox
                value={sellerClientId}
                onSelect={(client) => {
                  setSellerClientId(client?.id ?? '');
                  setSellerClientName(client?.name ?? '');
                  setSellerClientType(client?.type === 'Nuevo' ? 'Nuevo' : 'Existente');
                  sellerErrors.clearField('clientId');
                }}
                placeholder="Seleccionar cliente"
                error={!!sellerErrors.fieldErrors.clientId}
              />
              <FieldError name="clientId" message={sellerErrors.fieldErrors.clientId} />
            </div>

            <div>
              <label className="slabel mb-1">Producto</label>
              <Input
                type="text"
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
                <Input
                  type="number"
                  min="1"
                  value={sellerUnits}
                  onChange={(e) => { setSellerUnits(e.target.value === '' ? '' : Number(e.target.value)); sellerErrors.clearField('units'); }}
                  required
                  {...fieldErrorProps('units', sellerErrors.fieldErrors.units)}
                />
                <FieldError name="units" message={sellerErrors.fieldErrors.units} />
              </div>
              <div>
                <label className="slabel mb-1">Monto factura</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
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
                <DatePickerField
                  value={sellerDate}
                  onChange={(v) => { setSellerDate(v); sellerErrors.clearField('date'); }}
                  {...fieldErrorProps('date', sellerErrors.fieldErrors.date)}
                />
                <FieldError name="date" message={sellerErrors.fieldErrors.date} />
              </div>
              <div>
                <label className="slabel mb-1">Forma de pago</label>
                <Select
                  value={sellerPay}
                  onValueChange={(v) => { setSellerPay(v as PaymentMethod); sellerErrors.clearField('pay'); }}
                >
                  <SelectTrigger {...fieldErrorProps('pay', sellerErrors.fieldErrors.pay)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError name="pay" message={sellerErrors.fieldErrors.pay} />
              </div>
            </div>

            <div>
              <label className="slabel mb-1">Fuente</label>
              <Select
                value={sellerSource}
                onValueChange={(v) => { setSellerSource(v as SaleSource); sellerErrors.clearField('source'); }}
              >
                <SelectTrigger {...fieldErrorProps('source', sellerErrors.fieldErrors.source)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALE_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="source" message={sellerErrors.fieldErrors.source} />
            </div>

            <div>
              <label className="slabel mb-1">Notas de venta</label>
              <Textarea
                rows={2}
                value={sellerNotes}
                onChange={(e) => { setSellerNotes(e.target.value); sellerErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', sellerErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={sellerErrors.fieldErrors.notes} />
            </div>

            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={createSellerSale.isPending}
            >
              {createSellerSale.isPending ? 'Guardando...' : 'Guardar venta vendedor'}
            </Button>
          </form>
        </Card>}

        {/* Columna central: Dirección — solo Admin/Director */}
        {isAdminOrDirector && <div style={{ background: '#001524', borderRadius: 12, padding: 20 }}>
          <h3 className="mb-1 text-sm font-black text-white">Ventas Dirección</h3>
          <p className="mb-4 text-xs text-slate-400">
            Cuentas cerradas directamente por Dirección Comercial
          </p>
          <form ref={dirFormRef} onSubmit={handleDirSubmit} className="space-y-3">
            <FormErrorSummary error={dirErrors.summary} />

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Vendedor
              </label>
              <Select
                value={dirSellerId}
                onValueChange={(v) => { setDirSellerId(v); dirErrors.clearField('sellerId'); }}
              >
                <SelectTrigger {...fieldErrorProps('sellerId', dirErrors.fieldErrors.sellerId)}>
                  <SelectValue placeholder="Seleccionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="sellerId" message={dirErrors.fieldErrors.sellerId} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Fecha
              </label>
              <DatePickerField
                value={dirDate}
                onChange={(v) => { setDirDate(v); dirErrors.clearField('date'); }}
                {...fieldErrorProps('date', dirErrors.fieldErrors.date)}
              />
              <FieldError name="date" message={dirErrors.fieldErrors.date} />
            </div>

            <div>
              <label className="slabel mb-1" style={{ color: '#94A3B8' }}>
                Cuenta / Proyecto
              </label>
              <Input
                type="text"
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
              <Input
                type="number"
                min="1"
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
              <Input
                type="number"
                min="0"
                step="0.01"
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
              <Textarea
                rows={2}
                value={dirNotes}
                onChange={(e) => { setDirNotes(e.target.value); dirErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', dirErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={dirErrors.fieldErrors.notes} />
            </div>

            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={createDirSale.isPending}
            >
              {createDirSale.isPending ? 'Guardando...' : 'Guardar Venta Dirección'}
            </Button>
          </form>
        </div>}

        {/* Columna derecha: ATC — solo Admin/Director */}
        {isAdminOrDirector && <Card className="p-5">
          <h3 className="mb-1 text-sm font-black text-[#002B49]">Registrar ATC</h3>
          <p className="mb-4 text-xs text-slate-500">ATC solo registra clientes existentes</p>
          <form ref={atcFormRef} onSubmit={handleAtcSubmit} className="space-y-3">
            <FormErrorSummary error={atcErrors.summary} />

            <div>
              <label className="slabel mb-1">Vendedor</label>
              <Select
                value={atcSellerId}
                onValueChange={(v) => { setAtcSellerId(v); atcErrors.clearField('sellerId'); }}
              >
                <SelectTrigger {...fieldErrorProps('sellerId', atcErrors.fieldErrors.sellerId)}>
                  <SelectValue placeholder="Seleccionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="sellerId" message={atcErrors.fieldErrors.sellerId} />
            </div>

            <div>
              <label className="slabel mb-1">Fecha</label>
              <DatePickerField
                value={atcDate}
                onChange={(v) => { setAtcDate(v); atcErrors.clearField('date'); }}
                {...fieldErrorProps('date', atcErrors.fieldErrors.date)}
              />
              <FieldError name="date" message={atcErrors.fieldErrors.date} />
            </div>

            <div>
              <label className="slabel mb-1">Unidades ATC</label>
              <Input
                type="number"
                min="1"
                value={atcUnits}
                onChange={(e) => { setAtcUnits(e.target.value === '' ? '' : Number(e.target.value)); atcErrors.clearField('units'); }}
                required
                {...fieldErrorProps('units', atcErrors.fieldErrors.units)}
              />
              <FieldError name="units" message={atcErrors.fieldErrors.units} />
            </div>

            <div>
              <label className="slabel mb-1">Monto pagado ATC</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={atcAmount}
                onChange={(e) => { setAtcAmount(e.target.value === '' ? '' : Number(e.target.value)); atcErrors.clearField('amount'); }}
                required
                {...fieldErrorProps('amount', atcErrors.fieldErrors.amount)}
              />
              <FieldError name="amount" message={atcErrors.fieldErrors.amount} />
            </div>

            <div>
              <label className="slabel mb-1">Notas ATC</label>
              <Textarea
                rows={2}
                value={atcNotes}
                onChange={(e) => { setAtcNotes(e.target.value); atcErrors.clearField('notes'); }}
                placeholder="Observaciones adicionales"
                {...fieldErrorProps('notes', atcErrors.fieldErrors.notes)}
              />
              <FieldError name="notes" message={atcErrors.fieldErrors.notes} />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createAtcSale.isPending}
            >
              {createAtcSale.isPending ? 'Guardando...' : 'Guardar ATC'}
            </Button>
          </form>
        </Card>}
      </div>

      {/* VENTAS REGISTRADAS */}
      <div>
        <p className="slabel mb-4">VENTAS REGISTRADAS</p>

        {summary && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <p className="slabel mb-1">Total ventas</p>
              <p className="text-2xl font-black text-[#002B49]">{summary.total}</p>
            </Card>
            <Card className="p-4">
              <p className="slabel mb-1">Unidades</p>
              <p className="text-2xl font-black text-[#002B49]">{summary.totalUnits}</p>
            </Card>
            <Card className="p-4">
              <p className="slabel mb-1">Monto total</p>
              <p className="text-lg font-black text-[#82bc00]">
                {formatCurrency(summary.totalAmount)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="slabel mb-1">Nuevos / Existentes</p>
              <p className="text-base font-bold text-[#002B49]">
                {summary.unitsByClientType.Nuevo} / {summary.unitsByClientType.Existente}
              </p>
              <p className="text-xs text-slate-400">unidades</p>
            </Card>
          </div>
        )}

        <Card>
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
                    <Badge variant={sale.clientType === 'Nuevo' ? 'blue' : 'gray'}>
                      {sale.clientType}
                    </Badge>
                    <Badge
                      variant={
                        sale.type === 'seller'
                          ? 'navy'
                          : sale.type === 'atc'
                            ? 'amber'
                            : 'purple'
                      }
                    >
                      {sale.type}
                    </Badge>
                    <span className="text-sm font-bold text-[#82bc00]">
                      {formatCurrency(sale.amount)}
                    </span>
                    {isAdminOrDirector && (
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-xs" aria-label={`Acciones de venta ${sale.clientName}`}>
                                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Acciones de venta</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onSelect={() => setEditingSale(sale)}>
                            Editar venta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeletingSale(sale)}>
                            Eliminar venta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
        />
      )}

      <AlertDialog open={!!deletingSale} onOpenChange={(open) => { if (!open) setDeletingSale(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar la venta de <strong>{deletingSale?.clientName}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                if (deletingSale) {
                  deleteSale(deletingSale.id);
                  setDeletingSale(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
