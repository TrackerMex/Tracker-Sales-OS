import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useUpdateSale } from '../../application/hooks/useUpdateSale';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import type { Sale, PaymentMethod, SaleSource } from '../../domain/sales.types';

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

  if (!isOpen) return null;

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-sm font-black text-[#002B49]">Editar venta</h3>

        <form ref={errors.formRef} onSubmit={handleSubmit} className="space-y-3">
          <FormErrorSummary error={errors.summary} />

          <div>
            <label className="slabel mb-1">Fecha</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {(sale.type === 'direction' || sale.type === 'seller') && (
            <div>
              <label className="slabel mb-1">
                {sale.type === 'direction' ? 'Proyecto / Cuenta' : 'Cliente'}
              </label>
              <input
                type="text"
                className="input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
          )}

          {sale.type === 'seller' && (
            <div>
              <label className="slabel mb-1">Producto</label>
              <input
                type="text"
                className="input"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="slabel mb-1">Unidades</label>
              <input
                type="number"
                min="1"
                className="input"
                value={units}
                onChange={(e) => setUnits(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="slabel mb-1">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
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
                <select
                  className="input"
                  value={pay}
                  onChange={(e) => setPay(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="slabel mb-1">Fuente</label>
                <select
                  className="input"
                  value={source}
                  onChange={(e) => setSource(e.target.value as SaleSource)}
                >
                  {SALE_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="slabel mb-1">Notas</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={updateSale.isPending}>
              {updateSale.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
