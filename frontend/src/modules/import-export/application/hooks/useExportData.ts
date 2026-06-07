import { useMutation } from '@tanstack/react-query';
import { importExportApi } from '../../infrastructure/import-export.api';

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const data = await importExportApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    },
  });
}
