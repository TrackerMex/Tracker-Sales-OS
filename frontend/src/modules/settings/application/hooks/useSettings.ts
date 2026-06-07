import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../infrastructure/settings.api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });
}
