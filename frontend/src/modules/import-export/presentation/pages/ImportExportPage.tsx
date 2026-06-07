import { useState, useRef } from 'react';
import { useAppStore } from '@/shared/store/app.store';
import { UserRole } from '@/core/domain/types/common.types';
import { useExportData } from '../../application/hooks/useExportData';
import { useImportData } from '../../application/hooks/useImportData';
import type { ExportData } from '../../domain/import-export.types';

const REQUIRED_KEYS: (keyof ExportData)[] = [
  'sellers', 'users', 'clients', 'contacts',
  'deals', 'tasks', 'activities', 'sales', 'settings',
];

export function ImportExportPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === UserRole.Admin;

  const { mutate: exportData, isPending: isExporting } = useExportData();
  const { mutate: importData, isPending: isImporting, isSuccess: importSuccess, data: importResult } = useImportData();

  const [preview, setPreview] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h2 className="text-2xl font-black text-[#002B49]">Import / Export</h2>
        <p className="mt-4 text-sm text-slate-500">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);

    if (!file.name.endsWith('.json')) {
      setError('El archivo debe ser un archivo .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const missing = REQUIRED_KEYS.filter((k) => !(k in json));
        if (missing.length > 0) {
          setError(`Faltan las siguientes secciones: ${missing.join(', ')}`);
          return;
        }
        setPreview(json as ExportData);
      } catch {
        setError('El archivo no contiene JSON válido');
      }
    };
    reader.readAsText(file);
  }

  function handleConfirmImport() {
    if (!preview) return;
    importData(preview, {
      onSuccess: () => {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
      },
    });
  }

  function handleCancel() {
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h2 className="text-2xl font-black text-[#002B49]">Import / Export</h2>

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Exportar datos</p>
        <p className="text-sm text-slate-500">
          Descarga un archivo JSON con todos los datos del sistema.
        </p>
        <button
          onClick={() => exportData()}
          disabled={isExporting}
          className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#003a63] disabled:opacity-60 transition-colors"
        >
          {isExporting ? 'Descargando...' : 'Descargar respaldo JSON'}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Importar datos</p>
        <p className="text-sm text-slate-500">
          Selecciona un archivo JSON de respaldo para importar.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-[#002B49] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#003a63] transition-colors"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Vista previa del archivo:</p>
            <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
              {REQUIRED_KEYS.map((k) => (
                <li key={k}>
                  {k}: {Array.isArray(preview[k]) ? `${preview[k].length} registros` : 'objeto'}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#003a63] disabled:opacity-60 transition-colors"
              >
                {isImporting ? 'Importando...' : 'Importar datos'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isImporting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {importSuccess && importResult && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            {importResult.message}
            {importResult.counts && (
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(importResult.counts).map(([key, val]) => (
                  <li key={key}>{key}: {val}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
