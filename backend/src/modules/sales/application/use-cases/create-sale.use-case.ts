import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ISaleRepository, SALE_REPOSITORY } from '../../domain/repositories/sale.repository.interface';
import { CreateSaleDto } from '../dtos/create-sale.dto';
import { SaleResponseDto } from '../dtos/sale-response.dto';

@Injectable()
export class CreateSaleUseCase implements IUseCase<CreateSaleDto, SaleResponseDto> {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepo: ISaleRepository,
  ) {}

  async execute(dto: CreateSaleDto): Promise<SaleResponseDto> {
    const entity = await this.saleRepo.create({
      sellerId: dto.sellerId,
      clientId: dto.clientId,
      clientName: dto.clientName,
      clientType: dto.clientType,
      product: dto.product,
      units: dto.units,
      amount: dto.amount,
      pay: dto.pay,
      source: dto.source,
      date: new Date(dto.date),
      notes: dto.notes ?? null,
      type: dto.type,
    });
    return SaleResponseDto.fromEntity(entity);
  }
}
