import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/shared/store/app.store';
import { UserRole } from '@/core/domain/types/common.types';
import { equipoApi } from '../../infrastructure/equipo.api';

export function useSellers() {
  const role = useAppStore((s) => s.currentUser?.role);
  return useQuery({
    queryKey: ['sellers'],
    queryFn: () => equipoApi.getSellers(),
    // GET /sellers is Admin/Director-only in backend; avoid 403s as Seller
    enabled: role === UserRole.Admin || role === UserRole.Director,
  });
}
