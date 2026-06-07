import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/shared/store/app.store';
import { pipelineApi } from '../../infrastructure/pipeline.api';

export const usePipeline = () => {
  const currentUser = useAppStore((s) => s.currentUser);
  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? '';

  return useQuery({
    queryKey: ['pipeline', sellerId],
    queryFn: () => pipelineApi.getPipelineBySeller(sellerId),
    enabled: !!sellerId,
  });
};
