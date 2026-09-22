# Review 74-sales-remove-house-seller-inputs

## Resultado: PASSED

Se verificaron todos los criterios de la sección `## 74-sales-remove-house-seller-inputs` de `CHECKPOINTS.md` contra el código y los artefactos en disco.

## Evidencia por criterio

- **Ventas Dirección no muestra controles de Vendedor — PASSED.** En `frontend/src/modules/sales/presentation/pages/SalesPage.tsx:487-624`, el formulario solo renderiza Fecha, Cuenta / Proyecto, Unidades Dirección, Monto Dirección y Notas Dirección. No existe label, `Select` ni `FieldError` de vendedor.
- **Registrar ATC no muestra controles de Vendedor — PASSED.** En `frontend/src/modules/sales/presentation/pages/SalesPage.tsx:628-726`, el formulario solo renderiza Fecha, Unidades ATC, Monto pagado ATC y Notas ATC. No existe label, `Select` ni `FieldError` de vendedor.
- **Ambos formularios usan internamente el seller activo “Dirección Comercial”, sin fallback al usuario — PASSED.** `SalesPage.tsx:65` fija el nombre exacto; `SalesPage.tsx:95-100` obtiene `directionSellerId` únicamente mediante `sellersData.find(seller => seller.active && seller.name === DIRECTION_SELLER_NAME)`. Dirección lo asigna en `SalesPage.tsx:194-206` y ATC en `SalesPage.tsx:229-241`. No hay referencia a `currentUser.id`, ni fallback equivalente, en el archivo.
- **Submit bloqueado con feedback si falta el seller interno — PASSED.** `handleDirSubmit` (`SalesPage.tsx:186-193`) y `handleAtcSubmit` (`SalesPage.tsx:221-228`) comprueban `!directionSellerId`, muestran `toast.error` con un mensaje amigable y ejecutan `return` antes de construir el input o llamar a `mutate`.
- **El formulario seller conserva el sellerId de sesión — PASSED.** `SalesPage.tsx:89-90` deriva `sellerId` de `currentUser?.sellerId`; `handleSellerSubmit` lo conserva en el input (`SalesPage.tsx:154-170`). El formulario sigue visible únicamente para Seller y mantiene su mutación independiente. El hook `useSellers` continúa auto-habilitado solo para Admin/Director en `frontend/src/modules/equipo/application/hooks/useSellers.ts`, por lo que no introduce una consulta prohibida para Seller.
- **TypeScript frontend — PASSED.** Se ejecutó `npx tsc --noEmit` desde `frontend/`; terminó con exit code 0. Solo se emitieron warnings npm sobre `node-linker` y `shamefully-hoist`, sin errores TypeScript.
- **Artefactos de implementación y review — PASSED.** Existe `progress/impl_74-sales-remove-house-seller-inputs.md` con resumen y verificación. Este documento constituye el review independiente solicitado.

## Observaciones

No se detectaron faltantes respecto del CHECKPOINT. No se modificó código, tests, `CHECKPOINTS.md` ni `feature_list.json` durante la revisión.
