# impl 51-shadcn-input-migration

## Paso 1 — Restyle de `frontend/src/components/ui/input.tsx`

String final de clases base (replica `.input` / `.input:focus` / `.input-error` de index.css):

```
w-full min-w-0 rounded-lg border-[1.5px] border-[var(--tracker-border)] bg-[var(--tracker-surface-alt)] px-3 py-2 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-muted-foreground focus:border-[var(--tracker-green)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--tracker-danger)] file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium
```

Las 4 CSS vars (`--tracker-border`, `--tracker-surface-alt`, `--tracker-green`, `--tracker-danger`) existen en `frontend/src/index.css` con esos nombres exactos. `.input` y `.input-error` se conservan en index.css (los siguen usando selects, textareas y ClientCombobox). Estructura del componente (data-slot, cn, spread) intacta. `SidebarInput` hereda el restyle (aceptado).

## Paso 2 — Migración por archivo

| Archivo | Inputs migrados |
|---|---|
| modules/auth/presentation/pages/LoginPage.tsx | 2 (text, password; clase condicional eliminada — fieldErrorProps pone aria-invalid) |
| modules/activities/presentation/components/ActivityForm.tsx | 9 (text x4, date x2, time x2, datetime-local; el time de ejecución sin fieldErrorProps usa `aria-invalid={!!fieldErrors.executedAt}`) |
| modules/tasks/presentation/components/CreateTaskForm.tsx | 2 (date, time; time usa `aria-invalid={!!fieldErrors.scheduledAt}`) |
| modules/tasks/presentation/components/EditTaskForm.tsx | 2 (date, time; time usa `aria-invalid={!!fieldErrors.scheduledAt}`) |
| modules/clients/presentation/pages/ClientesPage.tsx | 10 (search con `className="max-w-[360px]"`, name, domain, provider, units, expectedAmount, 4 de contacto); checkbox Decisor queda nativo |
| modules/settings/presentation/pages/SettingsPage.tsx | 1 (number; conserva style inline para !isAdmin) |
| modules/sales/presentation/components/SaleFormBase.tsx | 6 (clientId, clientName, product, units, amount, date); helper `inputClass()` se conserva porque los selects (clientType, pay, source) y el textarea (notes) lo siguen usando |
| modules/sales/presentation/pages/SalesPage.tsx | 11 (seller: product/units/amount/date; dirección: date/proyecto/units/amount; ATC: date/units/amount) |
| modules/sales/presentation/components/EditSaleModal.tsx | 5 (date, clientName, product, units, amount) |
| modules/equipo/presentation/pages/EquipoPage.tsx | 5 (nombre, perfil, usuario, password, nombre completo) |
| modules/reports/presentation/pages/ReportsPage.tsx | 4 (input del map de filtros + 3 metas number; conservan `style={{ width }}` inline) |
| modules/import-export/presentation/pages/ImportExportPage.tsx | 1 (type="file") |

Total: 58 inputs migrados.

## Decisión file input (ImportExportPage)

El input `type="file"` es VISIBLE (no hidden/sr-only; el ref solo se usa para resetear el value tras importar), por lo que se migró a `<Input>` conservando su className custom (clases `file:*` propias). Con twMerge sus clases custom ganan en conflicto; el cambio visual es que ahora gana el marco tracker (borde 1.5px + fondo surface-alt) alrededor del picker, consistente con el resto de la app.

## Verificación

- `npx tsc --noEmit` (frontend): exit 0.
- `grep -rn '<input' frontend/src/modules`: único residuo `clients/presentation/pages/ClientesPage.tsx:735` (checkbox Decisor, excluido por diseño).
- Diff limitado a input.tsx + los 12 archivos listados. No se tocaron selects, textareas, ClientCombobox, backend ni los cambios previos sin commitear (feature_list.json, progress/history.md, AgendaPage.tsx).
