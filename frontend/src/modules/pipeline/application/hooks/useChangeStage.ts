import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../../infrastructure/pipeline.api';
import type { ChangeStageInput } from '../../domain/pipeline.types';

interface ChangeStageVariables {
  dealId: string;
  input: ChangeStageInput;
}

export const useChangeStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: ChangeStageVariables) =>
      pipelineApi.changeStage(dealId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
};
