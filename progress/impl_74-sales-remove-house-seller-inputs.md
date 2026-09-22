# Implementación 74-sales-remove-house-seller-inputs

## Cambios

- Se eliminaron por completo el label, el `Select` y el `FieldError` de Vendedor de los formularios **Ventas Dirección** y **Registrar ATC**.
- Ambos formularios resuelven internamente el ID del seller activo cuyo nombre exacto es `Dirección Comercial`.
- Los dos handlers detienen el submit y muestran un toast amigable cuando ese seller aún no está disponible, por lo que nunca se ejecuta una mutación con `sellerId` vacío.
- No se agregó fallback a `currentUser.id`.
- El formulario de venta de vendedor conserva `sellerId` obtenido de `currentUser.sellerId`.
- Se retiraron los estados, callbacks y el `useEffect` que solo daban soporte a los selects eliminados.

## Archivos

- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`

## Verificación

- `npx tsc --noEmit` ejecutado desde `frontend`: **PASSED** (exit code 0).
- npm mostró únicamente warnings de configuración por `node-linker` y `shamefully-hoist`; no hubo errores de TypeScript.
- Búsqueda estática confirmó que no quedan `dirSellerId`, `atcSellerId`, `activeSellers` ni referencias a `currentUser.id` en `SalesPage.tsx`.
