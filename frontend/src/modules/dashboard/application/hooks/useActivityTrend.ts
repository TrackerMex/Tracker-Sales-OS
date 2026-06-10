import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export function useActivityTrend() {
  return useQuery({
    queryKey: ['dashboard', 'activity-trend'],
    queryFn: dashboardApi.getActivityTrend,
    staleTime: 5 * 60 * 1000,
  });
}
