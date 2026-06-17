import { useQuery } from '@tanstack/react-query';
import { pipelineApi } from '../../infrastructure/pipeline.api';

export const useTeamPipeline = (enabled: boolean) => {
  return useQuery({
    queryKey: ['pipeline', 'team'],
    queryFn: () => pipelineApi.getPipelineTeam(),
    enabled,
  });
};
