import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

export const reportesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reportes',
  component: () => (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Reportes Dirección</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 13-reports</p>
    </div>
  ),
});
