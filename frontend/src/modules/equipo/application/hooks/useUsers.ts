import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/core/domain/types/common.types';
import { useAppStore } from '@/shared/store/app.store';
import { equipoApi } from '../../infrastructure/equipo.api';

export function useUsers(page = 1) {
  const role = useAppStore((s) => s.currentUser?.role);
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => equipoApi.getUsers(page),
    enabled: role === UserRole.Admin,
  });
}
