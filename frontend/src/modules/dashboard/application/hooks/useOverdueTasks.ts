import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../infrastructure/dashboard.api';

export const useOverdueTasks = () => {
  return useQuery({
    queryKey: ['dashboard', 'overdue-tasks'],
    queryFn: dashboardApi.getOverdueTasks,
  });
};
