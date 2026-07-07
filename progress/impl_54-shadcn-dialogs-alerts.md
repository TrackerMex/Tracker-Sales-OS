# 54-shadcn-dialogs-alerts

## Archivos cambiados

- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx`
- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- `frontend/src/modules/sales/presentation/components/EditSaleModal.tsx`

## Modales migrados

- `ClientesPage.tsx`: el modal custom de crear/editar cliente ahora usa `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` y `DialogDescription`. Se conserva el formulario, `formRef`, submit, errores, flujo create/edit y cierre.
- `CreateTaskForm.tsx`: el wrapper custom `fixed inset-0`/`modal-blur` ahora usa `Dialog` controlado con cierre vía `onOpenChange`.
- `EditTaskForm.tsx`: el wrapper custom `fixed inset-0`/`modal-blur` ahora usa `Dialog` controlado con cierre vía `onOpenChange`.
- `PipelinePage.tsx`: el modal de motivo de pérdida ahora usa `Dialog`; conserva `lossReason`, `handleConfirmLoss`, cierre por overlay/escape y estado `changeStage.isPending`.
- `PipelinePage.tsx`: el slide-over custom de `selectedDeal` ahora usa `Sheet` con `ClientDetailPage` dentro y cierre vía `onBack`/`onOpenChange`.

## Confirmaciones migradas

- `ClientesPage.tsx`: la confirmación de eliminar cliente ahora usa `AlertDialog` controlado con `open={!!deleteTarget}`; mantiene `deleteClient.isPending`, error visible y `confirmDelete`.
- `SalesPage.tsx`: la confirmación destructiva de eliminar venta cambió de `Dialog` a `AlertDialog`.

## Revisiones sin cambio funcional

- `ClientDetailPage.tsx`: no tiene overlay custom propio; se mantiene `onBack` para cerrar el contenedor externo.
- `ActivityHistoryModal.tsx`: ya usaba `Dialog`; se agregó `DialogDescription`.
- `EditSaleModal.tsx`: ya usaba `Dialog`; se agregó `DialogDescription`.

## Residuos intencionales

- Ninguno en los paths verificados. `rg` no encontró residuos de `fixed inset-0`, `modal-blur`, `window.confirm`, `confirm(` o `alert(` en `frontend/src/modules`, `frontend/src/shared` ni `frontend/src/routes`.

## Verificación

- `npx tsc --noEmit` desde `frontend`: PASSED. npm mostró warnings no bloqueantes por configs `node-linker` y `shamefully-hoist`.
- `rg -n "fixed inset-0|modal-blur|window\.confirm|confirm\(|alert\(" frontend/src/modules frontend/src/shared frontend/src/routes`: sin resultados.
