# Implementacion 52-shadcn-form-controls

## Archivos cambiados

- `frontend/src/modules/coaching/presentation/pages/CoachingPage.tsx`
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`

## Controles migrados

- `CoachingPage.tsx`: se reemplazo el select nativo del filtro de vendedor por `Select`, `SelectTrigger`, `SelectValue`, `SelectContent` y `SelectItem` de `@/components/ui/select`. Se conserva `selectedSellerId` como `string | null`, usando el valor sentinela `"all"` para la opcion "Todos los vendedores", con ancho `w-[220px]` y el mismo comportamiento de `displayedSellers`.
- `AgendaPage.tsx`: se reemplazo el select nativo del filtro de vendedor en vista calendario por `Select` de shadcn. Se conserva la visibilidad `viewMode === "calendar" && isAdminOrDirector`, los valores `"all"` o `seller.id`, la persistencia en `localStorage` con key `tasks_team_seller_filter` y el filtrado existente de `monthTasks`.

## Verificacion tsc

- Comando ejecutado desde `frontend`: `npx tsc --noEmit`
- Resultado: PASSED
- Notas: npm emitio warnings existentes por config `node-linker` y `shamefully-hoist`.

## Resultado rg residual

- Comando ejecutado: `rg -n "<select\\b|<textarea\\b|<input\\b" frontend/src/modules`
- Resultado: sin coincidencias.

## Residuos intencionales

- No quedan `<select`, `<textarea` ni `<input` nativos bajo `frontend/src/modules`.
