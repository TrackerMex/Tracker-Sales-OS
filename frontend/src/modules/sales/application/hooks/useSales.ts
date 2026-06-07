import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../../infrastructure/sales.api';
import type { SaleFilters } from '../../domain/sales.types';

export const useSales = (filters: SaleFilters = {}) => {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesApi.getSales(filters),
  });
};
