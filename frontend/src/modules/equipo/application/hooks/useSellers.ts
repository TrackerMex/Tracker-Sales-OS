import { useQuery } from '@tanstack/react-query';
import { equipoApi } from '../../infrastructure/equipo.api';

export function useSellers() {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: () => equipoApi.getSellers(),
  });
}
