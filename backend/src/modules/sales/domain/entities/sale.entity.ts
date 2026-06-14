import { BaseEntity } from '../../../../core/domain/base.entity';

export enum SaleType {
  Seller = 'seller',
  ATC = 'atc',
  Direction = 'direction',
}

export enum PaymentMethod {
  Pagado = 'Pagado',
  Credito = 'Crédito',
  Anticipo50 = '50% anticipo',
  Pendiente = 'Pendiente',
}

export enum SaleSource {
  ProspeccionPropia = 'Prospección propia',
  ClienteExistente = 'Cliente existente',
  Referido = 'Referido',
  Expo = 'Expo',
  Marketing = 'Marketing',
  LinkedIn = 'LinkedIn',
  Web = 'Web',
  DireccionComercial = 'Dirección Comercial',
}

export class SaleEntity extends BaseEntity {
  sellerId: string;
  clientId: string | null;
  clientName: string;
  clientType: 'Nuevo' | 'Existente';
  product: string;
  units: number;
  amount: number;
  pay: PaymentMethod;
  source: SaleSource;
  date: Date;
  notes: string | null;
  type: SaleType;
}
