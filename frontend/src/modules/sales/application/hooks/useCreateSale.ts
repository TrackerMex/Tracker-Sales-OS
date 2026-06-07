import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../../infrastructure/sales.api';
import type { CreateSaleInput } from '../../domain/sales.types';

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
