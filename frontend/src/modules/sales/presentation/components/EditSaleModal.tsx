import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useUpdateSale } from '../../application/hooks/useUpdateSale';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import type { Sale, PaymentMethod, SaleSource } from '../../domain/sales.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerField } from '@/shared/components/forms/DatePickerField';
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
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSaleModal({ sale, isOpen, onClose }: Props) {
  const updateSale = useUpdateSale();
  const errors = useApiFormErrors(updateSale.error);

  const [date, setDate] = useState(sale.date.substring(0, 10));
  const [clientName, setClientName] = useState(sale.clientName);
  const [product, setProduct] = useState(sale.product);
  const [units, setUnits] = useState<number | ''>(sale.units);
  const [amount, setAmount] = useState<number | ''>(sale.amount);
  const [pay, setPay] = useState<PaymentMethod>(sale.pay);
  const [source, setSource] = useState<SaleSource>(sale.source);
  const [notes, setNotes] = useState(sale.notes ?? '');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSale.mutate(
      {
        id: sale.id,
        input: {
          date,
          clientName,
          product: sale.type === 'seller' ? product : undefined,
          units: Number(units),
          amount: Number(amount),
          pay: sale.type === 'seller' ? pay : undefined,
          source: sale.type === 'seller' ? source : undefined,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Venta actualizada');
          onClose();
        },
        onError: () => toast.error('No se pudo actualizar la venta'),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar venta</DialogTitle>
        </DialogHeader>

        <form ref={errors.formRef} onSubmit={handleSubmit} className="space-y-3">
          <FormErrorSummary error={errors.summary} />

          <div>
            <label className="slabel mb-1">Fecha</label>
            <DatePickerField
              value={date}
              onChange={setDate}
            />
          </div>

          {(sale.type === 'direction' || sale.type === 'seller') && (
            <div>
              <label className="slabel mb-1">
                {sale.type === 'direction' ? 'Proyecto / Cuenta' : 'Cliente'}
              </label>
              <Input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
          )}

          {sale.type === 'seller' && (
            <div>
              <label className="slabel mb-1">Producto</label>
              <Input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="slabel mb-1">Unidades</label>
              <Input
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="slabel mb-1">Monto</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
          </div>

          {sale.type === 'seller' && (
            <>
              <div>
                <label className="slabel mb-1">Forma de pago</label>
                <Select
                  value={pay}
                  onValueChange={(v) => setPay(v as PaymentMethod)}
                >
                  <SelectTrigger>
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
              </div>

              <div>
                <label className="slabel mb-1">Fuente</label>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as SaleSource)}
                >
                  <SelectTrigger>
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
              </div>
            </>
          )}

          <div>
            <label className="slabel mb-1">Notas</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales"
            />
          </div>

          <DialogFooter>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={updateSale.isPending}>
              {updateSale.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
