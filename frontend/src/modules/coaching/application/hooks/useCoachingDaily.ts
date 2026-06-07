import { useQuery } from '@tanstack/react-query';
import { coachingApi } from '../../infrastructure/coaching.api';

export const useCoachingDaily = (sellerId: string | null | undefined) => {
  return useQuery({
    queryKey: ['coaching', 'daily', sellerId],
    queryFn: () => coachingApi.getDailyReport(sellerId!),
    enabled: !!sellerId,
  });
};
