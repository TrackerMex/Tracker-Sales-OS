import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importExportApi } from '../../infrastructure/import-export.api';
import type { ExportData } from '../../domain/import-export.types';

export function useImportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExportData) => importExportApi.importData(payload),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
