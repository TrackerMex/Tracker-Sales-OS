import { useState, useRef } from 'react';
import { toast } from 'sonner';
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
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49', marginBottom: 12 }}>Import / Export</h1>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Solo los administradores pueden acceder a esta sección.</p>
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
      toast.error('El archivo debe ser un archivo .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const missing = REQUIRED_KEYS.filter((k) => !(k in json));
        if (missing.length > 0) {
          const msg = `Faltan las siguientes secciones: ${missing.join(', ')}`;
          setError(msg);
          toast.error(msg);
          return;
        }
        setPreview(json as ExportData);
      } catch {
        setError('El archivo no contiene JSON válido');
        toast.error('El archivo no contiene JSON válido');
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
        toast.success('Datos importados correctamente');
      },
      onError: () => toast.error('No se pudo importar el archivo'),
    });
  }

  function handleCancel() {
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ maxWidth: 560 }} className="space-y-5">
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002B49' }}>Import / Export</h1>

      {/* Export */}
      <div className="card p-5 space-y-3">
        <div className="slabel">Exportar datos</div>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          Descarga un archivo JSON con todos los datos del sistema.
        </p>
        <button
          onClick={() => exportData()}
          disabled={isExporting}
          className="btn-primary"
          style={isExporting ? { opacity: 0.6 } : {}}
        >
          {isExporting ? 'Descargando...' : 'Descargar respaldo JSON'}
        </button>
      </div>

      {/* Import */}
      <div className="card p-5 space-y-3">
        <div className="slabel">Importar datos</div>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          Selecciona un archivo JSON de respaldo para importar.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-[#002B49] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#001E35] transition-colors cursor-pointer"
        />

        {error && (
          <p style={{ fontSize: 13, color: '#EF4444' }}>{error}</p>
        )}

        {preview && (
          <div className="space-y-3">
            <p style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Vista previa del archivo:</p>
            <ul className="empty-state text-left" style={{ padding: '12px 16px', listStyle: 'none' }}>
              {REQUIRED_KEYS.map((k) => (
                <li key={k} style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>{k}:</span>{' '}
                  {Array.isArray(preview[k]) ? `${(preview[k] as unknown[]).length} registros` : 'objeto'}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="btn-primary"
                style={isImporting ? { opacity: 0.6 } : {}}
              >
                {isImporting ? 'Importando...' : 'Importar datos'}
              </button>
              <button onClick={handleCancel} disabled={isImporting} className="btn-ghost">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {importSuccess && importResult && (
          <div
            className="rounded-lg px-4 py-3"
            style={{ background: '#F0FDF4', border: '1px solid #86EFAC', fontSize: 13, color: '#16A34A' }}
          >
            {importResult.message}
            {importResult.counts && (
              <ul style={{ marginTop: 8, listStyle: 'disc', paddingLeft: 16 }}>
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
