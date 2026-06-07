import { useQuery } from '@tanstack/react-query';
import { equipoApi } from '../../infrastructure/equipo.api';

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => equipoApi.getUsers(page),
  });
}
