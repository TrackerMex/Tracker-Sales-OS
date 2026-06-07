import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../infrastructure/settings.api';

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
