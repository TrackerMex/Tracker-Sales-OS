# Review — Feature 49: sales-seller-dropdown

Reviewer: subagente Reviewer (solo lectura). Fecha: 2026-07-06.
Archivo revisado: `frontend/src/modules/sales/presentation/pages/SalesPage.tsx` (único archivo de código modificado; diff verificado con `git diff -- frontend/src/modules/sales/`).

## Checklist

| # | Criterio | Veredicto | Evidencia |
|---|----------|-----------|-----------|
| 1 | Fallback `?? currentUser?.id` eliminado | PASS | SalesPage.tsx:46 `const sellerId = currentUser?.sellerId ?? '';`. Grep `currentUser\??\.id` en `frontend/src/modules/sales/` → 0 coincidencias. |
| 2 | Select "Vendedor" en form Dirección con estado propio e integración de errores | PASS | Estado `dirSellerId` (L66). Select en L355-368: className condicional `dirErrors.fieldErrors.sellerId ? 'input input-error' : 'input'` (L356), `value={dirSellerId}` (L357), onChange con `setDirSellerId` + `dirErrors.clearField('sellerId')` (L358), `required` (L359), `{...fieldErrorProps('sellerId', dirErrors.fieldErrors.sellerId)}` (L360), `<option value="">Seleccionar vendedor</option>` (L362), `<FieldError name="sellerId" message={dirErrors.fieldErrors.sellerId} />` (L369). Label `slabel mb-1` con `style={{ color: '#94A3B8' }}` (L352-354), igual que los demás labels del form (L373, L388, L408, L424, L441). |
| 3 | Ídem en form ATC | PASS | Estado `atcSellerId` (L74). Select en L474-487 contra `atcErrors`: className condicional (L475), onChange con `clearField('sellerId')` (L477), `required` (L478), `fieldErrorProps` (L479), option vacía (L481), `FieldError` (L488). Label `slabel mb-1` sin style inline (L473) — consistente con el patrón del form ATC, cuyos labels no usan `#94A3B8` (L492, L505, L519, L534); ese style es exclusivo del form Dirección por su fondo oscuro. |
| 4 | Dropdown poblado con useSellers() y filtrado a activos | PASS | `useSellers()` (useSellers.ts:6-14) no recibe args y retorna `useQuery` sobre `equipoApi.getSellers(): Promise<EquipoSeller[]>` (equipo.api.ts:25). El tipo real es `EquipoSeller` con campo `active: boolean` (equipo.types.ts:18) — el filtro usa el campo correcto: `(sellersData ?? []).filter((s) => s.active)` (SalesPage.tsx:51) y `s.active` en el effect (L82). Extra: el hook se auto-gatea con `enabled: role === Admin \|\| Director` (useSellers.ts:12), sin riesgo de 403 para Seller. |
| 5 | Default "Dirección Comercial" sin pisar selección manual | PASS | useEffect L81-86 dependiente de `sellersData` (referencia estable de react-query): busca `s.active && s.name === 'Dirección Comercial'`; setea con updater funcional `setDirSellerId((prev) => prev \|\| direccion.id)` y `setAtcSellerId((prev) => prev \|\| direccion.id)` — solo aplica si el estado está vacío, nunca pisa selección manual. Si no existe el seller, `return` temprano (L83): el select queda en `''` y `required` + `<option value="">` bloquean el submit. |
| 6 | Submit envía el estado del dropdown; no se resetea en onSuccess | PASS | `handleDirSubmit`: `sellerId: dirSellerId` (L139). `handleAtcSubmit`: `sellerId: atcSellerId` (L168). onSuccess de Dirección resetea solo project/units/amount/date/notes (L153-160); onSuccess de ATC solo units/amount/date/notes (L182-188). Ni `dirSellerId` ni `atcSellerId` se tocan. |
| 7 | Comportamiento idéntico para role Seller (form + filtro useSales) | PASS (con observación) | `handleSellerSubmit` sigue usando la variable `sellerId` (L107) y el filtro `useSales(!isAdminOrDirector ? { sellerId } : {})` (L100-102) es byte-idéntico al de HEAD (verificado con `git show HEAD:...`). Para un Seller con `sellerId` vinculado (invariante normal) el comportamiento es idéntico. Observación (edge case preexistente, no introducido por esta feature): un Seller con `sellerId = null` ahora enviaría `sellerId=''` en el filtro; el backend hace `if (filters.sellerId)` (sale.repository.impl.ts:66) y omitiría el filtro (antes filtraba por su user.id → 0 resultados). El backend GET /sales ya permite a cualquier Seller consultar sin filtro (sales.controller.ts:33-41, sin scoping por rol), así que no es una exposición nueva; y en el submit, `''` sería rechazado por `@IsUUID()` (create-sale.dto.ts:17) con 400 — mejor que el bug previo de guardar el USER id. |
| 8 | SaleFormBase.tsx, backend y tests intactos | PASS | `git status --porcelain`: solo `M feature_list.json` (tracking del Líder, esperado por workflow), `M SalesPage.tsx` y `?? progress/impl_49-...md` (esperado). `git diff --stat -- backend/ frontend/src/modules/equipo frontend/src/shared` → vacío. `git diff --name-only HEAD -- '*SaleFormBase*'` → vacío. Ningún archivo de test tocado. |
| 9 | `npx tsc --noEmit` exit 0 | PASS | Ejecutado por el Reviewer en `frontend/`: EXIT CODE: 0. |
| 10 | Sin regresión de layout | PASS | Cada select está dentro del `<form>` correcto: el de Dirección bajo `dirErrors.formRef` (form L348, dentro de la columna `isAdminOrDirector` L343-463); el de ATC bajo `atcErrors.formRef` (form L469, columna L466-554). Ambos envueltos en `<div>` de una columna dentro del `space-y-3`, mismo patrón que Fecha/Unidades/Monto/Notas; no se insertan en ningún sub-grid `1fr 1fr`, así que el grid de la página (L203) no cambia. |

## Observaciones menores (no bloqueantes)

- El default depende del nombre literal `'Dirección Comercial'` (L82). Si ese seller se renombra en prod, el default deja de aplicar; el `required` cubre el caso, degradación aceptable y alineada con la descripción de la feature ("default ... si existe").
- Edge case documentado en el ítem 7: Seller sin `sellerId` vinculado vería el listado sin filtrar (comportamiento del backend preexistente, fuera del alcance de esta feature frontend).

## Veredicto final

**PASSED** — 10 PASS / 0 FAIL.

El bug queda cerrado: ningún path de código en SalesPage puede enviar un USER id como `sales.seller_id`; los forms Dirección/ATC exigen un seller real del catálogo (activos), con default a "Dirección Comercial" cuando existe.
