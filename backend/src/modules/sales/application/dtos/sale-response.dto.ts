import { SaleEntity, SaleType, PaymentMethod, SaleSource } from '../../domain/entities/sale.entity';

export class SaleResponseDto {
  id: string;
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
  notes: string | null;
  type: SaleType;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(e: SaleEntity): SaleResponseDto {
    const dto = new SaleResponseDto();
    dto.id = e.id;
    dto.sellerId = e.sellerId;
    dto.clientId = e.clientId;
    dto.clientName = e.clientName;
    dto.clientType = e.clientType;
    dto.product = e.product;
    dto.units = e.units;
    dto.amount = e.amount;
    dto.pay = e.pay;
    dto.source = e.source;
    dto.date = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date);
    dto.notes = e.notes;
    dto.type = e.type;
    dto.createdAt = e.createdAt;
    dto.updatedAt = e.updatedAt;
    return dto;
  }
}

export interface SalesSummary {
  total: number;
  totalAmount: number;
  totalUnits: number;
  unitsByClientType: { Nuevo: number; Existente: number };
  amountByClientType: { Nuevo: number; Existente: number };
}
