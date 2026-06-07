import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  });
};
