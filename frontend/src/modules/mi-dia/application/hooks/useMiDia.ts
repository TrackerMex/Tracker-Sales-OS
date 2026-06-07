import { useQuery } from '@tanstack/react-query';
import { miDiaApi } from '../../infrastructure/mi-dia.api';

export const useMiDia = (sellerId: string | null | undefined) => {
  return useQuery({
    queryKey: ['mi-dia', sellerId],
    queryFn: () => miDiaApi.getMiDia(sellerId!),
    enabled: !!sellerId,
  });
};
