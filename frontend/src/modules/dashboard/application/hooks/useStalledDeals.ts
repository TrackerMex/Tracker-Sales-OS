import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export const useStalledDeals = () => {
  return useQuery({
    queryKey: ['dashboard', 'stalled-deals'],
    queryFn: dashboardApi.getStalledDeals,
  });
};
