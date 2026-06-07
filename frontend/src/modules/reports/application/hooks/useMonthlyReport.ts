import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../infrastructure/reports.api';

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => reportsApi.getMonthly(month),
    enabled: !!month,
  });
}
