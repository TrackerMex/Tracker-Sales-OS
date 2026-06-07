import { api } from '@/shared/lib/axios';
import type { AppSettings, UpdateSettingsInput } from '../domain/settings.types';

export const settingsApi = {
  get: async (): Promise<AppSettings> => {
    const { data } = await api.get<AppSettings>('/settings');
    return data;
  },
  update: async (input: UpdateSettingsInput): Promise<AppSettings> => {
    const { data } = await api.patch<AppSettings>('/settings', input);
    return data;
  },
};
