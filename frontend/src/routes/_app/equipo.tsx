import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function EquipoPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Equipo Comercial</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 03-users-sellers</p>
    </div>
  );
}

export const equipoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/equipo',
  component: EquipoPage,
});
