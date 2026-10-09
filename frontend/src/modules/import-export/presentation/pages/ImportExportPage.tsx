import { useState, useRef } from "react"
import { toast } from "sonner"
import { useAppStore } from "@/shared/store/app.store"
import { UserRole } from "@/core/domain/types/common.types"
import { useExportData } from "../../application/hooks/useExportData"
import { useImportData } from "../../application/hooks/useImportData"
import type { ExportData } from "../../domain/import-export.types"
import type { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import {
  AlertCircleIcon,
  DownloadIcon,
  FolderIcon,
} from "@/shared/components/Icon"
import { STATUS_TILE_CLASS } from "@/shared/lib/status"
import { cn } from "@/lib/utils"

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

// Readable names for the backup sections (the JSON keys stay as they are).
const SECTION_LABELS: Record<string, string> = {
  sellers: "Vendedores",
  users: "Usuarios",
  clients: "Clientes",
  contacts: "Contactos",
  deals: "Oportunidades",
  tasks: "Tareas",
  activities: "Actividades",
  sales: "Ventas",
  settings: "Configuración",
}

interface PreviewRow {
  key: string
  label: string
  records: string
}

const PREVIEW_COLUMNS: ColumnDef<PreviewRow>[] = [
  {
    accessorKey: "label",
    header: "Sección",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.label}</span>
    ),
  },
  {
    accessorKey: "records",
    header: "Contenido",
    meta: { className: "text-right" },
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.records}
      </span>
    ),
  },
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
      <div>
        <PageHeader title="Import / Export" />
        <div className="border border-border bg-background">
          <EmptyState
            icon={<AlertCircleIcon size={20} />}
            title="Solo los administradores pueden acceder a esta sección."
          />
        </div>
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
          const msg = `Faltan las siguientes secciones: ${missing.map((k) => SECTION_LABELS[k] ?? k).join(", ")}`
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

  const previewRows: PreviewRow[] = preview
    ? REQUIRED_KEYS.map((k) => ({
        key: k,
        label: SECTION_LABELS[k] ?? k,
        records: Array.isArray(preview[k])
          ? `${(preview[k] as unknown[]).length} registros`
          : "objeto",
      }))
    : []

  return (
    <div>
      <PageHeader
        title="Import / Export"
        description="Respaldo y restauración de los datos del sistema"
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <SectionCard
          title="Exportar datos"
          icon={<DownloadIcon size={16} />}
          className="lg:col-span-5"
        >
          <div className="flex flex-col items-start gap-4 p-4">
            <p className="text-sm text-muted-foreground">
              Descarga un archivo JSON con todos los datos del sistema.
            </p>
            <Button onClick={() => exportData()} disabled={isExporting}>
              <DownloadIcon size={16} />
              {isExporting ? "Descargando..." : "Descargar respaldo JSON"}
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Importar datos"
          icon={<FolderIcon size={16} />}
          className="lg:col-span-7"
        >
          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm text-muted-foreground">
              Selecciona un archivo JSON de respaldo para importar.
            </p>
            <div>
              <Label htmlFor="import-file">Archivo de respaldo</Label>
              <Input
                id="import-file"
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mt-2 cursor-pointer"
                {...fieldErrorProps("import-file", error ?? undefined)}
              />
              <FieldError name="import-file" message={error ?? undefined} />
            </div>
          </div>

          {preview && (
            <>
              <h3 className="border-t px-4 py-3 text-sm font-medium">
                Vista previa del archivo
              </h3>
              <div className="border-t">
                <DataTable
                  columns={PREVIEW_COLUMNS}
                  data={previewRows}
                  getRowId={(r) => r.key}
                />
              </div>
              <div className="flex justify-end gap-2 border-t p-4">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isImporting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleConfirmImport} disabled={isImporting}>
                  {isImporting ? "Importando..." : "Importar datos"}
                </Button>
              </div>
            </>
          )}

          {importSuccess && importResult && (
            <div className="border-t p-4">
              <div
                role="status"
                className={cn("border p-4 text-sm", STATUS_TILE_CLASS.success)}
              >
                {importResult.message}
                {importResult.counts && (
                  <ul className="mt-2 list-disc pl-4">
                    {Object.entries(importResult.counts).map(([key, val]) => (
                      <li key={key}>
                        {SECTION_LABELS[key] ?? key}: {val}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
