# Impl 43-mi-dia-task-completion-validation

## Objetivo
Igualar en Mi Día el comportamiento de completar una tarea que ya tiene AgendaPage/TaskCard: confirmación antes de completar (AlertDialog), feedback de éxito/error (toast) y navegación a registrar la actividad derivada. Sin cambios de backend, sin migraciones, sin tests nuevos. `AgendaPage.tsx` y `TaskCard.tsx` no se tocaron, solo se leyeron como referencia.

## Archivo modificado

### frontend/src/modules/mi-dia/presentation/pages/MiDiaPage.tsx

- Imports agregados:
  - `{ toast } from 'sonner'`.
  - `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` desde `@/components/ui/alert-dialog`.
  - `type { Task }` desde `../../../tasks/domain/tasks.types` (mismo patrón relativo que `useTodayTasks`/`useCompleteTask`/`TaskCard`).
- Función nueva `handleCompleteTask(task: Task)`, agregada junto a la lógica del componente (después de los early returns, antes de `taskList = tasks ?? []`), idéntica en estructura a `handleComplete` de `AgendaPage.tsx`:
  ```tsx
  function handleCompleteTask(task: Task) {
    completeTask(task.id, {
      onSuccess: (completedTask) => {
        toast.success('Tarea completada');
        void navigate({
          to: '/actividades/nueva',
          search: {
            ...(completedTask.clientId ? { clientId: completedTask.clientId } : {}),
            ...(task.title ? { taskTitle: task.title } : {}),
            taskId: task.id,
          },
        });
      },
      onError: () => toast.error('No se pudo completar la tarea'),
    });
  }
  ```
  Reusa `navigate` ya existente en el componente (línea ~192, `const navigate = useNavigate()`), no se duplicó. Recibe la tarea completa del scope del `.map`, sin buscarla por id.
- Botón "Completar" (dentro de `{task.status === 'Pendiente' && !isAdminOrDirector && (...)}`) reemplazado por el mismo botón (mismas clases `btn-green btn-sm`, `disabled={isThisTaskPending}`, `aria-label`, `aria-busy`) envuelto en `AlertDialog`, siguiendo el patrón exacto de `TaskCard.tsx` líneas 110-131:
  ```tsx
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button className="btn-green btn-sm" disabled={isThisTaskPending} aria-label={...} aria-busy={isThisTaskPending}>
        {isThisTaskPending ? '...' : 'Completar'}
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Completar esta tarea?</AlertDialogTitle>
        <AlertDialogDescription>
          Se marcará como completada y se abrirá el registro de actividad. Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleCompleteTask(task)}>
          Sí, completar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
- El `onClick={() => completeTask(task.id)}` directo se eliminó del botón; ahora el click solo abre el diálogo, y `completeTask` se dispara desde `handleCompleteTask` al confirmar en `AlertDialogAction`.

## Decisiones de estilo
- Mismo texto de confirmación que `TaskCard.tsx` ("¿Completar esta tarea?" / "Se marcará como completada y se abrirá el registro de actividad. Esta acción no se puede deshacer." / "Cancelar" / "Sí, completar"), sin variaciones.
- No se cambió la condición que decide si el botón se muestra (`task.status === 'Pendiente' && !isAdminOrDirector`).
- No se agregaron toasts ni navegación en ningún otro lugar del archivo (los botones "+ Crear tarea" y "+ Nuevo prospecto" quedaron intactos).

## Verificación
- `cd frontend && npx tsc --noEmit` -> EXIT 0, sin errores (solo warnings de npm sobre config de `node-linker`/`shamefully-hoist`, no relacionados a TypeScript).
- No se modificó backend, no se agregaron/tocaron tests.
- `AgendaPage.tsx` y `TaskCard.tsx` no se modificaron.

## Checkpoints
- [x] Click en "Completar" abre `AlertDialog` de confirmación en vez de completar directo.
- [x] Confirmar en el diálogo (`AlertDialogAction`) dispara `completeTask(task.id)`.
- [x] `onSuccess` muestra `toast.success('Tarea completada')` y navega a `/actividades/nueva` con `clientId`/`taskTitle`/`taskId` en `search`.
- [x] `onError` muestra `toast.error('No se pudo completar la tarea')`.
- [x] `disabled`/`aria-busy` del botón siguen atados a `isThisTaskPending` (estado de mutación en curso).
- [x] Condición de visibilidad del botón sin cambios.
- [x] tsc --noEmit sin errores.
