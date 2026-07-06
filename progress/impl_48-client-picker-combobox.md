# Feature 48 — combobox buscable para selección de cliente

## Dependencia

- `cmdk` agregado a `frontend/package.json` en `dependencies` (no devDependencies), versión `^1.1.1`.

## Archivos creados

- `frontend/src/components/ui/popover.tsx` — wrapper shadcn de `radix-ui`'s `Popover`, mismo patrón que `dialog.tsx` (import unificado `radix-ui`, `cn`, `data-slot`).
- `frontend/src/components/ui/command.tsx` — wrapper shadcn de `cmdk`. Icono de búsqueda: `Search01Icon` de `@hugeicons/core-free-icons` (confirmado por introspección real del paquete, existen `SearchIcon`/`Search01Icon`/`Search02Icon`, se usó `Search01Icon`).
- `frontend/src/shared/components/forms/ClientCombobox.tsx` — componente reutilizable. API: `{ value, onSelect, initialLabel?, placeholder?, disabled?, error?, id? }`.
  - Debounce de 300ms sobre el input de búsqueda (`useEffect` + `setTimeout`, cleanup en `clearTimeout`).
  - `useClients({ q: debouncedSearch || undefined, limit: 20 })`.
  - Item fijo "Sin cliente" siempre visible arriba de los resultados.
  - Loading state: div simple "Buscando..." dentro de `CommandList` (no `CommandEmpty`, para no chocar con cmdk).
  - Empty state: `CommandEmpty` "Sin resultados."
  - Check (`Tick02Icon`) en el item cuyo `id === value`, mismo patrón visual que `dropdown-menu.tsx`.
  - Trigger: `Button variant="outline" role="combobox" aria-expanded aria-invalid={error}` — se reusa el estilo de error ya cableado en `buttonVariants` (`aria-invalid:border-destructive aria-invalid:ring-destructive/20`) en vez de la clase plana `.input-error` (que es CSS para `<input>`/`<select>` nativos, no aplica limpio a un `<button>`).
  - **Decisión de diseño relevante**: el reset de `selectedLabel` cuando `value` pasa a `""` desde fuera se implementa como ajuste de estado *durante el render* (patrón `if (value !== prevValue) { setPrevValue(value); ... }`) en vez de un `useEffect` con `setState` directo en el body, porque el linter del proyecto (`react-hooks/set-state-in-effect`, parte de `eslint-plugin-react-hooks@7`) lo marca como error. Es el patrón recomendado por la documentación de React ("You Might Not Need an Effect"). `tsc`/`eslint` quedan en 0 errores para este archivo.

## Archivos modificados (4 call sites)

### `frontend/src/modules/tasks/presentation/components/CreateTaskForm.tsx`
- Quitado `useClients({ limit: 200 })` y el array `clients` derivado.
- Nuevo estado `selectedClient: Client | null` (antes era `useMemo` sobre `clients`).
- Bloque "Ocupado ese día": ahora usa `t.clientName` (ya viene en `TaskDto` desde feature 47) en vez de `clients.find(...)`. Elimina el último uso de la lista de 200 clientes.
- `<select>` de cliente reemplazado por `<ClientCombobox>`; `onSelect` limpia `contactId` y `clientId` field error, igual que antes.

### `frontend/src/modules/tasks/presentation/components/EditTaskForm.tsx`
- Quitado `useClients({ limit: 200 })` y `clients`.
- Nuevo estado `selectedClient: Client | null` inicializado en `null` (antes derivado por `useMemo`).
- `<ClientCombobox initialLabel={task.clientName} ...>` — el nombre del cliente ya asignado se muestra de inmediato gracias a `task.clientName` (feature 47).
- **Caveat documentado**: `selectedClient` arranca en `null` aunque `clientId`/`initialLabel` ya tengan valor al montar. Los *contactos* del cliente preseleccionado no se re-derivan hasta que el usuario reabra el combobox y elija explícitamente un cliente (mismo cliente u otro). El `contactId` inicial (`task.contactId`) se preserva igual en el payload de submit porque el estado `contactId` no se toca hasta que el usuario cambia el cliente. No es una regresión: con el `<select>` de 200 items ya fallaba igual si el cliente no estaba en la primera página.

### `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`
- Quitado `useClients({ limit: 100 })` y `clients`.
- Nuevo estado `selectedClient: Client | null`, reemplaza la variable derivada `clients.find(...)`; los usos posteriores (`contacts`, `fetchAiSuggestions` con `selectedClient?.name`) apuntan al nuevo estado sin cambios de lógica.
- `<select>` de cliente reemplazado por `<ClientCombobox id="clientId" ...>`.
- **Caveat documentado**: se revisó `ActivitiesPage.tsx` (único consumidor de `ActivityForm`) — solo pasa `initialClientId` crudo desde `useSearch()` (route search param), sin ningún nombre de cliente resuelto en ese flujo. Por regla explícita del prompt, no se agregó una llamada extra al backend para resolver el nombre; **no se agregó `initialClientLabel`** porque no hay ningún dato disponible que pasar. Cuando se navega a `/actividades/nueva?clientId=X` (típicamente desde "Completar tarea"), el combobox mostrará el placeholder "Sin cliente" en vez del nombre real hasta que el usuario reabra y busque — mismo hueco que ya existía con `clients.find()` cuando el cliente no estaba entre los primeros 100.

### `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- Quitado `useClients({ limit: 200 })` (único consumidor de `clientsData` en el archivo, verificado con grep — las columnas Dirección/ATC no usan clientes).
- `<select>` reemplazado por `<ClientCombobox>`; `onSelect` deriva `sellerClientId`, `sellerClientName`, `sellerClientType` desde el objeto `Client` completo, igual que antes.
- **Caveat menor**: el `<select>` original tenía atributo HTML `required`, que bloqueaba el submit nativamente si no había cliente seleccionado. El trigger del combobox es un `<button>`, no participa en la validación nativa del `<form>`. La validación sigue ocurriendo (el backend devuelve el error y se muestra vía `sellerErrors.fieldErrors.clientId`/`FormErrorSummary`), pero ya no bloquea el submit del lado del cliente antes de la request. Mismo comportamiento que los otros 3 formularios migrados (ninguno tenía `required` client-side en el campo cliente).

## Resultado `tsc --noEmit`

0 errores (`cd frontend && pnpm exec tsc --noEmit` → exit code 0).

## Lint

Se corrió `eslint` sobre los 3 archivos nuevos y los 4 call sites modificados. Los archivos nuevos (`popover.tsx`, `command.tsx`, `ClientCombobox.tsx`) quedan en 0 errores/0 warnings. Se detectaron ~60 errores `react-hooks/refs` preexistentes en `SalesPage.tsx` (relacionados con `fieldErrorProps`/refs, no tocados por esta feature) y 2 warnings `exhaustive-deps` preexistentes en `CreateTaskForm.tsx` — confirmado con `git stash` que ya existían antes de esta feature, fuera de alcance.

## Dependencias añadidas

Solo `cmdk` (autorizada explícitamente). No se agregó ninguna otra dependencia.

## Fix post-review (regresión de selectedClient al montar)

Reviewer independiente encontró que `selectedClient` arrancaba en `null` en `EditTaskForm.tsx` y `ActivityForm.tsx`, dejando el selector de Contacto deshabilitado/vacío al montar aunque `clientId`/`initialLabel` ya tuvieran valor (editar tarea con cliente asignado, o flujo "Completar tarea" → nueva actividad). Fix 100% frontend, sin tocar backend ni tests.

### `frontend/src/shared/components/forms/ClientCombobox.tsx`
- Nuevo prop opcional `onResolve?: (client: Client) => void`, independiente de `onSelect`.
- Segunda llamada a `useClients({ q: initialLabel, limit: 5 }, { enabled: Boolean(onResolve && value && initialLabel) })`, separada de la query de búsqueda en vivo (`debouncedSearch`/`search` no se tocan).
- `useEffect` que busca en esos resultados el item cuyo `id === value` y llama `onResolve(match)` una sola vez, usando `useRef<string | null>` (`resolvedForValueRef`) para no repetirlo. El chequeo `resolvedForValueRef.current === value` vive **dentro** del efecto, no en el cuerpo de render — inicialmente se calculó `shouldResolve` leyendo el ref durante el render y el linter `react-hooks/refs` (regla nueva de `eslint-plugin-react-hooks@7`, "Cannot access refs during render") lo marcó como error; se corrigió moviendo toda lectura del ref al interior del `useEffect` y calculando `enabled` solo a partir de props/estado (`onResolve`, `value`, `initialLabel`).
- No dispara `onSelect`, no cierra el popover, no toca `selectedLabel` — hidratación silenciosa.

### `frontend/src/modules/clients/application/hooks/useClients.ts`
- Segundo parámetro opcional `options: { enabled?: boolean }` agregado a `useClients`, pasado a `useQuery({ enabled })`. Cambio retrocompatible — ningún call site existente pasa el segundo argumento y sigue con `enabled` implícito (`undefined`, equivalente a `true`).

### Guard de reselección (mismo cliente no resetea campos dependientes)
En `CreateTaskForm.tsx`, `EditTaskForm.tsx` y `ActivityForm.tsx`, el `onSelect` del combobox ahora compara `(client?.id ?? '') !== clientId` antes de resetear `contactId` (y en `ActivityForm` también `selectedOpportunityId`/`newOpportunityName`). Solo se resetean si el cliente realmente cambió.

### `EditTaskForm.tsx`
Agregado `onResolve={(client) => setSelectedClient(client)}` junto al `initialLabel={task.clientName}` ya existente. Al montar con una tarea que ya tiene cliente, si `task.clientName` matchea un resultado de búsqueda por nombre, `selectedClient` se hidrata automáticamente y el selector de Contacto deja de estar deshabilitado.

### Threading de `clientName` (flujo "Completar tarea" / "Registrar avance" → nueva actividad)
- `frontend/src/routes/_app/actividades.nueva.tsx`: `clientName?: string` agregado a `validateSearch`.
- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx` (`handleComplete`) y `frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx` (`handleCompleteTask`): agregan `...(completedTask.clientName ? { clientName: completedTask.clientName } : {})` al `search` del `navigate(...)`. Confirmado que `Task.clientName?: string | null` existe en `tasks.types.ts` (viene de feature 47) y que `completeTask`/`useCompleteTask` resuelven a `Task`.
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`: botón "Registrar avance" agrega `clientName: deal.clientName` al `search`.
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`: extrae `clientName` de `useSearch({ strict: false })` y lo pasa a `<ActivityForm initialClientLabel={clientName}>`.
- `frontend/src/modules/activities/presentation/components/ActivityForm.tsx`: nuevo prop `initialClientLabel?: string`, se pasa como `initialLabel` al `ClientCombobox` junto con `onResolve={(client) => setSelectedClient(client)}`.

### Verificación
- `cd frontend && pnpm exec tsc --noEmit` → 0 errores.
- `eslint` sobre los 8 archivos originales de la feature + los 5 nuevos tocados en este fix (`actividades.nueva.tsx`, `AgendaPage.tsx`, `MiDiaPage.tsx`, `ClientDetailPage.tsx`, `ActivitiesPage.tsx`): sin errores/warnings nuevos. Los únicos findings restantes son pre-existentes y no relacionados con este cambio, confirmado línea por línea contra `git diff`/commits previos:
  - `SalesPage.tsx`: ~62 errores `react-hooks/refs` preexistentes (patrón `fieldErrorProps`/refs, fuera de alcance, documentado desde la implementación original).
  - `CreateTaskForm.tsx`: 1 warning `exhaustive-deps` preexistente (`contacts` en `useMemo`).
  - `ActivityForm.tsx`: 2 errores `react-hooks/set-state-in-effect` preexistentes (efectos de `showDiscovery`/`stage`, código sin cambios desde antes de la feature 48, verificado contra `git show f10172b:...`).
  - `ClientDetailPage.tsx`: 1 error `no-unused-expressions` preexistente en `toggleExpand` (línea 42, no tocada — el único cambio en este archivo es agregar `clientName: deal.clientName` al `search` del botón "Registrar avance").
- `ClientCombobox.tsx` y `useClients.ts`: 0 errores/warnings.

### Caveats (reducidos respecto a la versión original)
Los 2 caveats documentados arriba (`EditTaskForm` y `ActivityForm`) ahora aplican **solo si el nombre no matchea ningún resultado de búsqueda por nombre** (cliente renombrado o eliminado) — antes aplicaban siempre al montar. En el caso común (cliente existe y su nombre no cambió), `selectedClient` se hidrata automáticamente sin interacción del usuario y el selector de Contacto queda habilitado con las opciones correctas desde el primer render útil.
