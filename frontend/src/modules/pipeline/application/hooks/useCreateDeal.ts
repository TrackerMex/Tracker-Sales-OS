import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../../infrastructure/pipeline.api';
import type { CreateDealInput } from '../../domain/pipeline.types';

export const useCreateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => pipelineApi.createDeal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
};
