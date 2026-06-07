import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export const useSellersSemaphore = () => {
  return useQuery({
    queryKey: ['dashboard', 'sellers-score'],
    queryFn: dashboardApi.getSellersScore,
  });
};
