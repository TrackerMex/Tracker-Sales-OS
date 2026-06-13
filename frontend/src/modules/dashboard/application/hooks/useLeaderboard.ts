import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'leaderboard'],
    queryFn: dashboardApi.getLeaderboard,
  });
};
