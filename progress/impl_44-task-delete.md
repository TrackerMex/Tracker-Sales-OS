# impl_44-task-delete

## Resumen
Se agregó la acción de eliminar tarea en Agenda, siguiendo el mismo patrón de ownership check y AlertDialog que las acciones Completar/Reactivar existentes.

## Archivos creados

- `backend/src/modules/tasks/application/use-cases/delete-task.use-case.ts`
  - `DeleteTaskUseCase implements IUseCase<DeleteTaskInput, void>`
  - `DeleteTaskInput = { taskId: string; sellerId: string }`
  - `findById` -> `NotFoundException` si no existe -> ownership check `task.sellerId !== input.sellerId` -> `ForbiddenException('You can only delete your own tasks')` -> `taskRepo.softDelete(taskId)`.

- `frontend/src/modules/tasks/application/hooks/useDeleteTask.ts`
  - Calcado de `useReactivateTask.ts`: usa `useAppStore` para resolver `sellerId`, invalida `['tasks']` en `onSuccess`.

## Archivos modificados

- `backend/src/modules/tasks/presentation/tasks.controller.ts`
  - Import de `Delete` (nestjs/common) y `DeleteTaskUseCase`.
  - Inyectado `deleteTask: DeleteTaskUseCase` en el constructor.
  - Nuevo endpoint `@Delete(':id')` con `@Roles(Admin, Director, Seller)`, recibe `taskId` por `@Param` y `sellerId` por `@Body('sellerId')`.

- `backend/src/modules/tasks/tasks.module.ts`
  - Import y registro de `DeleteTaskUseCase` como provider.

- `frontend/src/modules/tasks/infrastructure/tasks.api.ts`
  - `deleteTask(taskId, sellerId): Promise<void>` -> `api.delete(\`/tasks/${taskId}\`, { data: { sellerId } })`.

- `frontend/src/modules/tasks/presentation/components/TaskCard.tsx`
  - Prop `onDelete: (id: string) => void` agregada a `TaskCardProps`.
  - Nuevo botón "Eliminar" envuelto en su propio `AlertDialog`, visible SIEMPRE (fuera del condicional Pendiente/Completada, al final del contenedor de acciones). Estilo inline con borde/texto rojo (`#FCA5A5` / `#DC2626`) consistente con el resto del archivo (`style={{...}}`, no Tailwind).
  - Título: "¿Eliminar esta tarea?", descripción indica que es irreversible y permanente.

- `frontend/src/modules/tasks/presentation/pages/AgendaPage.tsx`
  - Import y uso de `useDeleteTask`.
  - `handleDelete(taskId)` con `toast.success("Tarea eliminada")` / `toast.error("No se pudo eliminar la tarea")`, mismo patrón que `handleReactivate`.
  - `onDelete={handleDelete}` pasado al `<TaskCard>` en la vista de lista.

## Decisiones tomadas

- El botón Eliminar se agregó como elemento hermano al final del contenedor de acciones (después del bloque condicional Completar/Reactivar), para que quede visible en ambos estados de la tarea sin duplicar el AlertDialog dentro de cada rama del condicional.
- No se tocó `task.repository.impl.ts` (softDelete genérico ya funcional) ni `frontend/src/modules/mi-dia/**` (solo importa `TYPE_TAG` de `TaskCard.tsx`, no el componente, por lo que no requiere cambios).
- No se usó `confirm()`/`alert()` nativo; se reutilizó el mismo componente `AlertDialog` (shadcn) ya usado por Completar/Reactivar.

## Resultado de verificación

- `cd backend && npx tsc --noEmit` → sin errores (solo warnings de npm sobre config no relacionados).
- `cd frontend && npx tsc --noEmit` → sin errores (solo warnings de npm sobre config no relacionados).
