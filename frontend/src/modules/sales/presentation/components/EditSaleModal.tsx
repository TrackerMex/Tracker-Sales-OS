import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useUpdateSale } from '../../application/hooks/useUpdateSale';
import { useApiFormErrors } from '@/shared/lib/api-errors';
import { FormErrorSummary } from '@/shared/components/forms/FormErrorSummary';
import type { Sale, PaymentMethod, SaleSource } from '../../domain/sales.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
  onReturnFocus?: () => void;
}

export function EditSaleModal({ sale, isOpen, onClose, onReturnFocus }: Props) {
  const updateSale = useUpdateSale();
  const { formRef, ...errors } = useApiFormErrors(updateSale.error);

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
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto bg-background p-0 sm:max-w-3xl"
        onCloseAutoFocus={(event) => {
          if (onReturnFocus) {
            event.preventDefault();
            onReturnFocus();
          }
        }}
      >
        <DialogHeader className="border-b p-4 md:p-6">
          <DialogTitle>Editar venta</DialogTitle>
          <DialogDescription>
            Actualiza los datos registrados para esta venta.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit}>
          {errors.summary && (
            <div className="p-4 pb-0 md:px-6">
              <FormErrorSummary error={errors.summary} />
            </div>
          )}

          <div className="grid gap-px bg-border xl:grid-cols-2">
            <section className="bg-background p-4 md:p-6">
              <h5 className="text-base font-semibold">Venta</h5>
              <div className="mt-6 flex flex-col gap-6">
                <div>
                  <Label htmlFor="edit-sale-date" id="edit-sale-date-label">Fecha</Label>
                  <div className="mt-2">
                    <DatePickerField
                      id="edit-sale-date"
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                {(sale.type === 'direction' || sale.type === 'seller') && (
                  <div>
                    <Label htmlFor="edit-sale-client">
                      {sale.type === 'direction' ? 'Proyecto / Cuenta' : 'Cliente'}
                    </Label>
                    <Input
                      id="edit-sale-client"
                      type="text"
                      className="mt-2"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                )}

                {sale.type === 'seller' && (
                  <div>
                    <Label htmlFor="edit-sale-product">Producto</Label>
                    <Input
                      id="edit-sale-product"
                      type="text"
                      className="mt-2"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-sale-units">Unidades</Label>
                    <Input
                      id="edit-sale-units"
                      type="number"
                      min="1"
                      className="mt-2"
                      value={units}
                      onChange={(e) => setUnits(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sale-amount">Monto</Label>
                    <Input
                      id="edit-sale-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-2"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-background p-4 md:p-6">
              <h5 className="text-base font-semibold">
                {sale.type === 'seller' ? 'Pago y origen' : 'Notas'}
              </h5>
              <div className="mt-6 flex flex-col gap-6">
                {sale.type === 'seller' && (
                  <>
                    <div>
                      <Label htmlFor="edit-sale-pay">Forma de pago</Label>
                      <Select
                        value={pay}
                        onValueChange={(v) => setPay(v as PaymentMethod)}
                      >
                        <SelectTrigger id="edit-sale-pay" className="mt-2 w-full">
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
                      <Label htmlFor="edit-sale-source">Fuente</Label>
                      <Select
                        value={source}
                        onValueChange={(v) => setSource(v as SaleSource)}
                      >
                        <SelectTrigger id="edit-sale-source" className="mt-2 w-full">
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
                  <Label htmlFor="edit-sale-notes">Notas</Label>
                  <Textarea
                    id="edit-sale-notes"
                    rows={2}
                    className="mt-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones adicionales"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t p-4 md:px-6">
            <Button type="button" variant="ghost" size="lg" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={updateSale.isPending}>
              {updateSale.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
