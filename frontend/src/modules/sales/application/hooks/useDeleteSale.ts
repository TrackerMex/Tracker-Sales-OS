import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../../infrastructure/sales.api';

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
