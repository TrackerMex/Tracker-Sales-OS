import { ID } from '../../../core/domain/types/common.types';

export type SaleType = 'seller' | 'atc' | 'direction';
export type PaymentMethod = 'Pagado' | 'Crédito' | '50% anticipo' | 'Pendiente';

export interface Sale {
  id: ID;
  sellerId: ID;
  clientId: ID;
  clientName: string;
  clientType: 'Nuevo' | 'Existente';
  product: string;
  units: number;
  amount: number;
  pay: PaymentMethod;
  source: string;
  date: string;
  notes: string | null;
  type: SaleType;
}
