# Feature 15: Import/Export — Frontend Implementation

## Files Created

| File | Description |
|------|-------------|
| `frontend/src/modules/import-export/domain/import-export.types.ts` | ExportData and ImportResult interfaces |
| `frontend/src/modules/import-export/infrastructure/import-export.api.ts` | API layer with exportData and importData |
| `frontend/src/modules/import-export/application/hooks/useExportData.ts` | Mutation hook that exports and downloads JSON blob |
| `frontend/src/modules/import-export/application/hooks/useImportData.ts` | Mutation hook that posts import and invalidates queries |
| `frontend/src/modules/import-export/presentation/pages/ImportExportPage.tsx` | Page with Export card and Import card (file input, validation, preview, confirm) |
| `frontend/src/routes/_app/import-export.tsx` | TanStack Router route definition |

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Added importExportRoute to route tree |
| `frontend/src/shared/components/layout/Sidebar.tsx` | Added 'Import / Export' nav item after Configuración |

## Notes
- Page only renders for Admin users (role check at component level)
- Import validates JSON structure client-side before sending (checks all 9 required keys)
- Export creates a dated .json blob download
- Matches existing SettingsPage styling patterns
- TypeScript compiles without errors
