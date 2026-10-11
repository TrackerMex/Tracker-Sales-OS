import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/core/domain/types/common.types';
import { useAppStore } from '@/shared/store/app.store';
import { reportsApi } from '../../infrastructure/reports.api';

export function useMonthlyReport(month: string) {
  const role = useAppStore((s) => s.currentUser?.role);
  return useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => reportsApi.getMonthly(month),
    enabled: !!month && (role === UserRole.Admin || role === UserRole.Director),
  });
}
