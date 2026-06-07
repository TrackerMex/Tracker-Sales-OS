import { ID } from '../../../core/domain/types/common.types';

export type SaleType = 'seller' | 'atc' | 'direction';
export type PaymentMethod = 'Pagado' | 'Crédito' | '50% anticipo' | 'Pendiente';
export type SaleSource =
  | 'Prospección propia'
  | 'Cliente existente'
  | 'Referido'
  | 'Expo'
  | 'Marketing'
  | 'LinkedIn'
  | 'Web'
  | 'Dirección Comercial';

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
  source: SaleSource;
  date: string;
  notes: string | null;
  type: SaleType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  sellerId: string;
  clientId: string;
  clientName: string;
  clientType: 'Nuevo' | 'Existente';
  product: string;
  units: number;
  amount: number;
  pay: PaymentMethod;
  source: SaleSource;
  date: string;
  notes?: string;
  type: SaleType;
}

export interface SaleFilters {
  month?: string;
  sellerId?: string;
  type?: SaleType;
  page?: number;
  limit?: number;
}

export interface SalesSummary {
  total: number;
  totalAmount: number;
  totalUnits: number;
  unitsByClientType: { Nuevo: number; Existente: number };
  amountByClientType: { Nuevo: number; Existente: number };
}

export interface SalesListResponse {
  data: Sale[];
  total: number;
  summary: SalesSummary;
}
