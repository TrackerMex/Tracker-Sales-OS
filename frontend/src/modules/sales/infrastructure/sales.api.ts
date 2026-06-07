import { api } from '../../../shared/lib/axios';
import type { Sale, CreateSaleInput, SaleFilters, SalesListResponse } from '../domain/sales.types';

export const salesApi = {
  createSale: (input: CreateSaleInput): Promise<Sale> =>
    api.post<Sale>('/sales', input).then((r) => r.data),

  getSales: (filters: SaleFilters): Promise<SalesListResponse> =>
    api.get<SalesListResponse>('/sales', { params: filters }).then((r) => r.data),
};
