import type { OverdueTask } from '../../domain/dashboard.types';

interface OverdueTasksListProps {
  tasks: OverdueTask[];
  isLoading: boolean;
}

export function OverdueTasksList({ tasks, isLoading }: OverdueTasksListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No hay seguimientos vencidos.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task.taskId} className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
            <p className="text-xs text-slate-500">{task.sellerName}</p>
          </div>
          <span className="ml-4 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            {task.daysOverdue}d vencido
          </span>
        </li>
      ))}
    </ul>
  );
}
