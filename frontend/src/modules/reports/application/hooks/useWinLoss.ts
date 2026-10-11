import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/core/domain/types/common.types';
import { useAppStore } from '@/shared/store/app.store';
import { reportsApi } from '../../infrastructure/reports.api';

export function useWinLoss() {
  const role = useAppStore((s) => s.currentUser?.role);
  return useQuery({
    queryKey: ['reports', 'win-loss'],
    queryFn: () => reportsApi.getWinLoss(),
    enabled: role === UserRole.Admin || role === UserRole.Director,
  });
}
