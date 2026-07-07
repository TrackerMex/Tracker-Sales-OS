# Implementacion 55-shadcn-dialog-sizing

## Archivos modificados

- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`
- `frontend/src/modules/pipeline/presentation/pages/PipelinePage.tsx`
- `frontend/src/modules/sales/presentation/components/EditSaleModal.tsx`
- `frontend/src/modules/activities/presentation/components/ActivityHistoryModal.tsx`
- `progress/impl_55-shadcn-dialog-sizing.md`

## Decisiones de tamano y layout

- Clientes: el `DialogContent` de crear/editar cliente ahora usa `w-[min(calc(100vw-2rem),1120px)]`, `max-h-[92vh]`, `overflow-y-auto`, `max-w-none` y `sm:max-w-none` para superar el limite responsive base de shadcn. El formulario pasa a una grilla `grid-cols-1 md:grid-cols-2` para evitar overflow en mobile y conservar dos columnas utiles en desktop.
- Clientes/contactos: la fila de contactos deja de forzar cinco columnas en todos los tamanos. Ahora usa una columna en mobile, dos en `md`, y cinco columnas solo en `xl`, con `minmax(0,...)` y `min-w-0` en inputs para que placeholders como nombre, rol, telefono y correo no se recorten innecesariamente.
- Tareas: `CreateTaskForm` y `EditTaskForm` pasan de 640px a `w-[min(calc(100vw-2rem),780px)]`, manteniendo `max-h-[92vh]` y scroll vertical. Las grillas internas de tipo/contacto y fecha/hora ahora son responsive (`grid-cols-1 sm:grid-cols-2`).
- Ventas: `EditSaleModal` pasa a `w-[min(calc(100vw-2rem),720px)]`, con `max-h-[90vh]` y scroll. La grilla de unidades/monto ahora evita columnas estrechas en mobile.
- Actividades: `ActivityHistoryModal` pasa a `w-[min(calc(100vw-2rem),760px)]`, con `max-h-[90vh]` y scroll para que el historial tenga mas ancho en desktop sin romper mobile.
- Pipeline: el dialog de motivo de perdida se amplia moderadamente a 460px. El sheet de detalle usa `data-[side=right]:w-full`, `data-[side=right]:sm:max-w-[640px]` y `data-[side=right]:lg:max-w-[720px]` para mostrar mejor el detalle real del deal.

## Restricciones verificadas

- Se mantuvieron `Dialog`, `AlertDialog` y `Sheet` de shadcn/ui.
- No se agregaron overlays custom.
- No se agregaron `confirm()` ni `alert()` nativos.
- No se modificaron tests, core ni archivos fuera de los paths permitidos.

## TypeScript

- Comando: `npx tsc --noEmit` dentro de `frontend`
- Resultado: PASSED
- Notas: npm mostro warnings existentes sobre configs `node-linker` y `shamefully-hoist`, sin fallar la compilacion.
