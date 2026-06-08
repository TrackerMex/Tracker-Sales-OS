import { useState, type FormEvent } from 'react';
import type { PaymentMethod, SaleSource, SaleType, CreateSaleInput } from '../../domain/sales.types';

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

interface Props {
  type: SaleType;
  sellerId: string;
  onSubmit: (input: CreateSaleInput) => void;
  isLoading: boolean;
}

const labelClass = 'slabel';
const inputClass = 'input';

const defaultValues = {
  clientId: '',
  clientName: '',
  clientType: 'Nuevo' as 'Nuevo' | 'Existente',
  product: '',
  units: 1,
  amount: 0,
  pay: 'Pagado' as PaymentMethod,
  source: 'Prospección propia' as SaleSource,
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export function SaleFormBase({ type, sellerId, onSubmit, isLoading }: Props) {
  const [clientId, setClientId] = useState(defaultValues.clientId);
  const [clientName, setClientName] = useState(defaultValues.clientName);
  const [clientType, setClientType] = useState<'Nuevo' | 'Existente'>(defaultValues.clientType);
  const [product, setProduct] = useState(defaultValues.product);
  const [units, setUnits] = useState(defaultValues.units);
  const [amount, setAmount] = useState(defaultValues.amount);
  const [pay, setPay] = useState<PaymentMethod>(defaultValues.pay);
  const [source, setSource] = useState<SaleSource>(defaultValues.source);
  const [date, setDate] = useState(defaultValues.date);
  const [notes, setNotes] = useState(defaultValues.notes);

  function reset() {
    setClientId(defaultValues.clientId);
    setClientName(defaultValues.clientName);
    setClientType(defaultValues.clientType);
    setProduct(defaultValues.product);
    setUnits(defaultValues.units);
    setAmount(defaultValues.amount);
    setPay(defaultValues.pay);
    setSource(defaultValues.source);
    setDate(defaultValues.date);
    setNotes(defaultValues.notes);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      sellerId,
      clientId,
      clientName,
      clientType,
      product,
      units,
      amount,
      pay,
      source,
      date,
      notes: notes || undefined,
      type,
    });
    reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>ID del cliente</label>
          <input
            type="text"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="UUID del cliente"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Nombre del cliente</label>
          <input
            type="text"
            className={inputClass}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre completo"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo de cliente</label>
          <select
            className={inputClass}
            value={clientType}
            onChange={(e) => setClientType(e.target.value as 'Nuevo' | 'Existente')}
          >
            <option value="Nuevo">Nuevo</option>
            <option value="Existente">Existente</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Producto</label>
          <input
            type="text"
            className={inputClass}
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Nombre del producto"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Unidades</label>
          <input
            type="number"
            min="1"
            className={inputClass}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Fecha</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Forma de pago</label>
          <select
            className={inputClass}
            value={pay}
            onChange={(e) => setPay(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fuente</label>
          <select
            className={inputClass}
            value={source}
            onChange={(e) => setSource(e.target.value as SaleSource)}
          >
            {SALE_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <textarea
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones adicionales"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? 'Registrando...' : 'Registrar venta'}
        </button>
      </div>
    </form>
  );
}
