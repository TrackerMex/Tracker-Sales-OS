import { useState, type FormEvent } from 'react';
import type { PaymentMethod, SaleSource, SaleType, CreateSaleInput } from '../../domain/sales.types';
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

interface Props {
  type: SaleType;
  sellerId: string;
  onSubmit: (input: CreateSaleInput) => void;
  isLoading: boolean;
  submitError?: unknown;
}

const labelClass = 'slabel';

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

export function SaleFormBase({ type, sellerId, onSubmit, isLoading, submitError }: Props) {
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

  const { summary, fieldErrors, clearField, formRef } = useApiFormErrors(submitError);

  function inputClass(field: string) {
    return fieldErrors[field] ? 'input input-error' : 'input';
  }

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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <FormErrorSummary error={summary} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>ID del cliente</label>
          <input
            type="text"
            className={inputClass('clientId')}
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); clearField('clientId'); }}
            placeholder="UUID del cliente"
            required
            {...fieldErrorProps('clientId', fieldErrors.clientId)}
          />
          <FieldError name="clientId" message={fieldErrors.clientId} />
        </div>
        <div>
          <label className={labelClass}>Nombre del cliente</label>
          <input
            type="text"
            className={inputClass('clientName')}
            value={clientName}
            onChange={(e) => { setClientName(e.target.value); clearField('clientName'); }}
            placeholder="Nombre completo"
            required
            {...fieldErrorProps('clientName', fieldErrors.clientName)}
          />
          <FieldError name="clientName" message={fieldErrors.clientName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo de cliente</label>
          <select
            className={inputClass('clientType')}
            value={clientType}
            onChange={(e) => { setClientType(e.target.value as 'Nuevo' | 'Existente'); clearField('clientType'); }}
            {...fieldErrorProps('clientType', fieldErrors.clientType)}
          >
            <option value="Nuevo">Nuevo</option>
            <option value="Existente">Existente</option>
          </select>
          <FieldError name="clientType" message={fieldErrors.clientType} />
        </div>
        <div>
          <label className={labelClass}>Producto</label>
          <input
            type="text"
            className={inputClass('product')}
            value={product}
            onChange={(e) => { setProduct(e.target.value); clearField('product'); }}
            placeholder="Nombre del producto"
            required
            {...fieldErrorProps('product', fieldErrors.product)}
          />
          <FieldError name="product" message={fieldErrors.product} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Unidades</label>
          <input
            type="number"
            min="1"
            className={inputClass('units')}
            value={units}
            onChange={(e) => { setUnits(Number(e.target.value)); clearField('units'); }}
            required
            {...fieldErrorProps('units', fieldErrors.units)}
          />
          <FieldError name="units" message={fieldErrors.units} />
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass('amount')}
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)); clearField('amount'); }}
            required
            {...fieldErrorProps('amount', fieldErrors.amount)}
          />
          <FieldError name="amount" message={fieldErrors.amount} />
        </div>
        <div>
          <label className={labelClass}>Fecha</label>
          <input
            type="date"
            className={inputClass('date')}
            value={date}
            onChange={(e) => { setDate(e.target.value); clearField('date'); }}
            required
            {...fieldErrorProps('date', fieldErrors.date)}
          />
          <FieldError name="date" message={fieldErrors.date} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Forma de pago</label>
          <select
            className={inputClass('pay')}
            value={pay}
            onChange={(e) => { setPay(e.target.value as PaymentMethod); clearField('pay'); }}
            {...fieldErrorProps('pay', fieldErrors.pay)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <FieldError name="pay" message={fieldErrors.pay} />
        </div>
        <div>
          <label className={labelClass}>Fuente</label>
          <select
            className={inputClass('source')}
            value={source}
            onChange={(e) => { setSource(e.target.value as SaleSource); clearField('source'); }}
            {...fieldErrorProps('source', fieldErrors.source)}
          >
            {SALE_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError name="source" message={fieldErrors.source} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <textarea
          className={inputClass('notes')}
          rows={2}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); clearField('notes'); }}
          placeholder="Observaciones adicionales"
          {...fieldErrorProps('notes', fieldErrors.notes)}
        />
        <FieldError name="notes" message={fieldErrors.notes} />
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
