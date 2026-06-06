import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function AgendaPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Agenda y Tareas</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 06-tasks</p>
    </div>
  );
}

export const agendaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/agenda',
  component: AgendaPage,
});
