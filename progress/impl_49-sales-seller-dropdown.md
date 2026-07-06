# Impl — Feature 49: sales-seller-dropdown

## Resumen

Se eliminó el fallback `?? currentUser?.id` al construir `sellerId` en `SalesPage.tsx` y se agregó un dropdown "Vendedor" a los dos formularios de casa (Ventas Dirección y Registrar ATC, visibles solo para Admin/Director). Ningún path de código puede ya enviar el USER id como `sales.seller_id`, lo que evita el 500 con la FK inminente `sales.seller_id → sellers.id`.

## Cambios en `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`

1. **Línea del bug**: ahora `const sellerId = currentUser?.sellerId ?? ''`. Ese `sellerId` se sigue usando sin cambios para el form del rol Seller y el filtro de `useSales` (comportamiento idéntico para Seller).
2. **Listado de sellers**: se usa `useSellers()` de `@/modules/equipo/application/hooks/useSellers`. No hizo falta condicionar la llamada: el hook ya se auto-gatea internamente con `enabled: role === Admin || Director` (evita 403 como Seller). Se filtran solo sellers con `active === true`.
3. **Estado independiente por form**: `dirSellerId` y `atcSellerId`.
4. **Default "Dirección Comercial"**: un `useEffect` dependiente de `sellersData` (referencia estable de react-query, no del array filtrado que cambia por render) busca el seller activo con `name === 'Dirección Comercial'` y lo setea con updater funcional `prev || direccion.id`, de modo que solo aplica cuando el estado sigue vacío y nunca pisa una selección manual. Si no existe ese seller, el select queda sin selección y el atributo `required` (con `<option value="">`) bloquea el submit.
5. **Submit**: `handleDirSubmit` envía `sellerId: dirSellerId`; `handleAtcSubmit` envía `sellerId: atcSellerId`. El vendedor seleccionado NO se resetea en `onSuccess` (uso típico: varias ventas seguidas del mismo vendedor).
6. **Estilo e integración de errores**: mismo patrón que los selects existentes del archivo — className condicional `input` / `input input-error`, label `slabel mb-1` (con `style={{ color: '#94A3B8' }}` en el form Dirección), `{...fieldErrorProps('sellerId', ...)}`, `<FieldError name="sellerId" .../>` y `clearField('sellerId')` en onChange, contra `dirErrors` / `atcErrors` respectivamente.

## Decisiones

- El select "Vendedor" se colocó como primer campo de cada form (identifica a quién pertenece la venta antes del resto de datos).
- `SaleFormBase.tsx` no se tocó: SalesPage no lo importa (verificado en los imports del archivo).
- No se tocó el form de vendedor (Seller), ni backend, ni tests.

## Archivos tocados

- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx` (único archivo modificado)

## Verificación

- `cd frontend && npx tsc --noEmit` → exit 0.
- `grep currentUser.id` en `frontend/src/modules/sales/` → 0 coincidencias.
