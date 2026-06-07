import { IRepository } from '../../../../core/domain/repository.interface';
import { SaleEntity, SaleType } from '../entities/sale.entity';

export const SALE_REPOSITORY = 'SALE_REPOSITORY';

export interface SaleFilters {
  month?: string; // 'YYYY-MM'
  sellerId?: string;
  type?: SaleType;
}

export interface ISaleRepository extends IRepository<SaleEntity> {
  findWithFilters(
    filters: SaleFilters,
    page: number,
    limit: number,
  ): Promise<{ data: SaleEntity[]; total: number }>;
}
