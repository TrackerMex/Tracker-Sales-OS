import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../infrastructure/reports.api';

export function useWinLoss() {
  return useQuery({
    queryKey: ['reports', 'win-loss'],
    queryFn: () => reportsApi.getWinLoss(),
  });
}
