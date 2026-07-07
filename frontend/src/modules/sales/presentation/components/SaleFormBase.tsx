import { useState, type FormEvent } from 'react';
import type { PaymentMethod, SaleSource, SaleType, CreateSaleInput } from '../../domain/sales.types';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import { FieldError, fieldErrorProps } from '@/shared/components/forms/FieldError';
import { DatePickerField } from '@/shared/components/forms/DatePickerField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  units: '' as number | '',
  amount: '' as number | '',
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
      units: Number(units),
      amount: Number(amount),
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
          <Input
            type="text"
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
          <Input
            type="text"
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
          <Select
            value={clientType}
            onValueChange={(v) => { setClientType(v as 'Nuevo' | 'Existente'); clearField('clientType'); }}
          >
            <SelectTrigger {...fieldErrorProps('clientType', fieldErrors.clientType)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nuevo">Nuevo</SelectItem>
              <SelectItem value="Existente">Existente</SelectItem>
            </SelectContent>
          </Select>
          <FieldError name="clientType" message={fieldErrors.clientType} />
        </div>
        <div>
          <label className={labelClass}>Producto</label>
          <Input
            type="text"
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
          <Input
            type="number"
            min="1"
            value={units}
            onChange={(e) => { setUnits(e.target.value === '' ? '' : Number(e.target.value)); clearField('units'); }}
            required
            {...fieldErrorProps('units', fieldErrors.units)}
          />
          <FieldError name="units" message={fieldErrors.units} />
        </div>
        <div>
          <label className={labelClass}>Monto</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value === '' ? '' : Number(e.target.value)); clearField('amount'); }}
            required
            {...fieldErrorProps('amount', fieldErrors.amount)}
          />
          <FieldError name="amount" message={fieldErrors.amount} />
        </div>
        <div>
          <label className={labelClass}>Fecha</label>
          <DatePickerField
            value={date}
            onChange={(v) => { setDate(v); clearField('date'); }}
            {...fieldErrorProps('date', fieldErrors.date)}
          />
          <FieldError name="date" message={fieldErrors.date} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Forma de pago</label>
          <Select
            value={pay}
            onValueChange={(v) => { setPay(v as PaymentMethod); clearField('pay'); }}
          >
            <SelectTrigger {...fieldErrorProps('pay', fieldErrors.pay)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError name="pay" message={fieldErrors.pay} />
        </div>
        <div>
          <label className={labelClass}>Fuente</label>
          <Select
            value={source}
            onValueChange={(v) => { setSource(v as SaleSource); clearField('source'); }}
          >
            <SelectTrigger {...fieldErrorProps('source', fieldErrors.source)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALE_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError name="source" message={fieldErrors.source} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notas (opcional)</label>
        <Textarea
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
