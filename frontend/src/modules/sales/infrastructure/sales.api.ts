import { api } from '../../../shared/lib/axios';
import type { Sale, CreateSaleInput, UpdateSaleInput, SaleFilters, SalesListResponse } from '../domain/sales.types';

export const salesApi = {
  createSale: (input: CreateSaleInput): Promise<Sale> =>
    api.post<Sale>('/sales', input).then((r) => r.data),

  getSales: (filters: SaleFilters): Promise<SalesListResponse> =>
    api.get<SalesListResponse>('/sales', { params: filters }).then((r) => r.data),

  updateSale: async (id: string, input: UpdateSaleInput): Promise<Sale> => {
    const { data } = await api.patch<Sale>(`/sales/${id}`, input);
    return data;
  },

  deleteSale: async (id: string): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },
};
