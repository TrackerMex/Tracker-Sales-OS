import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { ISaleRepository, SALE_REPOSITORY } from '../../domain/repositories/sale.repository.interface';
import { SaleFiltersDto } from '../dtos/sale-filters.dto';
import { SaleResponseDto, SalesSummary } from '../dtos/sale-response.dto';
import { SaleEntity } from '../../domain/entities/sale.entity';

export interface GetSalesInput {
  filters: SaleFiltersDto;
  page: number;
  limit: number;
}

export interface GetSalesOutput {
  data: SaleResponseDto[];
  total: number;
  summary: SalesSummary;
}

@Injectable()
export class GetSalesUseCase implements IUseCase<GetSalesInput, GetSalesOutput> {
  constructor(
    @Inject(SALE_REPOSITORY)
    private readonly saleRepo: ISaleRepository,
  ) {}

  async execute(input: GetSalesInput): Promise<GetSalesOutput> {
    const { filters, page, limit } = input;
    const { data, total } = await this.saleRepo.findWithFilters(filters, page, limit);
    const summary = this.computeSummary(data);
    return {
      data: data.map((e) => SaleResponseDto.fromEntity(e)),
      total,
      summary,
    };
  }

  private computeSummary(sales: SaleEntity[]): SalesSummary {
    const summary: SalesSummary = {
      total: sales.length,
      totalAmount: 0,
      totalUnits: 0,
      unitsByClientType: { Nuevo: 0, Existente: 0 },
      amountByClientType: { Nuevo: 0, Existente: 0 },
    };

    for (const sale of sales) {
      summary.totalAmount += Number(sale.amount);
      summary.totalUnits += sale.units;
      summary.unitsByClientType[sale.clientType] += sale.units;
      summary.amountByClientType[sale.clientType] += Number(sale.amount);
    }

    return summary;
  }
}
