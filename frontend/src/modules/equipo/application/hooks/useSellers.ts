import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/shared/store/app.store';
import { UserRole } from '@/core/domain/types/common.types';
import { equipoApi } from '../../infrastructure/equipo.api';

export function useSellers(includeInactive = false) {
  const role = useAppStore((s) => s.currentUser?.role);
  const management = includeInactive && role === UserRole.Admin;
  return useQuery({
    queryKey: management ? ['sellers', 'all'] : ['sellers'],
    queryFn: () => management ? equipoApi.getAllSellers() : equipoApi.getSellers(),
    enabled: role === UserRole.Admin || role === UserRole.Director,
  });
}
