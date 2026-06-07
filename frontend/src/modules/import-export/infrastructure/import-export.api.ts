import { api } from '@/shared/lib/axios';
import type { ExportData, ImportResult } from '../domain/import-export.types';

export const importExportApi = {
  exportData: async (): Promise<ExportData> => {
    const { data } = await api.get<ExportData>('/export');
    return data;
  },

  importData: async (payload: ExportData): Promise<ImportResult> => {
    const { data } = await api.post<ImportResult>('/import', payload);
    return data;
  },
};
