import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function ClientesPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Clientes / Prospectos</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 04-clients</p>
    </div>
  );
}

export const clientesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/clientes',
  component: ClientesPage,
});
