import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ISaleRepository, SALE_REPOSITORY } from '../../domain/repositories/sale.repository.interface';

@Injectable()
export class DeleteSaleUseCase {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepo: ISaleRepository,
  ) {}

  async execute(saleId: string): Promise<void> {
    const existing = await this.saleRepo.findById(saleId);
    if (!existing) throw new NotFoundException('Venta no encontrada');
    await this.saleRepo.softDelete(saleId);
  }
}
