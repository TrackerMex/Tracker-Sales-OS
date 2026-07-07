# 58-shadcn-dropdown-actions

## Archivos modificados

- `frontend/src/modules/clients/presentation/pages/ClientesPage.tsx`
- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`
- `frontend/src/modules/sales/presentation/pages/SalesPage.tsx`
- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`
- `frontend/src/modules/activities/presentation/pages/ActivitiesPage.tsx`
- `frontend/src/modules/pipeline/presentation/pages/ClientDetailPage.tsx`
- `frontend/src/modules/reports/presentation/pages/ReportsPage.tsx`

## Acciones migradas a DropdownMenu

- Clientes: `Editar cliente` y `Eliminar cliente` en cada card de cliente.
- Tareas: `Editar tarea` y `Eliminar tarea` para pendientes; `Reactivar tarea` y `Eliminar tarea` para completadas.
- Ventas: `Editar venta` y `Eliminar venta` en historial para Admin/Director.
- Equipo: `Bloquear usuario` / `Activar usuario` y `Dar baja vendedor` / `Reactivar vendedor`.
- Actividades: `Ver historial` en cada actividad del día.
- Pipeline detalle: `Ver detalle` en cada actividad del historial comercial.
- Reportes: `Guardar metas`, `Copiar informe` y `Compartir informe` en el panel superior.

## Acciones primarias conservadas visibles

- `Completar` tarea queda visible para tareas pendientes.
- `Registrar actividad` queda visible en actividades.
- `Registrar avance` queda visible en detalle de oportunidad.
- `Abrir lámina` queda visible en reportes.
- Crear cliente/venta/usuario/vendedor y formularios principales no se ocultaron.

## Confirmaciones destructivas

- Clientes: `Eliminar cliente` sigue usando el `AlertDialog` existente vía `deleteTarget`.
- Tareas: `Eliminar tarea` y `Reactivar tarea` abren `AlertDialog` controlado desde el menú.
- Ventas: `Eliminar venta` sigue usando el `AlertDialog` existente vía `deletingSale`.
- Equipo no tenía `AlertDialog` previo para bloquear/activar usuarios ni dar baja/reactivar vendedores; se mantuvo el comportamiento existente y sólo se cambió el disparador a `DropdownMenuItem`.

## Verificación

- `cd frontend && npx tsc --noEmit`: PASSED.
- Warnings observados: npm reportó `Unknown project config "node-linker"` y `Unknown project config "shamefully-hoist"`.

## Caveats

- El script de contexto de la skill `impeccable` referenciado como `.Codex/skills/impeccable/scripts/context.mjs` no existe en este repo. Se continuó con `docs/conventions.md`, `frontend/src/core/` y los componentes shadcn locales.

## Fix-pass Equipo

- `frontend/src/modules/equipo/presentation/pages/EquipoPage.tsx`: las acciones de estado sensible en DropdownMenu ahora abren un `AlertDialog` controlado antes de ejecutar la mutación.
- Usuarios: `Bloquear usuario` / `Activar usuario` guardan la acción pendiente y confirman antes de llamar `blockUser.mutate(user.id)`.
- Vendedores: `Dar baja vendedor` / `Reactivar vendedor` guardan la acción pendiente y confirman antes de llamar `deactivateSeller.mutate(seller.id)`.
- El diálogo muestra la acción concreta y el nombre del usuario o vendedor afectado.
- Los botones de cancelar/confirmar se deshabilitan mientras la mutación está pendiente para evitar doble acción.

## Verificación fix-pass

- `cd frontend && npx tsc --noEmit`: PASSED.
- Warnings observados: npm reportó `Unknown project config "node-linker"` y `Unknown project config "shamefully-hoist"`.
