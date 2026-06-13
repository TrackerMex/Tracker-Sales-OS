# Impl 22-overdue-tasks-badge

## Objetivo
Mostrar badge rojo "Vencida" (pill) en tareas vencidas y pendientes, en Agenda (TaskCard) y Mi Día (MiDiaPage). Sin tocar backend, sin nueva lógica de fecha.

## Archivos modificados

### frontend/src/modules/tasks/presentation/components/TaskCard.tsx
- Reemplazado el `<span>` con texto rojo suelto (`color: #DC2626`) por un badge pill `<span className="tag tag-red">Vencida</span>`.
- Se conserva la condición existente `isOverdue` (`task.isOverdue && task.status === 'Pendiente'`, linea 26) y la ubicacion dentro del bloque de metadatos.

### frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx
- En la lista "AGENDA DE HOY Y PENDIENTES", se envolvio el titulo en un contenedor flex (`display: flex; align-items: center; gap: 8`) y se agrego `<span className="tag tag-red">Vencida</span>` junto al titulo cuando `task.isOverdue && task.status === 'Pendiente'`.
- Se conserva el coloreado rojo del titulo (`titleColor`) y el layout flex de la fila.

## Verificacion
- `cd frontend && npx tsc --noEmit` -> EXIT 0, sin errores.
- No se modifico backend ni otros archivos.

## Checkpoints
- [x] TaskCard muestra badge `tag tag-red` "Vencida" cuando vencida y pendiente.
- [x] MiDiaPage muestra badge `tag tag-red` "Vencida" en tareas vencidas y pendientes.
- [x] No se rompe layout ni coloreado de titulo en Mi Dia.
- [x] No se modifica backend ni otros archivos.
- [x] tsc --noEmit sin errores.
