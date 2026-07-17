import { useState, useRef } from "react"
import { toast } from "sonner"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useExportData } from "../../application/hooks/useExportData"
import { useImportData } from "../../application/hooks/useImportData"
import type { ExportData } from "../../domain/import-export.types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const REQUIRED_KEYS: (keyof ExportData)[] = [
  "sellers",
  "users",
  "clients",
  "contacts",
  "deals",
  "tasks",
  "activities",
  "sales",
  "settings",
]

export function ImportExportPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === UserRole.Admin

  const { mutate: exportData, isPending: isExporting } = useExportData()
  const {
    mutate: importData,
    isPending: isImporting,
    isSuccess: importSuccess,
    data: importResult,
  } = useImportData()

  const [preview, setPreview] = useState<ExportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isAdmin) {
    return (
      <div className="max-w-[560px]">
        <h1 className="mb-3 text-lg font-bold text-tracker-blue">
          Import / Export
        </h1>
        <p className="text-[13px] text-tracker-text-muted">
          Solo los administradores pueden acceder a esta sección.
        </p>
      </div>
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setPreview(null)

    if (!file.name.endsWith(".json")) {
      setError("El archivo debe ser un archivo .json")
      toast.error("El archivo debe ser un archivo .json")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const missing = REQUIRED_KEYS.filter((k) => !(k in json))
        if (missing.length > 0) {
          const msg = `Faltan las siguientes secciones: ${missing.join(", ")}`
          setError(msg)
          toast.error(msg)
          return
        }
        setPreview(json as ExportData)
      } catch {
        setError("El archivo no contiene JSON válido")
        toast.error("El archivo no contiene JSON válido")
      }
    }
    reader.readAsText(file)
  }

  function handleConfirmImport() {
    if (!preview) return
    importData(preview, {
      onSuccess: () => {
        setPreview(null)
        if (fileRef.current) fileRef.current.value = ""
        toast.success("Datos importados correctamente")
      },
      onError: () => toast.error("No se pudo importar el archivo"),
    })
  }

  function handleCancel() {
    setPreview(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="max-w-[560px] space-y-5">
      <h1 className="text-lg font-bold text-tracker-blue">Import / Export</h1>

      {/* Export */}
      <div className="card space-y-3 p-5">
        <div className="slabel">Exportar datos</div>
        <p className="text-[13px] text-tracker-text-secondary">
          Descarga un archivo JSON con todos los datos del sistema.
        </p>
        <Button onClick={() => exportData()} disabled={isExporting}>
          {isExporting ? "Descargando..." : "Descargar respaldo JSON"}
        </Button>
      </div>

      {/* Import */}
      <div className="card space-y-3 p-5">
        <div className="slabel">Importar datos</div>
        <p className="text-[13px] text-tracker-text-secondary">
          Selecciona un archivo JSON de respaldo para importar.
        </p>

        <Input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="block w-full cursor-pointer text-sm text-slate-500 transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-[#002B49] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#001E35]"
        />

        {error && <p className="text-[13px] text-red-500">{error}</p>}

        {preview && (
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-tracker-text-dim">
              Vista previa del archivo:
            </p>
            <ul className="empty-state list-none px-4 py-3 text-left">
              {REQUIRED_KEYS.map((k) => (
                <li key={k} className="text-xs">
                  <span className="font-semibold text-tracker-text-dim">
                    {k}:
                  </span>{" "}
                  {Array.isArray(preview[k])
                    ? `${(preview[k] as unknown[]).length} registros`
                    : "objeto"}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? "Importando..." : "Importar datos"}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isImporting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {importSuccess && importResult && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-[13px] text-tracker-success">
            {importResult.message}
            {importResult.counts && (
              <ul className="mt-2 list-disc pl-4">
                {Object.entries(importResult.counts).map(([key, val]) => (
                  <li key={key}>
                    {key}: {val}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
