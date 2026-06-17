import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ISaleRepository, SALE_REPOSITORY } from '../../domain/repositories/sale.repository.interface';
import { UpdateSaleDto } from '../dtos/update-sale.dto';
import { SaleResponseDto } from '../dtos/sale-response.dto';

export interface UpdateSaleInput {
  saleId: string;
  data: UpdateSaleDto;
}

@Injectable()
export class UpdateSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepo: ISaleRepository,
  ) {}

  async execute(input: UpdateSaleInput): Promise<SaleResponseDto> {
    const existing = await this.saleRepo.findById(input.saleId);
    if (!existing) throw new NotFoundException('Venta no encontrada');

    const updates: Partial<typeof existing> = {};
    if (input.data.clientId !== undefined) updates.clientId = input.data.clientId;
    if (input.data.clientName !== undefined) updates.clientName = input.data.clientName;
    if (input.data.clientType !== undefined) updates.clientType = input.data.clientType;
    if (input.data.product !== undefined) updates.product = input.data.product;
    if (input.data.units !== undefined) updates.units = input.data.units;
    if (input.data.amount !== undefined) updates.amount = input.data.amount;
    if (input.data.pay !== undefined) updates.pay = input.data.pay;
    if (input.data.source !== undefined) updates.source = input.data.source;
    if (input.data.date !== undefined) updates.date = new Date(input.data.date);
    if (input.data.notes !== undefined) updates.notes = input.data.notes;

    const updated = await this.saleRepo.update(input.saleId, updates);
    return SaleResponseDto.fromEntity(updated);
  }
}
