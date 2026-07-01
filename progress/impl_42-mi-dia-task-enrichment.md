# Impl 42-mi-dia-task-enrichment

## Objetivo
Enriquecer cada item de la lista "Agenda de hoy y pendientes" en Mi Día con nombre de cliente, nombre de contacto y badge del tipo de actividad, reusando el color-mapping ya existente en TaskCard. Sin cambios de backend, sin migraciones, sin tests nuevos.

## Archivos modificados

### frontend/src/modules/tasks/presentation/components/TaskCard.tsx
- Se exportó la constante existente: `const TYPE_TAG` -> `export const TYPE_TAG: Record<string, string> = {...}` (línea 38). Sin otros cambios en el archivo.

### frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx
- Imports agregados:
  - `useClients` desde `@/modules/clients/application/hooks/useClients`.
  - `TYPE_TAG` desde `../../../tasks/presentation/components/TaskCard` (mismo patrón relativo que `useTodayTasks`/`useCompleteTask`, que ya usan `../../../tasks/...`).
- Hook nuevo junto a los demás (`useMiDia`, `useTodayTasks`, `useCompleteTask`):
  ```ts
  const { data: clientsData } = useClients({ limit: 200 });
  const clients = clientsData?.data ?? [];
  ```
- Dentro de `taskList.map((task) => {...})`, después del cálculo de `cls`, se resolvió:
  ```ts
  const client = clients.find((c) => c.id === task.clientId);
  const contact = client?.contacts.find((c) => c.id === task.contactId);
  const typeTagClass = task.type ? (TYPE_TAG[task.type] ?? 'tag-gray') : null;
  ```
- En el JSX, debajo de la fila de título + tag "Vencida" (y por encima de `ti-time`), se agregó un bloque nuevo condicional (solo se renderiza si hay al menos un dato):
  ```tsx
  {(client || contact || typeTagClass) && (
    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
      {client && (
        <span className="text-[12px] font-semibold" style={{ color: '#334155' }}>
          {client.name}
        </span>
      )}
      {contact && (
        <span className="text-[11px]" style={{ color: 'var(--tracker-text-secondary)' }}>
          {contact.name}
        </span>
      )}
      {typeTagClass && (
        <span className={`tag ${typeTagClass}`}>{task.type}</span>
      )}
    </div>
  )}
  ```

## Decisiones de estilo
- Nombre de cliente: `text-[12px] font-semibold` con color `#334155` (mismo tono que usa TaskCard para el nombre de cliente, `color: '#334155'`, línea 75 de TaskCard.tsx), inline `style` porque el archivo ya mezcla clases utilitarias con `style={{...}}` en varios lugares (ej. KPI strip).
- Nombre de contacto: `text-[11px]` con `var(--tracker-text-secondary)` (variable de tema ya usada en el resto del archivo para texto secundario, en vez de hardcodear un gris).
- Badge de tipo: reutiliza exactamente la clase `tag ${typeTagClass}` tal como TaskCard, sin duplicar el mapping de colores.
- El bloque nuevo se ubica en una fila propia (`flex items-center gap-1.5 flex-wrap`) entre el título/tag "Vencida" y la hora (`ti-time`), sin alterar el layout título+hora+botón "Completar" a la derecha.
- Renderizado 100% condicional: si `client`, `contact` y `typeTagClass` son todos `null`/`undefined`, el `div` contenedor completo no se renderiza (evita fila vacía).
- No se tocó el botón "Completar" ni su condición `task.status === 'Pendiente' && !isAdminOrDirector`.

## Verificación
- `cd frontend && npx tsc --noEmit` -> EXIT 0, sin errores.
- No se modificó backend, no se agregaron/tocaron tests.

## Checkpoints
- [x] TaskCard exporta `TYPE_TAG` sin cambiar su comportamiento.
- [x] MiDiaPage muestra nombre de cliente cuando `task.clientId` resuelve a un cliente existente.
- [x] MiDiaPage muestra nombre de contacto cuando `task.contactId` resuelve a un contacto existente.
- [x] MiDiaPage muestra badge de tipo con el mismo color-mapping que TaskCard.
- [x] No se muestra nada cuando cliente/contacto/tipo no existen (sin "null" ni strings vacíos).
- [x] Layout original (título, hora, botón Completar) se mantiene intacto.
- [x] tsc --noEmit sin errores.

## Adición: íconos por elemento (HugeiconsIcon)

Se agregó un ícono a cada uno de los 3 elementos del bloque cliente/contacto/tipo, reusando el patrón exacto ya resuelto en `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx` (líneas 1-5 y 100-125), que usa `@hugeicons/react` + `@hugeicons/core-free-icons` (ya presentes en `package.json`, sin instalar nada nuevo).

- Import agregado en `MiDiaPage.tsx`:
  ```ts
  import { HugeiconsIcon } from '@hugeicons/react';
  import { OfficeIcon, User02Icon, CheckListIcon } from '@hugeicons/core-free-icons';
  ```
- Cliente (`client.name`): `OfficeIcon`, `size={12}`, `color="#334155"` (mismo tono que el texto del nombre). Span pasó a `inline-flex items-center gap-1 text-[12px] font-semibold`.
- Contacto (`contact.name`): `User02Icon`, `size={11}`, `color="#64748B"`. Span pasó a `inline-flex items-center gap-1 text-[11px]`.
- Badge de tipo (`task.type`): `CheckListIcon`, `size={11}`, `color="currentColor"` (hereda el color de texto de la clase `.tag`/`.tag-{navy|green|amber|gray}` correspondiente, sin mapear un color por variante). Span pasó de `tag ${typeTagClass}` a `` `tag ${typeTagClass} inline-flex items-center gap-1` ``.
- No se tocaron los guards condicionales existentes (`{client && (...)}`, `{contact && (...)}`, `{typeTagClass && (...)}`) ni el `div` contenedor `{(client || contact || typeTagClass) && (...)}`; los íconos solo se insertaron dentro de cada rama ya existente.
- No se tocó `ActivitiesPage.tsx`, backend, ni tests.

### Verificación
- `cd frontend && npx tsc --noEmit` -> sin errores (exit 0).
