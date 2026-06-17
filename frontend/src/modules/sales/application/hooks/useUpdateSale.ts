import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../../infrastructure/sales.api';
import type { UpdateSaleInput } from '../../domain/sales.types';

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSaleInput }) =>
      salesApi.updateSale(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
